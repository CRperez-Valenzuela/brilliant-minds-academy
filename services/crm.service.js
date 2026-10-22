'use strict';
const { sql, ejecutar, conTransaccion } = require('../config/db');
const { e } = require('../errors/AppError');
const { aFechaSql, hoyCaracas } = require('../utils/fechas');

const ESTADOS = ['Activo', 'Moroso', 'Fuera de la Academia', 'Pendiente por Validación Administrativa'];

/** Conteo en tiempo real de las tres clasificaciones críticas (+ pendientes de validación). */
async function resumen() {
  const r = await ejecutar('SELECT estado_dinamico, COUNT(*) AS n FROM dbo.vw_estudiantes_estado GROUP BY estado_dinamico');
  const base = { Activo: 0, Moroso: 0, 'Fuera de la Academia': 0, 'Pendiente por Validación Administrativa': 0 };
  for (const row of r.recordset) base[row.estado_dinamico] = row.n;
  return {
    activos: base.Activo,
    morosos: base.Moroso,
    fuera_de_la_academia: base['Fuera de la Academia'],
    pendientes_validacion: base['Pendiente por Validación Administrativa'],
    total: Object.values(base).reduce((a, b) => a + b, 0),
  };
}

async function listar({ estado, q, offset, limite }) {
  const busqueda = q ? `%${q.replace(/[%_[]/g, (c) => `[${c}]`)}%` : null; // escapa comodines LIKE
  const params = { estado: [sql.NVarChar(45), estado || null], q: [sql.NVarChar(110), busqueda], offset: [sql.Int, offset], limite: [sql.Int, limite] };
  const filtro = `WHERE (@estado IS NULL OR v.estado_dinamico = @estado)
                    AND (@q IS NULL OR v.nombres LIKE @q OR v.apellidos LIKE @q OR r.cedula LIKE @q OR r.apellidos LIKE @q)`;
  const [items, total] = await Promise.all([
    ejecutar(
      `SELECT v.id, v.nombres, v.apellidos, v.grado_solicitado, v.estado_dinamico, v.estatus_pago, v.cuotas_vencidas, v.deuda_vencida_usd,
              CONVERT(char(10), v.proximo_vencimiento, 23) AS proximo_vencimiento,
              r.id AS representante_id, r.nombres + N' ' + r.apellidos AS representante, r.telefono AS telefono_representante
       FROM dbo.vw_estudiantes_estado v JOIN dbo.representantes r ON r.id = v.representante_id
       ${filtro}
       ORDER BY v.apellidos, v.nombres, v.id
       OFFSET @offset ROWS FETCH NEXT @limite ROWS ONLY`, params),
    ejecutar(`SELECT COUNT(*) AS n FROM dbo.vw_estudiantes_estado v JOIN dbo.representantes r ON r.id = v.representante_id ${filtro}`,
      { estado: params.estado, q: params.q }),
  ]);
  return { items: items.recordset, total: total.recordset[0].n };
}

async function detalle(id) {
  const [est, cuotas, docs, pagos] = await Promise.all([
    ejecutar(
      `SELECT e.*, CONVERT(char(10), e.fecha_nacimiento, 23) AS fecha_nacimiento_iso, v.estado_dinamico, v.estatus_pago, v.deuda_vencida_usd,
              r.nombres AS rep_nombres, r.apellidos AS rep_apellidos, r.cedula AS rep_cedula, r.email AS rep_email, r.telefono AS rep_telefono
       FROM dbo.estudiantes e
       JOIN dbo.vw_estudiantes_estado v ON v.id = e.id
       JOIN dbo.representantes r ON r.id = e.representante_id
       WHERE e.id = @id`, { id: [sql.Int, id] }),
    ejecutar(`SELECT id, tipo, concepto, monto_usd, CONVERT(char(10), fecha_vencimiento, 23) AS fecha_vencimiento, estado FROM dbo.cuotas WHERE estudiante_id = @id ORDER BY fecha_vencimiento DESC, id DESC`, { id: [sql.Int, id] }),
    ejecutar('SELECT id, tipo, nombre_archivo, mime_type, tamano_bytes, drive_url, subido_en FROM dbo.documentos_estudiante WHERE estudiante_id = @id', { id: [sql.Int, id] }),
    ejecutar('SELECT id, cuota_id, referencia, metodo_pago, monto_usd, monto_bs, tasa_bcv, estado, declarado_en FROM dbo.pagos_referencias WHERE estudiante_id = @id ORDER BY declarado_en DESC', { id: [sql.Int, id] }),
  ]);
  if (!est.recordset.length) throw e.noEncontrado('El estudiante');
  const { fecha_nacimiento, ...resto } = est.recordset[0];
  return { ...resto, fecha_nacimiento: resto.fecha_nacimiento_iso, cuotas: cuotas.recordset, documentos: docs.recordset, pagos: pagos.recordset };
}

/** Pasa al estudiante a "Fuera de la Academia" (retirado/inactivo). Las cuotas pendientes quedan anuladas para no generar morosidad. */
async function retirar({ id, motivo, fecha }) {
  return conTransaccion(async (tx) => {
    const r = await ejecutar(
      `UPDATE dbo.estudiantes SET estatus_academico = N'Fuera de la Academia', fecha_retiro = @f, motivo_retiro = @m, actualizado_en = SYSUTCDATETIME()
       OUTPUT inserted.id
       WHERE id = @id AND estatus_academico <> N'Fuera de la Academia'`,
      { id: [sql.Int, id], f: [sql.Date, aFechaSql(fecha || hoyCaracas())], m: [sql.NVarChar(300), motivo || null] }, tx);
    if (!r.recordset.length) {
      const existe = await ejecutar('SELECT 1 AS x FROM dbo.estudiantes WHERE id = @id', { id: [sql.Int, id] }, tx);
      if (!existe.recordset.length) throw e.noEncontrado('El estudiante');
      throw e.conflicto('YA_RETIRADO', 'El estudiante ya está fuera de la academia.');
    }
    await ejecutar(`UPDATE dbo.cuotas SET estado = N'Anulada' WHERE estudiante_id = @id AND estado = N'Pendiente'`, { id: [sql.Int, id] }, tx);
    return { id, estatus_academico: 'Fuera de la Academia' };
  });
}

async function reactivar({ id }) {
  const r = await ejecutar(
    `UPDATE dbo.estudiantes SET estatus_academico = N'Activo', fecha_retiro = NULL, motivo_retiro = NULL, actualizado_en = SYSUTCDATETIME()
     OUTPUT inserted.id
     WHERE id = @id AND estatus_academico = N'Fuera de la Academia'`, { id: [sql.Int, id] });
  if (!r.recordset.length) throw e.conflicto('NO_REACTIVABLE', 'Solo se puede reactivar a un estudiante que esté fuera de la academia.');
  return { id, estatus_academico: 'Activo' };
}

module.exports = { ESTADOS, resumen, listar, detalle, retirar, reactivar };
