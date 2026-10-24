'use strict';
const { ejecutar } = require('../../config/db');
const { AppError } = require('../../errors/AppError');
const { TOOLTIP_BLOQUEADO, porCodigo } = require('./catalogo');

const MS_DIA = 86_400_000;

const repoSql = {
  async leer(codigo) {
    const r = await ejecutar(
      'SELECT nombre, precio_usd, habilitado, prueba_iniciada_en, expira_prueba_en FROM modulos_premium WHERE codigo = $1',
      [codigo]);
    return r.rows[0] || null;
  },
  async leerTodos() {
    return (await ejecutar(
      `SELECT codigo, nombre, descripcion, precio_usd, habilitado, habilitado_en, prueba_iniciada_en, expira_prueba_en
         FROM modulos_premium ORDER BY precio_usd`)).rows;
  },
  /** Bloqueo automático de UN módulo cuya prueba venció. El reloj que decide es el de la base (NOW()). Devuelve filas afectadas. */
  async bloquearVencida(codigo) {
    const r = await ejecutar(
      `UPDATE modulos_premium
          SET habilitado = FALSE, expira_prueba_en = NULL, actualizado_en = NOW()
        WHERE codigo = $1 AND habilitado = TRUE AND expira_prueba_en IS NOT NULL AND expira_prueba_en <= NOW()`,
      [codigo]);
    return r.rowCount;
  },
  /** Igual, para todos los módulos (lo usa el catálogo del panel para que la base converja). Devuelve filas afectadas. */
  async bloquearVencidas() {
    const r = await ejecutar(
      `UPDATE modulos_premium
          SET habilitado = FALSE, expira_prueba_en = NULL, actualizado_en = NOW()
        WHERE habilitado = TRUE AND expira_prueba_en IS NOT NULL AND expira_prueba_en <= NOW()`);
    return r.rowCount;
  },
};

/**
 * Estado efectivo de un módulo a partir de su fila y la hora `ahoraMs` (función pura, sin acceso a la base):
 *   - sin fila / habilitado = false           → bloqueado
 *   - habilitado y sin expira_prueba_en       → habilitado permanente (contratado)
 *   - habilitado y expira_prueba_en > ahora   → en prueba vigente (con días restantes, redondeados hacia arriba)
 *   - habilitado y expira_prueba_en <= ahora  → prueba vencida (`vencida: true`): hay que bloquearlo en la base
 */
function estadoEfectivo(fila, ahoraMs, codigo = '') {
  if (!fila) return { habilitado: false, vencida: false, enPrueba: false, expiraPruebaEn: null, diasRestantes: null, nombre: codigo, precioUsd: null, motivo: 'NO_REGISTRADO' };
  const base = { nombre: fila.nombre, precioUsd: Number(fila.precio_usd) };
  const expMs = fila.expira_prueba_en ? new Date(fila.expira_prueba_en).getTime() : null;
  if (!fila.habilitado) {
    return { ...base, habilitado: false, vencida: false, enPrueba: false, expiraPruebaEn: null, diasRestantes: null, motivo: 'DESHABILITADO' };
  }
  if (expMs === null || Number.isNaN(expMs)) {
    return { ...base, habilitado: true, vencida: false, enPrueba: false, expiraPruebaEn: null, diasRestantes: null, motivo: null };
  }
  if (ahoraMs < expMs) {
    return { ...base, habilitado: true, vencida: false, enPrueba: true, expiraPruebaEn: new Date(expMs).toISOString(), diasRestantes: Math.ceil((expMs - ahoraMs) / MS_DIA), motivo: null };
  }
  return { ...base, habilitado: false, vencida: true, enPrueba: false, expiraPruebaEn: new Date(expMs).toISOString(), diasRestantes: 0, motivo: 'PRUEBA_EXPIRADA' };
}

/**
 * Candado de módulos premium. El estado se lee de la base (cache de 15 s para no consultar en cada petición), pero la
 * vigencia de la prueba se evalúa en CADA petición con la hora actual: una prueba que vence dentro de la ventana de cache
 * se bloquea igual. Al detectar una prueba vencida actualiza `habilitado = FALSE` en la base (y limpia expira_prueba_en)
 * y responde 403 MODULO_PREMIUM_DESHABILITADO. Si el codigo no existe en la base, también se bloquea.
 */
function crearGuard({ repo = repoSql, ttlMs = 15_000, ahora = () => Date.now() } = {}) {
  const cache = new Map();

  async function leerFila(codigo, fresco) {
    const c = cache.get(codigo);
    if (!fresco && c && ahora() - c.en < ttlMs) return c.fila;
    const fila = await repo.leer(codigo);
    cache.set(codigo, { fila, en: ahora() });
    return fila;
  }

  /** Evalúa un módulo (con efecto secundario único: bloquea en la base si su prueba venció). Nunca lanza por el bloqueo. */
  async function evaluar(codigo, { fresco = false } = {}) {
    const fila = await leerFila(codigo, fresco);
    const e = estadoEfectivo(fila, ahora(), codigo);
    if (e.vencida) {
      try {
        await repo.bloquearVencida(codigo);
      } catch (err) {
        // Fail-closed: aunque no se pudo persistir el bloqueo, el acceso se niega y el siguiente intento lo reintenta.
        console.error(`[premium] No se pudo persistir el bloqueo de la prueba vencida (${codigo}):`, err.message);
      }
      cache.set(codigo, { fila: { ...fila, habilitado: false, expira_prueba_en: null }, en: ahora() });
    }
    return e;
  }

  /** Compatibilidad: estado simple { habilitado, nombre, precioUsd } (+ datos de la prueba). */
  const estado = (codigo, opciones) => evaluar(codigo, opciones);

  function requireModulo(codigo) {
    if (!porCodigo(codigo)) throw new Error(`[premium] Módulo desconocido: ${codigo}`); // error de programación: falla al montar las rutas
    return async (_req, _res, next) => {
      try {
        const m = await evaluar(codigo);
        if (!m.habilitado) {
          const detalles = { modulo: codigo, nombre: m.nombre, precio_usd: m.precioUsd };
          if (m.vencida) detalles.motivo = 'PRUEBA_EXPIRADA';
          return next(new AppError(403, 'MODULO_PREMIUM_DESHABILITADO', TOOLTIP_BLOQUEADO, detalles));
        }
        return next();
      } catch (err) {
        return next(err);
      }
    };
  }

  const invalidar = () => cache.clear();
  return { requireModulo, estado, evaluar, invalidar, repo };
}

module.exports = { crearGuard, estadoEfectivo, guard: crearGuard() };
