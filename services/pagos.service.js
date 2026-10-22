'use strict';
const { sql, ejecutar, conTransaccion } = require('../config/db');
const { e } = require('../errors/AppError');
const { usdABs } = require('../utils/dinero');

/**
 * Registra la referencia bancaria declarada por el representante contra una cuota.
 * Reclama la cuota de forma atómica (Pendiente → En Revisión) para que dos clics simultáneos no generen dos pagos.
 * `ejecutor` = transacción activa o undefined (usa el pool).
 */
async function declararReferencia({ estudianteId, cuotaId, referencia, metodo, tasa }, ejecutor) {
  const reclamo = await ejecutar(
    `UPDATE dbo.cuotas SET estado = N'En Revisión'
     OUTPUT inserted.monto_usd
     WHERE id = @cuota AND estudiante_id = @est AND estado = N'Pendiente'`,
    { cuota: [sql.Int, cuotaId], est: [sql.Int, estudianteId] },
    ejecutor,
  );
  if (!reclamo.recordset.length) {
    const existe = await ejecutar('SELECT estado FROM dbo.cuotas WHERE id = @cuota AND estudiante_id = @est',
      { cuota: [sql.Int, cuotaId], est: [sql.Int, estudianteId] }, ejecutor);
    if (!existe.recordset.length) throw e.noEncontrado('La cuota');
    throw e.conflicto('CUOTA_NO_PAGABLE', `La cuota está en estado "${existe.recordset[0].estado}" y no admite una nueva referencia.`);
  }
  const montoUsd = Number(reclamo.recordset[0].monto_usd);
  const montoBs = usdABs(montoUsd, tasa);
  const ins = await ejecutar(
    `INSERT INTO dbo.pagos_referencias (cuota_id, estudiante_id, referencia, metodo_pago, monto_usd, tasa_bcv, monto_bs)
     OUTPUT inserted.id
     VALUES (@cuota, @est, @ref, @metodo, @usd, @tasa, @bs)`,
    {
      cuota: [sql.Int, cuotaId], est: [sql.Int, estudianteId], ref: [sql.NVarChar(40), referencia], metodo: [sql.NVarChar(20), metodo],
      usd: [sql.Decimal(10, 2), montoUsd], tasa: [sql.Decimal(18, 4), tasa], bs: [sql.Decimal(18, 2), montoBs],
    },
    ejecutor,
  );
  return { pagoId: ins.recordset[0].id, montoUsd, montoBs };
}

/** Bandeja de auditoría: cronológica (la más antigua primero) para validar rápido contra las cuentas. */
async function bandeja({ estado = 'Por Validar', offset, limite }) {
  const params = { estado: [sql.NVarChar(15), estado || null], offset: [sql.Int, offset], limite: [sql.Int, limite] };
  const [items, total] = await Promise.all([
    ejecutar(
      `SELECT p.id, p.referencia, p.metodo_pago, p.monto_usd, p.tasa_bcv, p.monto_bs, p.estado, p.declarado_en, p.revisado_en, p.nota_revision,
              e.id AS estudiante_id, e.nombres + N' ' + e.apellidos AS estudiante,
              r.nombres + N' ' + r.apellidos AS representante, r.telefono AS telefono_representante,
              c.id AS cuota_id, c.concepto, c.tipo AS tipo_cuota, CONVERT(char(10), c.fecha_vencimiento, 23) AS fecha_vencimiento
       FROM dbo.pagos_referencias p
       JOIN dbo.estudiantes e ON e.id = p.estudiante_id
       JOIN dbo.representantes r ON r.id = e.representante_id
       JOIN dbo.cuotas c ON c.id = p.cuota_id
       WHERE (@estado IS NULL OR p.estado = @estado)
       ORDER BY p.declarado_en ASC, p.id ASC
       OFFSET @offset ROWS FETCH NEXT @limite ROWS ONLY`, params),
    ejecutar('SELECT COUNT(*) AS n FROM dbo.pagos_referencias WHERE (@estado IS NULL OR estado = @estado)', { estado: params.estado }),
  ]);
  return { items: items.recordset, total: total.recordset[0].n };
}

async function cargarPendiente(tx, pagoId) {
  const r = await ejecutar(
    `SELECT id, estado, cuota_id, estudiante_id FROM dbo.pagos_referencias WITH (UPDLOCK, ROWLOCK) WHERE id = @id`,
    { id: [sql.Int, pagoId] }, tx);
  const p = r.recordset[0];
  if (!p) throw e.noEncontrado('El pago');
  if (p.estado !== 'Por Validar') throw e.conflicto('PAGO_YA_PROCESADO', `Este pago ya fue ${p.estado.toLowerCase()}.`);
  return p;
}

/**
 * Aprueba la referencia: pago Aprobada, cuota Pagada y, si era la matrícula, el estudiante pasa de
 * "Pendiente por Validación Administrativa" a "Activo". Devuelve el estatus de pago recalculado en tiempo real
 * ("Al día" solo si no quedan otras cuotas vencidas).
 */
async function aprobar({ pagoId, usuarioId, nota }) {
  return conTransaccion(async (tx) => {
    const p = await cargarPendiente(tx, pagoId);
    await ejecutar(
      `UPDATE dbo.pagos_referencias SET estado = N'Aprobada', revisado_por = @u, revisado_en = SYSUTCDATETIME(), nota_revision = @nota WHERE id = @id`,
      { id: [sql.Int, pagoId], u: [sql.Int, usuarioId], nota: [sql.NVarChar(300), nota || null] }, tx);
    await ejecutar(`UPDATE dbo.cuotas SET estado = N'Pagada' WHERE id = @c`, { c: [sql.Int, p.cuota_id] }, tx);
    await ejecutar(
      `UPDATE dbo.estudiantes SET estatus_academico = N'Activo', actualizado_en = SYSUTCDATETIME()
       WHERE id = @est AND estatus_academico = N'Pendiente por Validación Administrativa'
         AND EXISTS (SELECT 1 FROM dbo.cuotas WHERE id = @c AND tipo = N'MATRICULA')`,
      { est: [sql.Int, p.estudiante_id], c: [sql.Int, p.cuota_id] }, tx);
    const estado = await ejecutar('SELECT estado_dinamico, estatus_pago, deuda_vencida_usd FROM dbo.vw_estudiantes_estado WHERE id = @est',
      { est: [sql.Int, p.estudiante_id] }, tx);
    return { pagoId, estudianteId: p.estudiante_id, ...estado.recordset[0] };
  });
}

/** Rechaza la referencia (motivo obligatorio) y devuelve la cuota a "Pendiente" para que se pueda declarar otra. */
async function rechazar({ pagoId, usuarioId, nota }) {
  return conTransaccion(async (tx) => {
    const p = await cargarPendiente(tx, pagoId);
    await ejecutar(
      `UPDATE dbo.pagos_referencias SET estado = N'Rechazada', revisado_por = @u, revisado_en = SYSUTCDATETIME(), nota_revision = @nota WHERE id = @id`,
      { id: [sql.Int, pagoId], u: [sql.Int, usuarioId], nota: [sql.NVarChar(300), nota] }, tx);
    await ejecutar(`UPDATE dbo.cuotas SET estado = N'Pendiente' WHERE id = @c AND estado = N'En Revisión'`, { c: [sql.Int, p.cuota_id] }, tx);
    return { pagoId, estudianteId: p.estudiante_id, estado: 'Rechazada' };
  });
}

module.exports = { declararReferencia, bandeja, aprobar, rechazar };
