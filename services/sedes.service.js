'use strict';
const { ejecutar } = require('../config/db');
const { e } = require('../errors/AppError');

/** Sedes visibles: el acceso consolidado (sedeId NULL) ve todas; un usuario de sede solo la suya. */
async function listar(sedeId = null) {
  const r = await ejecutar(
    'SELECT id, nombre, activa, creado_en FROM sedes WHERE ($1::int IS NULL OR id = $1::int) ORDER BY nombre, id',
    [sedeId]);
  return r.rows;
}

async function crear({ nombre }) {
  // Upsert por la restricción UNIQUE del nombre: crear dos veces la misma sede es un 409 legible, no un error técnico.
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

module.exports = { listar, crear, cambiarActiva };
