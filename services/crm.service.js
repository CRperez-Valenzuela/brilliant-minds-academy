'use strict';
const { ejecutar, conTransaccion } = require('../config/db');
const { e } = require('../errors/AppError');
const { aFechaSql, hoyCaracas } = require('../utils/fechas');

const ESTADOS = ['Activo', 'Moroso', 'Fuera de la Academia', 'Pendiente por Validación Administrativa'];

// Alcance multi-sede: `sedeId` NULL = consolidado; un entero restringe a esa sede (patrón `($n::int IS NULL OR x.sede_id = $n::int)`).
// Los controladores lo obtienen con utils/alcance.js (fail-closed).

/** Conteo en tiempo real de las tres clasificaciones críticas (+ pendientes de validación). */
async function resumen(sedeId = null) {
  const r = await ejecutar('SELECT estado_dinamico, COUNT(*)::int AS n FROM vw_estudiantes_estado WHERE ($1::int IS NULL OR sede_id = $1::int) GROUP BY estado_dinamico', [sedeId]);
  const base = { Activo: 0, Moroso: 0, 'Fuera de la Academia': 0, 'Pendiente por Validación Administrativa': 0 };
  for (const row of r.rows) base[row.estado_dinamico] = row.n;
  return {
    activos: base.Activo,
    morosos: base.Moroso,
    fuera_de_la_academia: base['Fuera de la Academia'],
    pendientes_validacion: base['Pendiente por Validación Administrativa'],
    total: Object.values(base).reduce((a, b) => a + b, 0),
  };
}

async function listar({ estado, q, offset, limite, sedeId = null }) {
  // Escapa los comodines de LIKE (\ % _) y busca sin distinguir mayúsculas (ILIKE; el esquema anterior era insensible por colación).
  const busqueda = q ? `%${q.replace(/[\\%_]/g, '\\$&')}%` : null;
  const filtroParams = [estado || null, busqueda, sedeId];
  const filtro = `WHERE ($1::text IS NULL OR v.estado_dinamico = $1::text)
                    AND ($2::text IS NULL OR v.nombres ILIKE $2::text OR v.apellidos ILIKE $2::text OR r.cedula ILIKE $2::text OR r.apellidos ILIKE $2::text)
                    AND ($3::int IS NULL OR v.sede_id = $3::int)`;
  const [items, total] = await Promise.all([
    ejecutar(
      `SELECT v.id, v.nombres, v.apellidos, v.grado_solicitado, v.estado_dinamico, v.estatus_pago, v.cuotas_vencidas, v.deuda_vencida_usd,
              v.proximo_vencimiento,
              r.id AS representante_id, r.nombres || ' ' || r.apellidos AS representante, r.telefono AS telefono_representante
       FROM vw_estudiantes_estado v JOIN representantes r ON r.id = v.representante_id
       ${filtro}
       ORDER BY v.apellidos, v.nombres, v.id
       LIMIT $4 OFFSET $5`, [...filtroParams, limite, offset]),
    ejecutar(`SELECT COUNT(*)::int AS n FROM vw_estudiantes_estado v JOIN representantes r ON r.id = v.representante_id ${filtro}`, filtroParams),
  ]);
  return { items: items.rows, total: total.rows[0].n };
}

async function detalle(id, sedeId = null) {
  const [est, cuotas, docs, pagos] = await Promise.all([
    ejecutar(
      `SELECT e.*, v.estado_dinamico, v.estatus_pago, v.deuda_vencida_usd,
              r.nombres AS rep_nombres, r.apellidos AS rep_apellidos, r.cedula AS rep_cedula, r.email AS rep_email, r.telefono AS rep_telefono
       FROM estudiantes e
       JOIN vw_estudiantes_estado v ON v.id = e.id
       JOIN representantes r ON r.id = e.representante_id
       WHERE e.id = $1 AND ($2::int IS NULL OR e.sede_id = $2::int)`, [id, sedeId]),
    ejecutar('SELECT id, tipo, concepto, monto_usd, fecha_vencimiento, estado FROM cuotas WHERE estudiante_id = $1 ORDER BY fecha_vencimiento DESC, id DESC', [id]),
    ejecutar('SELECT id, tipo, nombre_archivo, mime_type, tamano_bytes, drive_url, subido_en FROM documentos_estudiante WHERE estudiante_id = $1', [id]),
    ejecutar('SELECT id, cuota_id, referencia, metodo_pago, monto_usd, monto_bs, tasa_bcv, estado, declarado_en FROM pagos_referencias WHERE estudiante_id = $1 ORDER BY declarado_en DESC', [id]),
  ]);
  if (!est.rowCount) throw e.noEncontrado('El estudiante');
  // fecha_nacimiento ya llega como 'AAAA-MM-DD' (DATE sin conversión a Date: ver config/db.js).
  return { ...est.rows[0], cuotas: cuotas.rows, documentos: docs.rows, pagos: pagos.rows };
}

/** Pasa al estudiante a "Fuera de la Academia" (retirado/inactivo). Las cuotas pendientes quedan anuladas para no generar morosidad. */
async function retirar({ id, motivo, fecha, sedeId = null }) {
  return conTransaccion(async (tx) => {
    const r = await ejecutar(
      `UPDATE estudiantes SET estatus_academico = 'Fuera de la Academia', fecha_retiro = $2, motivo_retiro = $3, actualizado_en = NOW()
        WHERE id = $1 AND estatus_academico <> 'Fuera de la Academia' AND ($4::int IS NULL OR sede_id = $4::int)
        RETURNING id`,
      [id, aFechaSql(fecha || hoyCaracas()), motivo || null, sedeId], tx);
    if (!r.rowCount) {
      const existe = await ejecutar('SELECT 1 AS x FROM estudiantes WHERE id = $1 AND ($2::int IS NULL OR sede_id = $2::int)', [id, sedeId], tx);
      if (!existe.rowCount) throw e.noEncontrado('El estudiante');
      throw e.conflicto('YA_RETIRADO', 'El estudiante ya está fuera de la academia.');
    }
    await ejecutar(`UPDATE cuotas SET estado = 'Anulada' WHERE estudiante_id = $1 AND estado = 'Pendiente'`, [id], tx);
    return { id, estatus_academico: 'Fuera de la Academia' };
  });
}

async function reactivar({ id, sedeId = null }) {
  const r = await ejecutar(
    `UPDATE estudiantes SET estatus_academico = 'Activo', fecha_retiro = NULL, motivo_retiro = NULL, actualizado_en = NOW()
      WHERE id = $1 AND estatus_academico = 'Fuera de la Academia' AND ($2::int IS NULL OR sede_id = $2::int)
      RETURNING id`, [id, sedeId]);
  if (!r.rowCount) throw e.conflicto('NO_REACTIVABLE', 'Solo se puede reactivar a un estudiante que esté fuera de la academia.');
  return { id, estatus_academico: 'Activo' };
}

module.exports = { ESTADOS, resumen, listar, detalle, retirar, reactivar };
