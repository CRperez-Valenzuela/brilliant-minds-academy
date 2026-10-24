'use strict';
const { ejecutar, conTransaccion } = require('../config/db');
const { e } = require('../errors/AppError');
const { usdABs } = require('../utils/dinero');

/**
 * Registra la referencia bancaria declarada por el representante contra una cuota.
 * Reclama la cuota de forma atómica (Pendiente → En Revisión) para que dos clics simultáneos no generen dos pagos:
 * el segundo UPDATE espera el bloqueo de fila, reevalúa `estado = 'Pendiente'` y ya no encuentra la fila.
 * `ejecutor` = transacción activa. Sin ella, la operación abre la suya: el reclamo de la cuota y el INSERT de la referencia
 * son atómicos (si la referencia está duplicada, la cuota NO queda atascada en "En Revisión").
 */
async function declararReferencia({ estudianteId, cuotaId, referencia, metodo, tasa }, ejecutor) {
  if (!ejecutor) return conTransaccion((tx) => declararReferencia({ estudianteId, cuotaId, referencia, metodo, tasa }, tx));

  const reclamo = await ejecutar(
    `UPDATE cuotas SET estado = 'En Revisión'
      WHERE id = $1 AND estudiante_id = $2 AND estado = 'Pendiente'
      RETURNING monto_usd`,
    [cuotaId, estudianteId], ejecutor);
  if (!reclamo.rowCount) {
    const existe = await ejecutar('SELECT estado FROM cuotas WHERE id = $1 AND estudiante_id = $2', [cuotaId, estudianteId], ejecutor);
    if (!existe.rowCount) throw e.noEncontrado('La cuota');
    throw e.conflicto('CUOTA_NO_PAGABLE', `La cuota está en estado "${existe.rows[0].estado}" y no admite una nueva referencia.`);
  }
  const montoUsd = Number(reclamo.rows[0].monto_usd);
  const montoBs = usdABs(montoUsd, tasa);
  // PostgreSQL distingue mayúsculas: se normaliza para que "abc123" y "ABC123" cuenten como la MISMA referencia (índice único).
  const ins = await ejecutar(
    `INSERT INTO pagos_referencias (cuota_id, estudiante_id, referencia, metodo_pago, monto_usd, tasa_bcv, monto_bs)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [cuotaId, estudianteId, String(referencia).toUpperCase(), metodo, montoUsd, tasa, montoBs],
    ejecutor);
  return { pagoId: ins.rows[0].id, montoUsd, montoBs };
}

/** Bandeja de auditoría: cronológica (la más antigua primero) para validar rápido contra las cuentas. */
async function bandeja({ estado = 'Por Validar', offset, limite, sedeId = null }) {
  const filtro = '($1::text IS NULL OR p.estado = $1::text) AND ($2::int IS NULL OR p.sede_id = $2::int)';
  const [items, total] = await Promise.all([
    ejecutar(
      `SELECT p.id, p.referencia, p.metodo_pago, p.monto_usd, p.tasa_bcv, p.monto_bs, p.estado, p.declarado_en, p.revisado_en, p.nota_revision,
              e.id AS estudiante_id, e.nombres || ' ' || e.apellidos AS estudiante,
              r.nombres || ' ' || r.apellidos AS representante, r.telefono AS telefono_representante,
              c.id AS cuota_id, c.concepto, c.tipo AS tipo_cuota, c.fecha_vencimiento
       FROM pagos_referencias p
       JOIN estudiantes e ON e.id = p.estudiante_id
       JOIN representantes r ON r.id = e.representante_id
       JOIN cuotas c ON c.id = p.cuota_id
       WHERE ${filtro}
       ORDER BY p.declarado_en ASC, p.id ASC
       LIMIT $3 OFFSET $4`,
      [estado || null, sedeId, limite, offset]),
    ejecutar(`SELECT COUNT(*)::int AS n FROM pagos_referencias p WHERE ${filtro}`, [estado || null, sedeId]),
  ]);
  return { items: items.rows, total: total.rows[0].n };
}

/** Bloquea la fila del pago (FOR UPDATE) mientras dura la transacción: dos auditores no pueden procesar el mismo pago a la vez. */
async function cargarPendiente(tx, pagoId, sedeId = null) {
  // Un pago de otra sede se comporta como inexistente (404): no se revela que existe.
  const r = await ejecutar(
    'SELECT id, estado, cuota_id, estudiante_id FROM pagos_referencias WHERE id = $1 AND ($2::int IS NULL OR sede_id = $2::int) FOR UPDATE',
    [pagoId, sedeId], tx);
  const p = r.rows[0];
  if (!p) throw e.noEncontrado('El pago');
  if (p.estado !== 'Por Validar') throw e.conflicto('PAGO_YA_PROCESADO', `Este pago ya fue ${p.estado.toLowerCase()}.`);
  return p;
}

/**
 * Aprueba la referencia: pago Aprobada, cuota Pagada y, si era la matrícula, el estudiante pasa de
 * "Pendiente por Validación Administrativa" a "Activo". Devuelve el estatus de pago recalculado en tiempo real
 * ("Al día" solo si no quedan otras cuotas vencidas).
 */
async function aprobar({ pagoId, usuarioId, nota, sedeId = null }) {
  return conTransaccion(async (tx) => {
    const p = await cargarPendiente(tx, pagoId, sedeId);
    await ejecutar(
      `UPDATE pagos_referencias SET estado = 'Aprobada', revisado_por = $2, revisado_en = NOW(), nota_revision = $3 WHERE id = $1`,
      [pagoId, usuarioId, nota || null], tx);
    await ejecutar(`UPDATE cuotas SET estado = 'Pagada' WHERE id = $1`, [p.cuota_id], tx);
    await ejecutar(
      `UPDATE estudiantes SET estatus_academico = 'Activo', actualizado_en = NOW()
        WHERE id = $1 AND estatus_academico = 'Pendiente por Validación Administrativa'
          AND EXISTS (SELECT 1 FROM cuotas WHERE id = $2 AND tipo = 'MATRICULA')`,
      [p.estudiante_id, p.cuota_id], tx);
    const estado = await ejecutar(
      'SELECT estado_dinamico, estatus_pago, deuda_vencida_usd FROM vw_estudiantes_estado WHERE id = $1',
      [p.estudiante_id], tx);
    return { pagoId, estudianteId: p.estudiante_id, ...estado.rows[0] };
  });
}

/** Rechaza la referencia (motivo obligatorio) y devuelve la cuota a "Pendiente" para que se pueda declarar otra. */
async function rechazar({ pagoId, usuarioId, nota, sedeId = null }) {
  return conTransaccion(async (tx) => {
    const p = await cargarPendiente(tx, pagoId, sedeId);
    await ejecutar(
      `UPDATE pagos_referencias SET estado = 'Rechazada', revisado_por = $2, revisado_en = NOW(), nota_revision = $3 WHERE id = $1`,
      [pagoId, usuarioId, nota], tx);
    await ejecutar(`UPDATE cuotas SET estado = 'Pendiente' WHERE id = $1 AND estado = 'En Revisión'`, [p.cuota_id], tx);
    return { pagoId, estudianteId: p.estudiante_id, estado: 'Rechazada' };
  });
}

module.exports = { declararReferencia, bandeja, aprobar, rechazar };
