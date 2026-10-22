'use strict';
const { ejecutar } = require('../config/db');
const { e } = require('../errors/AppError');
const { hoyCaracas, aFechaSql, aInstanteSql, limitesPeriodo } = require('../utils/fechas');
const crm = require('./crm.service');

/**
 * Tablero financiero en tiempo real del período (por defecto, el mes en curso en hora de Caracas):
 *   cobrado = referencias aprobadas en el mes · vencido = saldo de cuotas ya vencidas sin pagar (acumulado)
 *   pendiente = cuotas del mes aún por vencer sin pagar · por_validar = referencias esperando auditoría
 */
async function tablero(periodo) {
  const lim = limitesPeriodo(periodo);
  // $1/$2 = intervalo [inicio, fin) del mes en instantes UTC · $3/$4 = primer y último día del mes · $5 = hoy (Caracas)
  const p = [aInstanteSql(lim.inicioUtc), aInstanteSql(lim.finUtc), aFechaSql(lim.desde), aFechaSql(lim.hasta), aFechaSql(hoyCaracas())];
  const [kpi, porDia, estudiantes] = await Promise.all([
    ejecutar(
      `SELECT
         (SELECT COALESCE(SUM(monto_usd), 0) FROM pagos_referencias WHERE estado = 'Aprobada' AND revisado_en >= $1::timestamptz AND revisado_en < $2::timestamptz) AS cobrado_usd,
         (SELECT COUNT(*)::int FROM pagos_referencias WHERE estado = 'Aprobada' AND revisado_en >= $1::timestamptz AND revisado_en < $2::timestamptz)                 AS cobrado_n,
         (SELECT COALESCE(SUM(monto_usd), 0) FROM cuotas WHERE estado IN ('Pendiente', 'En Revisión') AND fecha_vencimiento < $5::date)                               AS vencido_usd,
         (SELECT COUNT(*)::int FROM cuotas WHERE estado IN ('Pendiente', 'En Revisión') AND fecha_vencimiento < $5::date)                                              AS vencido_n,
         (SELECT COALESCE(SUM(monto_usd), 0) FROM cuotas WHERE estado IN ('Pendiente', 'En Revisión') AND fecha_vencimiento BETWEEN $3::date AND $4::date AND fecha_vencimiento >= $5::date) AS pendiente_usd,
         (SELECT COUNT(*)::int FROM cuotas WHERE estado IN ('Pendiente', 'En Revisión') AND fecha_vencimiento BETWEEN $3::date AND $4::date AND fecha_vencimiento >= $5::date)                AS pendiente_n,
         (SELECT COALESCE(SUM(monto_usd), 0) FROM cuotas WHERE estado <> 'Anulada' AND fecha_vencimiento BETWEEN $3::date AND $4::date)                               AS facturado_mes_usd,
         (SELECT COUNT(*)::int FROM pagos_referencias WHERE estado = 'Por Validar')                                                                                    AS por_validar_n`, p),
    ejecutar(
      `SELECT to_char(revisado_en AT TIME ZONE 'America/Caracas', 'YYYY-MM-DD') AS dia, SUM(monto_usd) AS cobrado_usd
       FROM pagos_referencias WHERE estado = 'Aprobada' AND revisado_en >= $1::timestamptz AND revisado_en < $2::timestamptz
       GROUP BY 1 ORDER BY 1`, p.slice(0, 2)),
    crm.resumen(),
  ]);
  const k = kpi.rows[0];
  return {
    periodo,
    cobrado: { monto_usd: Number(k.cobrado_usd), cantidad: k.cobrado_n },
    saldos_vencidos: { monto_usd: Number(k.vencido_usd), cantidad: k.vencido_n },
    cuentas_pendientes: { monto_usd: Number(k.pendiente_usd), cantidad: k.pendiente_n },
    facturado_mes_usd: Number(k.facturado_mes_usd),
    referencias_por_validar: k.por_validar_n,
    cobrado_por_dia: porDia.rows.map((r) => ({ dia: r.dia, monto_usd: Number(r.cobrado_usd) })),
    estudiantes,
  };
}

async function listarCuotas({ estudianteId, estado, offset, limite }) {
  const filtroParams = [estudianteId || null, estado || null];
  const filtro = 'WHERE ($1::int IS NULL OR c.estudiante_id = $1::int) AND ($2::text IS NULL OR c.estado = $2::text)';
  const [items, total] = await Promise.all([
    ejecutar(`SELECT c.id, c.estudiante_id, s.nombres || ' ' || s.apellidos AS estudiante, c.tipo, c.concepto, c.monto_usd,
                     c.fecha_vencimiento, c.estado
              FROM cuotas c JOIN estudiantes s ON s.id = c.estudiante_id ${filtro}
              ORDER BY c.fecha_vencimiento DESC, c.id DESC LIMIT $3 OFFSET $4`, [...filtroParams, limite, offset]),
    ejecutar(`SELECT COUNT(*)::int AS n FROM cuotas c ${filtro}`, filtroParams),
  ]);
  return { items: items.rows, total: total.rows[0].n };
}

async function crearCuota({ estudiante_id, tipo, concepto, monto_usd, fecha_vencimiento }) {
  const est = await ejecutar('SELECT estatus_academico FROM estudiantes WHERE id = $1', [estudiante_id]);
  if (!est.rowCount) throw e.noEncontrado('El estudiante');
  if (est.rows[0].estatus_academico === 'Fuera de la Academia') {
    throw e.reglaNegocio('ESTUDIANTE_FUERA', 'No se pueden crear cuotas a un estudiante que está fuera de la academia.');
  }
  const r = await ejecutar(
    'INSERT INTO cuotas (estudiante_id, tipo, concepto, monto_usd, fecha_vencimiento) VALUES ($1, $2, $3, $4, $5) RETURNING id',
    [estudiante_id, tipo, concepto, monto_usd, aFechaSql(fecha_vencimiento)]);
  return { id: r.rows[0].id };
}

/**
 * Genera la mensualidad de todos los estudiantes Activos que aún no la tengan (idempotente por concepto).
 * La idempotencia la garantiza el índice único parcial ux_cuotas_mensualidad_concepto: dos ejecuciones simultáneas no duplican.
 */
async function generarMensualidades({ concepto, monto_usd, fecha_vencimiento }) {
  const r = await ejecutar(
    `INSERT INTO cuotas (estudiante_id, tipo, concepto, monto_usd, fecha_vencimiento)
     SELECT s.id, 'MENSUALIDAD', $1::varchar, $2::numeric, $3::date
       FROM estudiantes s
      WHERE s.estatus_academico = 'Activo'
     ON CONFLICT (estudiante_id, concepto) WHERE tipo = 'MENSUALIDAD' AND estado <> 'Anulada' DO NOTHING`,
    [concepto, monto_usd, aFechaSql(fecha_vencimiento)]);
  return { creadas: r.rowCount };
}

module.exports = { tablero, listarCuotas, crearCuota, generarMensualidades };
