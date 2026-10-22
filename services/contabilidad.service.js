'use strict';
const { ejecutar, conTransaccion } = require('../config/db');
const { e } = require('../errors/AppError');
const { aFechaSql, aInstanteSql, hoyCaracas, limitesPeriodo } = require('../utils/fechas');
const { calcularNomina } = require('./nomina.calc');
const { sumar } = require('../utils/dinero');

// ───────── Personal ─────────
const COLS_PERSONAL = `id, nombres, apellidos, cedula, email, telefono, cargo, tipo, modalidad_pago, salario_fijo_usd, tarifa_hora_usd,
  fecha_ingreso, activo`;

/** Parámetros $1..$11 en el orden de las columnas de personal (la cédula se guarda en mayúsculas: PostgreSQL distingue mayúsculas). */
function paramsPersonal(d) {
  return [
    d.nombres, d.apellidos, String(d.cedula).toUpperCase(), d.email, d.telefono, d.cargo, d.tipo, d.modalidad_pago,
    d.salario_fijo_usd ?? 0, d.tarifa_hora_usd ?? 0, d.fecha_ingreso ? aFechaSql(d.fecha_ingreso) : null,
  ];
}

/** Falla con 422 legible antes de que el CHECK de la base de datos lo haga con un mensaje técnico. */
function exigirCoherencia(d) {
  const f = Number(d.salario_fijo_usd || 0);
  const t = Number(d.tarifa_hora_usd || 0);
  const ok = (d.modalidad_pago === 'Fijo' && f > 0) || (d.modalidad_pago === 'Honorarios' && t > 0) || (d.modalidad_pago === 'Mixto' && f > 0 && t > 0);
  if (!ok) {
    throw e.reglaNegocio('MODALIDAD_INCOHERENTE', 'Fijo requiere salario_fijo_usd > 0; Honorarios requiere tarifa_hora_usd > 0; Mixto requiere ambos.');
  }
}

async function crearPersonal(d) {
  exigirCoherencia(d);
  const r = await ejecutar(
    `INSERT INTO personal (nombres, apellidos, cedula, email, telefono, cargo, tipo, modalidad_pago, salario_fijo_usd, tarifa_hora_usd, fecha_ingreso)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING id`, paramsPersonal(d));
  return { id: r.rows[0].id };
}

async function actualizarPersonal(id, d) {
  exigirCoherencia(d);
  const r = await ejecutar(
    `UPDATE personal SET nombres = $2, apellidos = $3, cedula = $4, email = $5, telefono = $6, cargo = $7, tipo = $8,
       modalidad_pago = $9, salario_fijo_usd = $10, tarifa_hora_usd = $11, fecha_ingreso = $12
     WHERE id = $1 RETURNING id`, [id, ...paramsPersonal(d)]);
  if (!r.rowCount) throw e.noEncontrado('El miembro del personal');
  return { id };
}

async function cambiarActivo(id, activo) {
  const r = await ejecutar('UPDATE personal SET activo = $2 WHERE id = $1 RETURNING id', [id, activo]);
  if (!r.rowCount) throw e.noEncontrado('El miembro del personal');
  return { id, activo };
}

async function listarPersonal({ soloActivos, offset, limite }) {
  const filtro = '($1::boolean = FALSE OR activo = TRUE)';
  const [items, total] = await Promise.all([
    ejecutar(`SELECT ${COLS_PERSONAL} FROM personal WHERE ${filtro} ORDER BY apellidos, nombres, id LIMIT $2 OFFSET $3`, [Boolean(soloActivos), limite, offset]),
    ejecutar(`SELECT COUNT(*)::int AS n FROM personal WHERE ${filtro}`, [Boolean(soloActivos)]),
  ]);
  return { items: items.rows, total: total.rows[0].n };
}

async function obtenerPersonal(id) {
  const r = await ejecutar(`SELECT ${COLS_PERSONAL} FROM personal WHERE id = $1`, [id]);
  if (!r.rowCount) throw e.noEncontrado('El miembro del personal');
  return r.rows[0];
}

// ───────── Horas de clase ─────────
async function registrarHoras({ personal_id, fecha, horas, descripcion }) {
  const p = await ejecutar('SELECT modalidad_pago, activo FROM personal WHERE id = $1', [personal_id]);
  if (!p.rowCount) throw e.noEncontrado('El miembro del personal');
  if (!p.rows[0].activo) throw e.reglaNegocio('PERSONAL_INACTIVO', 'No se pueden registrar horas para personal inactivo.');
  const r = await ejecutar(
    'INSERT INTO horas_clase (personal_id, fecha, horas, descripcion) VALUES ($1, $2, $3, $4) RETURNING id',
    [personal_id, aFechaSql(fecha), horas, descripcion]);
  return { id: r.rows[0].id };
}

async function listarHoras({ personalId, periodo, offset, limite }) {
  const lim = periodo ? limitesPeriodo(periodo) : null;
  const filtroParams = [personalId || null, lim ? aFechaSql(lim.desde) : null, lim ? aFechaSql(lim.hasta) : null];
  const filtro = 'WHERE ($1::int IS NULL OR h.personal_id = $1::int) AND ($2::date IS NULL OR h.fecha >= $2::date) AND ($3::date IS NULL OR h.fecha <= $3::date)';
  const [items, total] = await Promise.all([
    ejecutar(`SELECT h.id, h.personal_id, p.nombres || ' ' || p.apellidos AS personal, h.fecha, h.horas, h.descripcion
              FROM horas_clase h JOIN personal p ON p.id = h.personal_id ${filtro}
              ORDER BY h.fecha DESC, h.id DESC LIMIT $4 OFFSET $5`, [...filtroParams, limite, offset]),
    ejecutar(`SELECT COUNT(*)::int AS n FROM horas_clase h ${filtro}`, filtroParams),
  ]);
  return { items: items.rows, total: total.rows[0].n };
}

// ───────── Nómina ─────────
/** Calcula (o recalcula, si aún no está pagada) la nómina del período para todo el personal activo. */
async function calcularNominaPeriodo(periodo) {
  const lim = limitesPeriodo(periodo);
  return conTransaccion(async (tx) => {
    const personal = await ejecutar(
      `SELECT p.id, p.modalidad_pago, p.salario_fijo_usd, p.tarifa_hora_usd,
              COALESCE((SELECT SUM(h.horas) FROM horas_clase h WHERE h.personal_id = p.id AND h.fecha BETWEEN $1 AND $2), 0) AS horas
       FROM personal p WHERE p.activo = TRUE ORDER BY p.id`,
      [aFechaSql(lim.desde), aFechaSql(lim.hasta)], tx);

    let calculadas = 0;
    let yaPagadas = 0;
    for (const p of personal.rows) {
      const c = calcularNomina({ modalidad: p.modalidad_pago, salarioFijoUsd: Number(p.salario_fijo_usd), tarifaHoraUsd: Number(p.tarifa_hora_usd), horas: Number(p.horas) });
      // Upsert atómico: inserta la nómina o, si ya existe y sigue "Calculada", la recalcula. Si ya está "Pagada" el WHERE
      // la deja intacta y RETURNING no devuelve fila (rowCount = 0). Sin lecturas previas ni ventana de carrera.
      const r = await ejecutar(
        `INSERT INTO nomina_pagos (personal_id, periodo, monto_fijo_usd, horas_totales, tarifa_hora_usd, monto_horas_usd, total_usd)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (personal_id, periodo) DO UPDATE
            SET monto_fijo_usd = EXCLUDED.monto_fijo_usd, horas_totales = EXCLUDED.horas_totales, tarifa_hora_usd = EXCLUDED.tarifa_hora_usd,
                monto_horas_usd = EXCLUDED.monto_horas_usd, total_usd = EXCLUDED.total_usd
          WHERE nomina_pagos.estado = 'Calculada'
         RETURNING id`,
        [p.id, periodo, c.montoFijoUsd, c.horasTotales, c.tarifaHoraUsd, c.montoHorasUsd, c.totalUsd], tx);
      if (r.rowCount) calculadas += 1;
      else yaPagadas += 1;
    }
    return { periodo, calculadas, ya_pagadas_sin_cambios: yaPagadas };
  });
}

async function listarNomina({ periodo, offset, limite }) {
  const [items, total] = await Promise.all([
    ejecutar(`SELECT n.id, n.personal_id, p.nombres || ' ' || p.apellidos AS personal, p.cargo, p.modalidad_pago, n.periodo, n.monto_fijo_usd, n.horas_totales,
                     n.tarifa_hora_usd, n.monto_horas_usd, n.total_usd, n.estado, n.pagado_en
              FROM nomina_pagos n JOIN personal p ON p.id = n.personal_id
              WHERE n.periodo = $1 ORDER BY p.apellidos, p.nombres, n.id LIMIT $2 OFFSET $3`, [periodo, limite, offset]),
    ejecutar('SELECT COUNT(*)::int AS n, COALESCE(SUM(total_usd), 0) AS total_usd FROM nomina_pagos WHERE periodo = $1', [periodo]),
  ]);
  return { items: items.rows, total: total.rows[0].n, total_usd: Number(total.rows[0].total_usd) };
}

/** Marca la nómina como pagada y asienta el egreso correspondiente en el libro, en una sola transacción. */
async function pagarNomina({ id }) {
  return conTransaccion(async (tx) => {
    const r = await ejecutar(
      `UPDATE nomina_pagos SET estado = 'Pagada', pagado_en = NOW()
        WHERE id = $1 AND estado = 'Calculada'
        RETURNING id, personal_id, periodo, total_usd`, [id], tx);
    if (!r.rowCount) {
      const existe = await ejecutar('SELECT estado FROM nomina_pagos WHERE id = $1', [id], tx);
      if (!existe.rowCount) throw e.noEncontrado('La nómina');
      throw e.conflicto('NOMINA_YA_PAGADA', 'Esa nómina ya fue pagada.');
    }
    const n = r.rows[0];
    // Lanzar aquí revierte el UPDATE anterior (ROLLBACK): la nómina vuelve a "Calculada".
    if (Number(n.total_usd) <= 0) throw e.reglaNegocio('NOMINA_EN_CERO', 'No hay monto que pagar (0 horas registradas en una modalidad por honorarios).');
    const persona = await ejecutar(`SELECT nombres || ' ' || apellidos AS nombre FROM personal WHERE id = $1`, [n.personal_id], tx);
    await ejecutar(
      `INSERT INTO egresos (fecha, categoria, descripcion, monto_usd, nomina_pago_id) VALUES ($1, 'Nómina', $2, $3, $4)`,
      [aFechaSql(hoyCaracas()), `Nómina ${n.periodo} · ${persona.rows[0].nombre}`, n.total_usd, n.id], tx);
    return { id: n.id, periodo: n.periodo, total_usd: Number(n.total_usd), estado: 'Pagada' };
  });
}

// ───────── Egresos y balance ─────────
async function crearEgreso({ fecha, categoria, descripcion, monto_usd, referencia }) {
  const r = await ejecutar(
    'INSERT INTO egresos (fecha, categoria, descripcion, monto_usd, referencia) VALUES ($1, $2, $3, $4, $5) RETURNING id',
    [aFechaSql(fecha), categoria, descripcion, monto_usd, referencia]);
  return { id: r.rows[0].id };
}

async function listarEgresos({ periodo, offset, limite }) {
  const lim = periodo ? limitesPeriodo(periodo) : null;
  const filtroParams = [lim ? aFechaSql(lim.desde) : null, lim ? aFechaSql(lim.hasta) : null];
  const filtro = 'WHERE ($1::date IS NULL OR fecha >= $1::date) AND ($2::date IS NULL OR fecha <= $2::date)';
  const [items, total] = await Promise.all([
    ejecutar(`SELECT id, fecha, categoria, descripcion, monto_usd, referencia, nomina_pago_id FROM egresos ${filtro}
              ORDER BY fecha DESC, id DESC LIMIT $3 OFFSET $4`, [...filtroParams, limite, offset]),
    ejecutar(`SELECT COUNT(*)::int AS n, COALESCE(SUM(monto_usd), 0) AS total_usd FROM egresos ${filtro}`, filtroParams),
  ]);
  return { items: items.rows, total: total.rows[0].n, total_usd: Number(total.rows[0].total_usd) };
}

/** Balance neto del período = ingresos cobrados (referencias aprobadas ese mes, hora de Caracas) − egresos del mes. */
async function balance(periodo) {
  const lim = limitesPeriodo(periodo);
  const r = await ejecutar(
    `SELECT
       (SELECT COALESCE(SUM(monto_usd), 0) FROM pagos_referencias WHERE estado = 'Aprobada' AND revisado_en >= $1::timestamptz AND revisado_en < $2::timestamptz) AS ingresos_usd,
       (SELECT COALESCE(SUM(monto_usd), 0) FROM egresos WHERE fecha BETWEEN $3::date AND $4::date) AS egresos_usd`,
    [aInstanteSql(lim.inicioUtc), aInstanteSql(lim.finUtc), aFechaSql(lim.desde), aFechaSql(lim.hasta)]);
  const ingresos = Number(r.rows[0].ingresos_usd);
  const egresos = Number(r.rows[0].egresos_usd);
  return { periodo, ingresos_usd: ingresos, egresos_usd: egresos, neto_usd: sumar(ingresos, -egresos) };
}

module.exports = {
  crearPersonal, actualizarPersonal, cambiarActivo, listarPersonal, obtenerPersonal,
  registrarHoras, listarHoras, calcularNominaPeriodo, listarNomina, pagarNomina,
  crearEgreso, listarEgresos, balance,
};
