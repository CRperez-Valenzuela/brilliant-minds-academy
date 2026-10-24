'use strict';
const { ejecutar } = require('../config/db');
const { e } = require('../errors/AppError');
const { hoyCaracas, aFechaSql, aInstanteSql, limitesPeriodo } = require('../utils/fechas');

// ── Tablero financiero ──────────────────────────────────────────────────────────────────────────
// Parámetros posicionales compartidos por las consultas del tablero:
//   $1/$2 = intervalo [inicio, fin) del mes como instantes TIMESTAMPTZ (medianoche de Caracas, expresada en UTC)
//   $3/$4 = primer y último día del mes (DATE)   ·   $5 = hoy en Caracas (DATE)   ·   $6 = sede (INT, NULL = consolidado)
// `pagos_referencias.revisado_en` es TIMESTAMPTZ: se compara contra instantes (sin desfase) y, para agrupar por día, se
// proyecta a la hora de pared de Caracas con `AT TIME ZONE` antes de truncar a DATE.

/** KPIs del mes: una sola ida a la base con subconsultas escalares independientes (cada una usa su índice). */
const SQL_KPI = `
  SELECT
    (SELECT COALESCE(SUM(monto_usd), 0) FROM pagos_referencias
      WHERE estado = 'Aprobada' AND revisado_en >= $1::timestamptz AND revisado_en < $2::timestamptz
        AND ($6::int IS NULL OR sede_id = $6::int))                                                    AS cobrado_usd,
    (SELECT COUNT(*)::int FROM pagos_referencias
      WHERE estado = 'Aprobada' AND revisado_en >= $1::timestamptz AND revisado_en < $2::timestamptz
        AND ($6::int IS NULL OR sede_id = $6::int))                                                    AS cobrado_n,
    (SELECT COALESCE(SUM(monto_usd), 0) FROM cuotas
      WHERE estado IN ('Pendiente', 'En Revisión') AND fecha_vencimiento < $5::date
        AND ($6::int IS NULL OR sede_id = $6::int))                                                    AS vencido_usd,
    (SELECT COUNT(*)::int FROM cuotas
      WHERE estado IN ('Pendiente', 'En Revisión') AND fecha_vencimiento < $5::date
        AND ($6::int IS NULL OR sede_id = $6::int))                                                    AS vencido_n,
    (SELECT COALESCE(SUM(monto_usd), 0) FROM cuotas
      WHERE estado IN ('Pendiente', 'En Revisión')
        AND fecha_vencimiento BETWEEN $3::date AND $4::date AND fecha_vencimiento >= $5::date
        AND ($6::int IS NULL OR sede_id = $6::int))                                                    AS pendiente_usd,
    (SELECT COUNT(*)::int FROM cuotas
      WHERE estado IN ('Pendiente', 'En Revisión')
        AND fecha_vencimiento BETWEEN $3::date AND $4::date AND fecha_vencimiento >= $5::date
        AND ($6::int IS NULL OR sede_id = $6::int))                                                    AS pendiente_n,
    (SELECT COUNT(*)::int FROM pagos_referencias WHERE estado = 'Por Validar'
        AND ($6::int IS NULL OR sede_id = $6::int))                                                    AS por_validar_n`;

/** Barras de recaudación diaria: SUM(monto_usd) por día calendario de Caracas (DATE → 'YYYY-MM-DD' por el parser de config/db). */
const SQL_COBRADO_POR_DIA = `
  SELECT (revisado_en AT TIME ZONE 'America/Caracas')::date AS dia, SUM(monto_usd) AS monto_usd
    FROM pagos_referencias
   WHERE estado = 'Aprobada' AND revisado_en >= $1::timestamptz AND revisado_en < $2::timestamptz
     AND ($3::int IS NULL OR sede_id = $3::int)
   GROUP BY 1
   ORDER BY dia`;

/**
 * Tablero financiero en tiempo real del período AAAA-MM (el controlador entrega por defecto el mes en curso en Caracas):
 *   cobrado = referencias aprobadas dentro del mes · saldos_vencidos = cuotas ya vencidas sin pagar (acumulado, de cualquier mes)
 *   cuentas_pendientes = cuotas del mes que aún no vencen y siguen sin pagar · referencias_por_validar = bandeja de auditoría
 * Contrato de salida (estable, consumido por el panel y por `graphify`): ver CAMBIOS_BMA_FACTURACION.md.
 */
async function tablero(periodo, sedeId = null) {
  const lim = limitesPeriodo(periodo);
  const p = [aInstanteSql(lim.inicioUtc), aInstanteSql(lim.finUtc), aFechaSql(lim.desde), aFechaSql(lim.hasta), aFechaSql(hoyCaracas()), sedeId];
  // Las dos consultas son independientes: viajan en paralelo (cada una toma su propia conexión del pool).
  const [kpi, porDia] = await Promise.all([
    ejecutar(SQL_KPI, p),
    ejecutar(SQL_COBRADO_POR_DIA, [p[0], p[1], sedeId]),
  ]);
  const k = kpi.rows[0];
  return {
    periodo,
    cobrado: { monto_usd: Number(k.cobrado_usd), cantidad: k.cobrado_n },
    saldos_vencidos: { monto_usd: Number(k.vencido_usd), cantidad: k.vencido_n },
    cuentas_pendientes: { monto_usd: Number(k.pendiente_usd), cantidad: k.pendiente_n },
    referencias_por_validar: k.por_validar_n,
    cobrado_por_dia: porDia.rows.map((r) => ({ dia: r.dia, monto_usd: Number(r.monto_usd) })),
  };
}

async function listarCuotas({ estudianteId, estado, offset, limite, sedeId = null }) {
  const filtroParams = [estudianteId || null, estado || null, sedeId];
  const filtro = 'WHERE ($1::int IS NULL OR c.estudiante_id = $1::int) AND ($2::text IS NULL OR c.estado = $2::text) AND ($3::int IS NULL OR c.sede_id = $3::int)';
  const [items, total] = await Promise.all([
    ejecutar(`SELECT c.id, c.estudiante_id, s.nombres || ' ' || s.apellidos AS estudiante, c.tipo, c.concepto, c.monto_usd,
                     c.fecha_vencimiento, c.estado
              FROM cuotas c JOIN estudiantes s ON s.id = c.estudiante_id ${filtro}
              ORDER BY c.fecha_vencimiento DESC, c.id DESC LIMIT $4 OFFSET $5`, [...filtroParams, limite, offset]),
    ejecutar(`SELECT COUNT(*)::int AS n FROM cuotas c ${filtro}`, filtroParams),
  ]);
  return { items: items.rows, total: total.rows[0].n };
}

async function crearCuota({ estudiante_id, tipo, concepto, monto_usd, fecha_vencimiento }, sedeId = null) {
  // Un usuario de sede solo ve (y por tanto solo puede facturar) a los estudiantes de su sede; fuera de ella → 404.
  const est = await ejecutar('SELECT estatus_academico FROM estudiantes WHERE id = $1 AND ($2::int IS NULL OR sede_id = $2::int)', [estudiante_id, sedeId]);
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
async function generarMensualidades({ concepto, monto_usd, fecha_vencimiento }, sedeId = null) {
  const r = await ejecutar(
    `INSERT INTO cuotas (estudiante_id, tipo, concepto, monto_usd, fecha_vencimiento)
     SELECT s.id, 'MENSUALIDAD', $1::varchar, $2::numeric, $3::date
       FROM estudiantes s
      WHERE s.estatus_academico = 'Activo' AND ($4::int IS NULL OR s.sede_id = $4::int)
     ON CONFLICT (estudiante_id, concepto) WHERE tipo = 'MENSUALIDAD' AND estado <> 'Anulada' DO NOTHING`,
    [concepto, monto_usd, aFechaSql(fecha_vencimiento), sedeId]);
  return { creadas: r.rowCount };
}

module.exports = { tablero, listarCuotas, crearCuota, generarMensualidades };
