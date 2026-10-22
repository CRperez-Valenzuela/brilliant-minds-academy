'use strict';
const { sql, ejecutar } = require('../config/db');
const { e } = require('../errors/AppError');
const { hoyCaracas, aFechaSql, limitesPeriodo } = require('../utils/fechas');
const crm = require('./crm.service');

/**
 * Tablero financiero en tiempo real del período (por defecto, el mes en curso en hora de Caracas):
 *   cobrado = referencias aprobadas en el mes · vencido = saldo de cuotas ya vencidas sin pagar (acumulado)
 *   pendiente = cuotas del mes aún por vencer sin pagar · por_validar = referencias esperando auditoría
 */
async function tablero(periodo) {
  const lim = limitesPeriodo(periodo);
  const hoy = aFechaSql(hoyCaracas());
  const p = {
    i: [sql.DateTime2, lim.inicioUtc], f: [sql.DateTime2, lim.finUtc],
    d: [sql.Date, aFechaSql(lim.desde)], h: [sql.Date, aFechaSql(lim.hasta)], hoy: [sql.Date, hoy],
  };
  const [kpi, porDia, estudiantes] = await Promise.all([
    ejecutar(
      `SELECT
         (SELECT ISNULL(SUM(monto_usd), 0) FROM dbo.pagos_referencias WHERE estado = N'Aprobada' AND revisado_en >= @i AND revisado_en < @f) AS cobrado_usd,
         (SELECT COUNT(*) FROM dbo.pagos_referencias WHERE estado = N'Aprobada' AND revisado_en >= @i AND revisado_en < @f)                  AS cobrado_n,
         (SELECT ISNULL(SUM(monto_usd), 0) FROM dbo.cuotas WHERE estado IN (N'Pendiente', N'En Revisión') AND fecha_vencimiento < @hoy)       AS vencido_usd,
         (SELECT COUNT(*) FROM dbo.cuotas WHERE estado IN (N'Pendiente', N'En Revisión') AND fecha_vencimiento < @hoy)                        AS vencido_n,
         (SELECT ISNULL(SUM(monto_usd), 0) FROM dbo.cuotas WHERE estado IN (N'Pendiente', N'En Revisión') AND fecha_vencimiento BETWEEN @d AND @h AND fecha_vencimiento >= @hoy) AS pendiente_usd,
         (SELECT COUNT(*) FROM dbo.cuotas WHERE estado IN (N'Pendiente', N'En Revisión') AND fecha_vencimiento BETWEEN @d AND @h AND fecha_vencimiento >= @hoy)                  AS pendiente_n,
         (SELECT ISNULL(SUM(monto_usd), 0) FROM dbo.cuotas WHERE estado <> N'Anulada' AND fecha_vencimiento BETWEEN @d AND @h)                AS facturado_mes_usd,
         (SELECT COUNT(*) FROM dbo.pagos_referencias WHERE estado = N'Por Validar')                                                           AS por_validar_n`, p),
    ejecutar(
      `SELECT CONVERT(char(10), DATEADD(HOUR, -4, revisado_en), 23) AS dia, SUM(monto_usd) AS cobrado_usd
       FROM dbo.pagos_referencias WHERE estado = N'Aprobada' AND revisado_en >= @i AND revisado_en < @f
       GROUP BY CONVERT(char(10), DATEADD(HOUR, -4, revisado_en), 23) ORDER BY dia`, p),
    crm.resumen(),
  ]);
  const k = kpi.recordset[0];
  return {
    periodo,
    cobrado: { monto_usd: Number(k.cobrado_usd), cantidad: k.cobrado_n },
    saldos_vencidos: { monto_usd: Number(k.vencido_usd), cantidad: k.vencido_n },
    cuentas_pendientes: { monto_usd: Number(k.pendiente_usd), cantidad: k.pendiente_n },
    facturado_mes_usd: Number(k.facturado_mes_usd),
    referencias_por_validar: k.por_validar_n,
    cobrado_por_dia: porDia.recordset.map((r) => ({ dia: r.dia, monto_usd: Number(r.cobrado_usd) })),
    estudiantes,
  };
}

async function listarCuotas({ estudianteId, estado, offset, limite }) {
  const params = { e: [sql.Int, estudianteId || null], s: [sql.NVarChar(15), estado || null], o: [sql.Int, offset], l: [sql.Int, limite] };
  const filtro = 'WHERE (@e IS NULL OR c.estudiante_id = @e) AND (@s IS NULL OR c.estado = @s)';
  const [items, total] = await Promise.all([
    ejecutar(`SELECT c.id, c.estudiante_id, s.nombres + N' ' + s.apellidos AS estudiante, c.tipo, c.concepto, c.monto_usd,
                     CONVERT(char(10), c.fecha_vencimiento, 23) AS fecha_vencimiento, c.estado
              FROM dbo.cuotas c JOIN dbo.estudiantes s ON s.id = c.estudiante_id ${filtro}
              ORDER BY c.fecha_vencimiento DESC, c.id DESC OFFSET @o ROWS FETCH NEXT @l ROWS ONLY`, params),
    ejecutar(`SELECT COUNT(*) AS n FROM dbo.cuotas c ${filtro}`, { e: params.e, s: params.s }),
  ]);
  return { items: items.recordset, total: total.recordset[0].n };
}

async function crearCuota({ estudiante_id, tipo, concepto, monto_usd, fecha_vencimiento }) {
  const est = await ejecutar('SELECT estatus_academico FROM dbo.estudiantes WHERE id = @id', { id: [sql.Int, estudiante_id] });
  if (!est.recordset.length) throw e.noEncontrado('El estudiante');
  if (est.recordset[0].estatus_academico === 'Fuera de la Academia') {
    throw e.reglaNegocio('ESTUDIANTE_FUERA', 'No se pueden crear cuotas a un estudiante que está fuera de la academia.');
  }
  const r = await ejecutar(
    `INSERT INTO dbo.cuotas (estudiante_id, tipo, concepto, monto_usd, fecha_vencimiento) OUTPUT inserted.id VALUES (@e, @t, @c, @m, @f)`,
    { e: [sql.Int, estudiante_id], t: [sql.NVarChar(15), tipo], c: [sql.NVarChar(150), concepto], m: [sql.Decimal(10, 2), monto_usd], f: [sql.Date, aFechaSql(fecha_vencimiento)] });
  return { id: r.recordset[0].id };
}

/** Genera la mensualidad de todos los estudiantes Activos que aún no la tengan (idempotente por concepto). */
async function generarMensualidades({ concepto, monto_usd, fecha_vencimiento }) {
  const r = await ejecutar(
    `INSERT INTO dbo.cuotas (estudiante_id, tipo, concepto, monto_usd, fecha_vencimiento)
     SELECT s.id, N'MENSUALIDAD', @c, @m, @f
     FROM dbo.estudiantes s
     WHERE s.estatus_academico = N'Activo'
       AND NOT EXISTS (SELECT 1 FROM dbo.cuotas x WHERE x.estudiante_id = s.id AND x.tipo = N'MENSUALIDAD' AND x.concepto = @c AND x.estado <> N'Anulada')`,
    { c: [sql.NVarChar(150), concepto], m: [sql.Decimal(10, 2), monto_usd], f: [sql.Date, aFechaSql(fecha_vencimiento)] });
  return { creadas: r.rowsAffected[0] };
}

module.exports = { tablero, listarCuotas, crearCuota, generarMensualidades };
