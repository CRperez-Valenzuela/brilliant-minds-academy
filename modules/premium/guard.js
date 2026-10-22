'use strict';
const { sql, ejecutar } = require('../../config/db');
const { AppError } = require('../../errors/AppError');
const { TOOLTIP_BLOQUEADO, porCodigo } = require('./catalogo');

const repoSql = {
  async leer(codigo) {
    const r = await ejecutar('SELECT nombre, precio_usd, habilitado FROM dbo.modulos_premium WHERE codigo = @c', { c: [sql.NVarChar(30), codigo] });
    return r.recordset[0] || null;
  },
  async leerTodos() {
    return (await ejecutar('SELECT codigo, nombre, descripcion, precio_usd, habilitado, habilitado_en FROM dbo.modulos_premium ORDER BY precio_usd')).recordset;
  },
};

/**
 * Candado de módulos premium. El estado se lee de la base (cache de 15 s para no consultar en cada petición).
 * Deshabilitado → 403 MODULO_PREMIUM_DESHABILITADO (con precio y tooltip para la UI). Si el codigo no existe, también se bloquea.
 */
function crearGuard({ repo = repoSql, ttlMs = 15_000, ahora = () => Date.now() } = {}) {
  const cache = new Map();

  async function estado(codigo) {
    const c = cache.get(codigo);
    if (c && ahora() - c.en < ttlMs) return c.valor;
    const fila = await repo.leer(codigo);
    const valor = fila ? { habilitado: Boolean(fila.habilitado), nombre: fila.nombre, precioUsd: Number(fila.precio_usd) } : { habilitado: false, nombre: codigo, precioUsd: null };
    cache.set(codigo, { valor, en: ahora() });
    return valor;
  }

  function requireModulo(codigo) {
    if (!porCodigo(codigo)) throw new Error(`[premium] Módulo desconocido: ${codigo}`); // error de programación: falla al montar las rutas
    return async (_req, _res, next) => {
      try {
        const m = await estado(codigo);
        if (!m.habilitado) {
          return next(new AppError(403, 'MODULO_PREMIUM_DESHABILITADO', TOOLTIP_BLOQUEADO, { modulo: codigo, nombre: m.nombre, precio_usd: m.precioUsd }));
        }
        return next();
      } catch (err) {
        return next(err);
      }
    };
  }

  const invalidar = () => cache.clear();
  return { requireModulo, estado, invalidar, repo };
}

module.exports = { crearGuard, guard: crearGuard() };
