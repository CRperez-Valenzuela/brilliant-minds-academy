'use strict';
const { ejecutar } = require('../config/db');
const { AppError, e } = require('../errors/AppError');
const { guard } = require('../modules/premium/guard');
const { TOOLTIP_BLOQUEADO, LIMITE_SEDES_BASE, MODULO_MULTI_SEDE } = require('../modules/premium/catalogo');

/** Sedes visibles: el acceso consolidado (sedeId NULL) ve todas; un usuario de sede solo la suya. */
async function listar(sedeId = null) {
  const r = await ejecutar(
    'SELECT id, nombre, activa, creado_en FROM sedes WHERE ($1::int IS NULL OR id = $1::int) ORDER BY nombre, id',
    [sedeId]);
  return r.rows;
}

/**
 * Regla del Core Base: hasta LIMITE_SEDES_BASE (2) sedes. Desde la tercera, MULTI_SEDE_PREMIUM debe estar habilitado o en prueba vigente
 * (si no → 403 MODULO_PREMIUM_DESHABILITADO). Esta comprobación responde con detalle; el trigger trg_sedes_limite_base (migración 008)
 * es la garantía definitiva frente a carreras y a cualquier camino que no pase por este servicio.
 */
async function exigirCupoDeSede() {
  const total = (await ejecutar('SELECT COUNT(*)::int AS n FROM sedes')).rows[0].n;
  if (total < LIMITE_SEDES_BASE) return;
  const modulo = await guard.evaluar(MODULO_MULTI_SEDE, { fresco: true }); // sin caché: una prueba vencida o un cambio comercial rige al instante
  if (modulo.habilitado) return;
  throw new AppError(403, 'MODULO_PREMIUM_DESHABILITADO', TOOLTIP_BLOQUEADO, {
    modulo: MODULO_MULTI_SEDE, nombre: modulo.nombre, precio_usd: modulo.precioUsd, limite_sedes_base: LIMITE_SEDES_BASE,
  });
}

async function crear({ nombre }) {
  // Un nombre repetido es un 409 legible (y se resuelve antes que el límite de sedes: no es una sede nueva).
  const existe = await ejecutar('SELECT 1 AS x FROM sedes WHERE nombre = $1', [nombre]);
  if (existe.rowCount) throw e.conflicto('SEDE_DUPLICADA', 'Ya existe una sede con ese nombre.');
  await exigirCupoDeSede();
  // Upsert por la restricción UNIQUE del nombre (carrera entre dos altas iguales). Si dos altas distintas compiten por el último cupo,
  // el trigger serializa y rechaza a la segunda (SQLSTATE BM403, traducido por middlewares/errorHandler a 403 MODULO_PREMIUM_DESHABILITADO).
  const r = await ejecutar(
    'INSERT INTO sedes (nombre) VALUES ($1) ON CONFLICT (nombre) DO NOTHING RETURNING id',
    [nombre]);
  if (!r.rowCount) throw e.conflicto('SEDE_DUPLICADA', 'Ya existe una sede con ese nombre.');
  return { id: r.rows[0].id, nombre };
}

/** Cambia el estado activo/inactivo. Una sede inactiva no admite invitaciones nuevas ni envíos automáticos. */
async function cambiarActiva(id, activa) {
  const r = await ejecutar('UPDATE sedes SET activa = $2 WHERE id = $1 RETURNING id', [id, Boolean(activa)]);
  if (!r.rowCount) throw e.noEncontrado('La sede');
  return { id, activa: Boolean(activa) };
}

module.exports = { listar, crear, cambiarActiva, exigirCupoDeSede };
