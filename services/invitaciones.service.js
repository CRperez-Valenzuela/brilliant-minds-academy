'use strict';
const crypto = require('node:crypto');
const { ejecutar } = require('../config/db');
const cfg = require('../config/env');
const { AppError, e } = require('../errors/AppError');

const TOKEN_RE = /^[a-f0-9]{48}$/;
const DIAS_VIGENCIA_DEFECTO = 7;
const sha256 = (t) => crypto.createHash('sha256').update(t).digest('hex');

/**
 * Crea una invitación de inscripción de un solo uso. El token en claro (48 hex = 192 bits) solo se devuelve aquí, una vez; en la base
 * queda su SHA-256. `sedeId` es la sede que la invitación fija: el controlador la toma del alcance del usuario (utils/alcance.js).
 */
async function crear({ sedeId, nivel, dias = DIAS_VIGENCIA_DEFECTO, creadoPor }) {
  const sede = await ejecutar('SELECT activa FROM sedes WHERE id = $1', [sedeId]);
  if (!sede.rowCount) throw e.noEncontrado('La sede');
  if (!sede.rows[0].activa) throw e.reglaNegocio('SEDE_INACTIVA', 'La sede está inactiva: no admite invitaciones nuevas.');
  const token = crypto.randomBytes(24).toString('hex');
  const r = await ejecutar(
    `INSERT INTO invitaciones_inscripcion (token_hash, sede_id, nivel_asignado, expira_en, creado_por)
     VALUES ($1, $2, $3, NOW() + make_interval(days => $4::int), $5)
     RETURNING id, expira_en`,
    [sha256(token), sedeId, nivel, dias, creadoPor || null]);
  return {
    id: r.rows[0].id, sede_id: sedeId, nivel_asignado: nivel, expira_en: r.rows[0].expira_en,
    token, enlace: `${cfg.portalBaseUrl}/admisiones/?invitacion=${token}`,
  };
}

/** Listado (sin token ni hash). El estado efectivo distingue "Vencida" de "Pendiente" según el reloj de la base de datos. */
async function listar({ sedeId = null, estado = null, offset, limite }) {
  const filtro = `($1::int IS NULL OR i.sede_id = $1::int)
    AND ($2::text IS NULL OR (CASE WHEN i.estado = 'Pendiente' AND i.expira_en <= NOW() THEN 'Vencida' ELSE i.estado END) = $2::text)`;
  const [items, total] = await Promise.all([
    ejecutar(
      `SELECT i.id, i.sede_id, s.nombre AS sede, i.nivel_asignado, i.expira_en, i.usada_en, i.estudiante_id, i.creado_en,
              (CASE WHEN i.estado = 'Pendiente' AND i.expira_en <= NOW() THEN 'Vencida' ELSE i.estado END) AS estado
       FROM invitaciones_inscripcion i JOIN sedes s ON s.id = i.sede_id
       WHERE ${filtro} ORDER BY i.creado_en DESC, i.id DESC LIMIT $3 OFFSET $4`, [sedeId, estado, limite, offset]),
    ejecutar(`SELECT COUNT(*)::int AS n FROM invitaciones_inscripcion i WHERE ${filtro}`, [sedeId, estado]),
  ]);
  return { items: items.rows, total: total.rows[0].n };
}

async function revocar(id, sedeId = null) {
  const r = await ejecutar(
    `UPDATE invitaciones_inscripcion SET estado = 'Revocada'
      WHERE id = $1 AND estado = 'Pendiente' AND ($2::int IS NULL OR sede_id = $2::int)
      RETURNING id`, [id, sedeId]);
  if (r.rowCount) return { id, estado: 'Revocada' };
  const existe = await ejecutar('SELECT estado FROM invitaciones_inscripcion WHERE id = $1 AND ($2::int IS NULL OR sede_id = $2::int)', [id, sedeId]);
  if (!existe.rowCount) throw e.noEncontrado('La invitación');
  throw e.conflicto('INVITACION_NO_REVOCABLE', `La invitación ya está en estado "${existe.rows[0].estado}".`);
}

const invitacionInvalida = () =>
  new AppError(410, 'INVITACION_NO_VALIDA', 'La invitación no existe, ya fue utilizada, fue revocada o venció. Solicita una nueva a la academia.');

/** Resuelve un token en claro a { id, sede_id, sede, nivel_asignado }. Mismo error para inexistente / usada / revocada / vencida / sede inactiva. */
async function resolver(token, ejecutor) {
  if (!TOKEN_RE.test(String(token))) throw invitacionInvalida();
  const r = await ejecutar(
    `SELECT i.id, i.sede_id, s.nombre AS sede, i.nivel_asignado
       FROM invitaciones_inscripcion i JOIN sedes s ON s.id = i.sede_id
      WHERE i.token_hash = $1 AND i.estado = 'Pendiente' AND i.expira_en > NOW() AND s.activa = TRUE`,
    [sha256(token)], ejecutor);
  if (!r.rowCount) throw invitacionInvalida();
  return r.rows[0];
}

/**
 * Consumo ATÓMICO dentro de la transacción de la inscripción: el UPDATE condicionado a estado = 'Pendiente' toma el bloqueo de la
 * fila; dos envíos simultáneos con el mismo enlace se serializan y el segundo ya no encuentra la fila → 410, sin doble inscripción.
 * Si la inscripción falla después, el ROLLBACK devuelve la invitación a "Pendiente".
 */
async function consumir(tx, invitacionId) {
  const r = await ejecutar(
    `UPDATE invitaciones_inscripcion SET estado = 'Usada', usada_en = NOW()
      WHERE id = $1 AND estado = 'Pendiente' AND expira_en > NOW()
      RETURNING id`, [invitacionId], tx);
  if (!r.rowCount) throw invitacionInvalida();
}

async function vincularEstudiante(tx, invitacionId, estudianteId) {
  await ejecutar('UPDATE invitaciones_inscripcion SET estudiante_id = $2 WHERE id = $1', [invitacionId, estudianteId], tx);
}

module.exports = { crear, listar, revocar, resolver, consumir, vincularEstudiante, DIAS_VIGENCIA_DEFECTO };
