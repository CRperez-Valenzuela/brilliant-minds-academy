'use strict';
const ExcelJS = require('exceljs');
const { ejecutar } = require('../config/db');

const MIME_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const LOTE = 1000;
const FMT_USD = '#,##0.00';

/**
 * Escribe un .xlsx en STREAMING directamente sobre la respuesta HTTP: las filas se leen por lotes (paginación por clave `id`)
 * y se confirman una a una, así una exportación masiva no carga toda la tabla en memoria.
 * hoja = { nombre, columnas:[{header,key,width,fmt?}], sql } — `sql` DEBE usar `... WHERE x.id > $2 ORDER BY x.id LIMIT $1` ($1 = tamaño del lote,
 * $2 = último id leído) y devolver `id`.
 * hoja.fijo = true → consulta única sin paginar (resúmenes pequeños).
 */
async function exportarLibro(res, nombreArchivo, hojas) {
  res.set({
    'Content-Type': MIME_XLSX,
    'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
    'Cache-Control': 'no-store',
  });
  const wb = new ExcelJS.stream.xlsx.WorkbookWriter({ stream: res, useStyles: true, useSharedStrings: false });
  wb.creator = 'Brilliant Minds Academy · Astra Digital Solutions';

  for (const h of hojas) {
    const ws = wb.addWorksheet(h.nombre);
    ws.columns = h.columnas.map((c) => ({ header: c.header, key: c.key, width: c.width || 18, style: c.fmt ? { numFmt: c.fmt } : undefined }));
    ws.views = [{ state: 'frozen', ySplit: 1 }];
    const cab = ws.getRow(1);
    cab.font = { bold: true };
    cab.commit();

    if (h.fijo) {
      for (const fila of (await ejecutar(h.sql)).rows) ws.addRow(fila).commit();
    } else {
      let ultimo = 0;
      for (;;) {
        const { rows } = await ejecutar(h.sql, [LOTE, ultimo]);
        if (!rows.length) break;
        for (const fila of rows) ws.addRow(fila).commit();
        ultimo = rows[rows.length - 1].id;
        if (rows.length < LOTE) break;
      }
    }
    ws.commit();
  }
  await wb.commit();
}

const sellos = () => new Date().toISOString().slice(0, 10);

/** Contabilidad completa: personal, horas, nómina, egresos y resumen mensual (ingresos vs egresos). */
function hojasContabilidad() {
  return {
    nombre: `contabilidad_${sellos()}.xlsx`,
    hojas: [
      {
        nombre: 'Personal',
        columnas: [
          { header: 'ID', key: 'id', width: 8 }, { header: 'Nombres', key: 'nombres' }, { header: 'Apellidos', key: 'apellidos' },
          { header: 'Cédula', key: 'cedula' }, { header: 'Cargo', key: 'cargo', width: 26 }, { header: 'Tipo', key: 'tipo' },
          { header: 'Modalidad de pago', key: 'modalidad_pago' }, { header: 'Salario fijo (USD)', key: 'salario_fijo_usd', fmt: FMT_USD },
          { header: 'Tarifa por hora (USD)', key: 'tarifa_hora_usd', fmt: FMT_USD }, { header: 'Activo', key: 'activo' }, { header: 'Ingreso', key: 'fecha_ingreso' },
        ],
        sql: `SELECT id, nombres, apellidos, cedula, cargo, tipo, modalidad_pago, salario_fijo_usd, tarifa_hora_usd,
                     CASE WHEN activo THEN 'Sí' ELSE 'No' END AS activo, fecha_ingreso
              FROM personal WHERE id > $2 ORDER BY id LIMIT $1`,
      },
      {
        nombre: 'Horas de clase',
        columnas: [
          { header: 'ID', key: 'id', width: 8 }, { header: 'Personal', key: 'personal', width: 30 }, { header: 'Fecha', key: 'fecha' },
          { header: 'Horas', key: 'horas', fmt: FMT_USD }, { header: 'Descripción', key: 'descripcion', width: 40 },
        ],
        sql: `SELECT h.id, p.nombres || ' ' || p.apellidos AS personal, h.fecha, h.horas, h.descripcion
              FROM horas_clase h JOIN personal p ON p.id = h.personal_id WHERE h.id > $2 ORDER BY h.id LIMIT $1`,
      },
      {
        nombre: 'Nómina',
        columnas: [
          { header: 'ID', key: 'id', width: 8 }, { header: 'Personal', key: 'personal', width: 30 }, { header: 'Período', key: 'periodo' },
          { header: 'Modalidad', key: 'modalidad_pago' }, { header: 'Monto fijo (USD)', key: 'monto_fijo_usd', fmt: FMT_USD },
          { header: 'Horas', key: 'horas_totales', fmt: FMT_USD }, { header: 'Tarifa/hora (USD)', key: 'tarifa_hora_usd', fmt: FMT_USD },
          { header: 'Honorarios (USD)', key: 'monto_horas_usd', fmt: FMT_USD }, { header: 'Total (USD)', key: 'total_usd', fmt: FMT_USD },
          { header: 'Estado', key: 'estado' }, { header: 'Pagado en', key: 'pagado_en', width: 22 },
        ],
        sql: `SELECT n.id, p.nombres || ' ' || p.apellidos AS personal, n.periodo, p.modalidad_pago, n.monto_fijo_usd, n.horas_totales,
                     n.tarifa_hora_usd, n.monto_horas_usd, n.total_usd, n.estado, n.pagado_en
              FROM nomina_pagos n JOIN personal p ON p.id = n.personal_id WHERE n.id > $2 ORDER BY n.id LIMIT $1`,
      },
      {
        nombre: 'Egresos',
        columnas: [
          { header: 'ID', key: 'id', width: 8 }, { header: 'Fecha', key: 'fecha' }, { header: 'Categoría', key: 'categoria' },
          { header: 'Descripción', key: 'descripcion', width: 46 }, { header: 'Monto (USD)', key: 'monto_usd', fmt: FMT_USD }, { header: 'Referencia', key: 'referencia' },
        ],
        sql: `SELECT id, fecha, categoria, descripcion, monto_usd, referencia
              FROM egresos WHERE id > $2 ORDER BY id LIMIT $1`,
      },
      {
        nombre: 'Balance mensual',
        fijo: true,
        columnas: [
          { header: 'Período', key: 'periodo' }, { header: 'Ingresos (USD)', key: 'ingresos_usd', fmt: FMT_USD },
          { header: 'Egresos (USD)', key: 'egresos_usd', fmt: FMT_USD }, { header: 'Neto (USD)', key: 'neto_usd', fmt: FMT_USD },
        ],
        sql: `WITH ing AS (SELECT to_char(revisado_en AT TIME ZONE 'America/Caracas', 'YYYY-MM') AS periodo, SUM(monto_usd) AS total
                           FROM pagos_referencias WHERE estado = 'Aprobada' GROUP BY 1),
                   egr AS (SELECT to_char(fecha, 'YYYY-MM') AS periodo, SUM(monto_usd) AS total FROM egresos GROUP BY 1)
              SELECT COALESCE(i.periodo, x.periodo) AS periodo, COALESCE(i.total, 0) AS ingresos_usd, COALESCE(x.total, 0) AS egresos_usd,
                     COALESCE(i.total, 0) - COALESCE(x.total, 0) AS neto_usd
              FROM ing i FULL OUTER JOIN egr x ON x.periodo = i.periodo ORDER BY 1`,
      },
    ],
  };
}

/** Histórico completo de facturación: cuotas y referencias de pago. */
function hojasFacturacion() {
  return {
    nombre: `facturacion_${sellos()}.xlsx`,
    hojas: [
      {
        nombre: 'Cuotas',
        columnas: [
          { header: 'ID', key: 'id', width: 8 }, { header: 'Estudiante', key: 'estudiante', width: 30 }, { header: 'Representante', key: 'representante', width: 30 },
          { header: 'Cédula repr.', key: 'rep_cedula' }, { header: 'Tipo', key: 'tipo' }, { header: 'Concepto', key: 'concepto', width: 28 },
          { header: 'Monto (USD)', key: 'monto_usd', fmt: FMT_USD }, { header: 'Vencimiento', key: 'fecha_vencimiento' }, { header: 'Estado', key: 'estado' },
        ],
        sql: `SELECT c.id, s.nombres || ' ' || s.apellidos AS estudiante, r.nombres || ' ' || r.apellidos AS representante, r.cedula AS rep_cedula,
                     c.tipo, c.concepto, c.monto_usd, c.fecha_vencimiento, c.estado
              FROM cuotas c JOIN estudiantes s ON s.id = c.estudiante_id JOIN representantes r ON r.id = s.representante_id
              WHERE c.id > $2 ORDER BY c.id LIMIT $1`,
      },
      {
        nombre: 'Pagos y referencias',
        columnas: [
          { header: 'ID', key: 'id', width: 8 }, { header: 'Declarado', key: 'declarado_en', width: 22 }, { header: 'Estudiante', key: 'estudiante', width: 30 },
          { header: 'Referencia', key: 'referencia', width: 22 }, { header: 'Método', key: 'metodo_pago' }, { header: 'Monto (USD)', key: 'monto_usd', fmt: FMT_USD },
          { header: 'Tasa BCV', key: 'tasa_bcv', fmt: '#,##0.0000' }, { header: 'Monto (Bs.)', key: 'monto_bs', fmt: FMT_USD }, { header: 'Estado', key: 'estado' },
          { header: 'Revisado', key: 'revisado_en', width: 22 }, { header: 'Nota', key: 'nota_revision', width: 36 },
        ],
        sql: `SELECT p.id, p.declarado_en, s.nombres || ' ' || s.apellidos AS estudiante, p.referencia, p.metodo_pago, p.monto_usd, p.tasa_bcv, p.monto_bs,
                     p.estado, p.revisado_en, p.nota_revision
              FROM pagos_referencias p JOIN estudiantes s ON s.id = p.estudiante_id WHERE p.id > $2 ORDER BY p.id LIMIT $1`,
      },
    ],
  };
}

module.exports = { exportarLibro, hojasContabilidad, hojasFacturacion, MIME_XLSX };
