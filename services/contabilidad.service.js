'use strict';
const { sql, ejecutar, conTransaccion } = require('../config/db');
const { e } = require('../errors/AppError');
const { aFechaSql, hoyCaracas, limitesPeriodo } = require('../utils/fechas');
const { calcularNomina } = require('./nomina.calc');
const { sumar } = require('../utils/dinero');

// ───────── Personal ─────────
const COLS_PERSONAL = `id, nombres, apellidos, cedula, email, telefono, cargo, tipo, modalidad_pago, salario_fijo_usd, tarifa_hora_usd,
  CONVERT(char(10), fecha_ingreso, 23) AS fecha_ingreso, activo`;

function paramsPersonal(d) {
  return {
    nombres: [sql.NVarChar(100), d.nombres], apellidos: [sql.NVarChar(100), d.apellidos], cedula: [sql.NVarChar(20), d.cedula],
    email: [sql.NVarChar(160), d.email], telefono: [sql.NVarChar(20), d.telefono], cargo: [sql.NVarChar(100), d.cargo],
    tipo: [sql.NVarChar(15), d.tipo], modalidad: [sql.NVarChar(12), d.modalidad_pago],
    fijo: [sql.Decimal(10, 2), d.salario_fijo_usd ?? 0], tarifa: [sql.Decimal(10, 2), d.tarifa_hora_usd ?? 0],
    ingreso: [sql.Date, d.fecha_ingreso ? aFechaSql(d.fecha_ingreso) : null],
  };
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
    `INSERT INTO dbo.personal (nombres, apellidos, cedula, email, telefono, cargo, tipo, modalidad_pago, salario_fijo_usd, tarifa_hora_usd, fecha_ingreso)
     OUTPUT inserted.id
     VALUES (@nombres, @apellidos, @cedula, @email, @telefono, @cargo, @tipo, @modalidad, @fijo, @tarifa, @ingreso)`, paramsPersonal(d));
  return { id: r.recordset[0].id };
}

async function actualizarPersonal(id, d) {
  exigirCoherencia(d);
  const r = await ejecutar(
    `UPDATE dbo.personal SET nombres=@nombres, apellidos=@apellidos, cedula=@cedula, email=@email, telefono=@telefono, cargo=@cargo, tipo=@tipo,
       modalidad_pago=@modalidad, salario_fijo_usd=@fijo, tarifa_hora_usd=@tarifa, fecha_ingreso=@ingreso
     OUTPUT inserted.id WHERE id=@id`, { ...paramsPersonal(d), id: [sql.Int, id] });
  if (!r.recordset.length) throw e.noEncontrado('El miembro del personal');
  return { id };
}

async function cambiarActivo(id, activo) {
  const r = await ejecutar('UPDATE dbo.personal SET activo = @a OUTPUT inserted.id WHERE id = @id', { id: [sql.Int, id], a: [sql.Bit, activo] });
  if (!r.recordset.length) throw e.noEncontrado('El miembro del personal');
  return { id, activo };
}

async function listarPersonal({ soloActivos, offset, limite }) {
  const [items, total] = await Promise.all([
    ejecutar(`SELECT ${COLS_PERSONAL} FROM dbo.personal WHERE (@a = 0 OR activo = 1) ORDER BY apellidos, nombres OFFSET @o ROWS FETCH NEXT @l ROWS ONLY`,
      { a: [sql.Bit, soloActivos], o: [sql.Int, offset], l: [sql.Int, limite] }),
    ejecutar('SELECT COUNT(*) AS n FROM dbo.personal WHERE (@a = 0 OR activo = 1)', { a: [sql.Bit, soloActivos] }),
  ]);
  return { items: items.recordset, total: total.recordset[0].n };
}

async function obtenerPersonal(id) {
  const r = await ejecutar(`SELECT ${COLS_PERSONAL} FROM dbo.personal WHERE id = @id`, { id: [sql.Int, id] });
  if (!r.recordset.length) throw e.noEncontrado('El miembro del personal');
  return r.recordset[0];
}

// ───────── Horas de clase ─────────
async function registrarHoras({ personal_id, fecha, horas, descripcion }) {
  const p = await ejecutar('SELECT modalidad_pago, activo FROM dbo.personal WHERE id = @id', { id: [sql.Int, personal_id] });
  if (!p.recordset.length) throw e.noEncontrado('El miembro del personal');
  if (!p.recordset[0].activo) throw e.reglaNegocio('PERSONAL_INACTIVO', 'No se pueden registrar horas para personal inactivo.');
  const r = await ejecutar(
    `INSERT INTO dbo.horas_clase (personal_id, fecha, horas, descripcion) OUTPUT inserted.id VALUES (@p, @f, @h, @d)`,
    { p: [sql.Int, personal_id], f: [sql.Date, aFechaSql(fecha)], h: [sql.Decimal(5, 2), horas], d: [sql.NVarChar(200), descripcion] });
  return { id: r.recordset[0].id };
}

async function listarHoras({ personalId, periodo, offset, limite }) {
  const lim = periodo ? limitesPeriodo(periodo) : null;
  const params = {
    p: [sql.Int, personalId || null], d: [sql.Date, lim ? aFechaSql(lim.desde) : null], h: [sql.Date, lim ? aFechaSql(lim.hasta) : null],
    o: [sql.Int, offset], l: [sql.Int, limite],
  };
  const filtro = 'WHERE (@p IS NULL OR h.personal_id = @p) AND (@d IS NULL OR h.fecha >= @d) AND (@h IS NULL OR h.fecha <= @h)';
  const [items, total] = await Promise.all([
    ejecutar(`SELECT h.id, h.personal_id, p.nombres + N' ' + p.apellidos AS personal, CONVERT(char(10), h.fecha, 23) AS fecha, h.horas, h.descripcion
              FROM dbo.horas_clase h JOIN dbo.personal p ON p.id = h.personal_id ${filtro}
              ORDER BY h.fecha DESC, h.id DESC OFFSET @o ROWS FETCH NEXT @l ROWS ONLY`, params),
    ejecutar(`SELECT COUNT(*) AS n FROM dbo.horas_clase h ${filtro}`, { p: params.p, d: params.d, h: params.h }),
  ]);
  return { items: items.recordset, total: total.recordset[0].n };
}

// ───────── Nómina ─────────
/** Calcula (o recalcula, si aún no está pagada) la nómina del período para todo el personal activo. */
async function calcularNominaPeriodo(periodo) {
  const lim = limitesPeriodo(periodo);
  return conTransaccion(async (tx) => {
    const personal = await ejecutar(
      `SELECT p.id, p.modalidad_pago, p.salario_fijo_usd, p.tarifa_hora_usd,
              ISNULL((SELECT SUM(h.horas) FROM dbo.horas_clase h WHERE h.personal_id = p.id AND h.fecha BETWEEN @d AND @h), 0) AS horas
       FROM dbo.personal p WHERE p.activo = 1`,
      { d: [sql.Date, aFechaSql(lim.desde)], h: [sql.Date, aFechaSql(lim.hasta)] }, tx);

    let calculadas = 0;
    let yaPagadas = 0;
    for (const p of personal.recordset) {
      const c = calcularNomina({ modalidad: p.modalidad_pago, salarioFijoUsd: Number(p.salario_fijo_usd), tarifaHoraUsd: Number(p.tarifa_hora_usd), horas: Number(p.horas) });
      const r = await ejecutar(
        `DECLARE @estado NVARCHAR(10) = (SELECT estado FROM dbo.nomina_pagos WITH (UPDLOCK, HOLDLOCK) WHERE personal_id = @p AND periodo = @per)
         IF @estado IS NULL
         BEGIN
           INSERT INTO dbo.nomina_pagos (personal_id, periodo, monto_fijo_usd, horas_totales, tarifa_hora_usd, monto_horas_usd, total_usd)
           VALUES (@p, @per, @fijo, @horas, @tarifa, @mhoras, @total)
         END
         ELSE IF @estado = N'Calculada'
         BEGIN
           UPDATE dbo.nomina_pagos
              SET monto_fijo_usd = @fijo, horas_totales = @horas, tarifa_hora_usd = @tarifa, monto_horas_usd = @mhoras, total_usd = @total
            WHERE personal_id = @p AND periodo = @per
         END
         SELECT ISNULL(@estado, N'Nueva') AS estado_previo`,
        {
          p: [sql.Int, p.id], per: [sql.Char(7), periodo], fijo: [sql.Decimal(10, 2), c.montoFijoUsd], horas: [sql.Decimal(7, 2), c.horasTotales],
          tarifa: [sql.Decimal(10, 2), c.tarifaHoraUsd], mhoras: [sql.Decimal(10, 2), c.montoHorasUsd], total: [sql.Decimal(10, 2), c.totalUsd],
        }, tx);
      if (r.recordset[0].estado_previo === 'Pagada') yaPagadas += 1;
      else calculadas += 1;
    }
    return { periodo, calculadas, ya_pagadas_sin_cambios: yaPagadas };
  });
}

async function listarNomina({ periodo, offset, limite }) {
  const params = { per: [sql.Char(7), periodo], o: [sql.Int, offset], l: [sql.Int, limite] };
  const [items, total] = await Promise.all([
    ejecutar(`SELECT n.id, n.personal_id, p.nombres + N' ' + p.apellidos AS personal, p.cargo, p.modalidad_pago, n.periodo, n.monto_fijo_usd, n.horas_totales,
                     n.tarifa_hora_usd, n.monto_horas_usd, n.total_usd, n.estado, n.pagado_en
              FROM dbo.nomina_pagos n JOIN dbo.personal p ON p.id = n.personal_id
              WHERE n.periodo = @per ORDER BY p.apellidos, p.nombres OFFSET @o ROWS FETCH NEXT @l ROWS ONLY`, params),
    ejecutar('SELECT COUNT(*) AS n, ISNULL(SUM(total_usd), 0) AS total_usd FROM dbo.nomina_pagos WHERE periodo = @per', { per: params.per }),
  ]);
  return { items: items.recordset, total: total.recordset[0].n, total_usd: Number(total.recordset[0].total_usd) };
}

/** Marca la nómina como pagada y asienta el egreso correspondiente en el libro, en una sola transacción. */
async function pagarNomina({ id }) {
  return conTransaccion(async (tx) => {
    const r = await ejecutar(
      `UPDATE dbo.nomina_pagos SET estado = N'Pagada', pagado_en = SYSUTCDATETIME()
       OUTPUT inserted.id, inserted.personal_id, inserted.periodo, inserted.total_usd
       WHERE id = @id AND estado = N'Calculada'`, { id: [sql.Int, id] }, tx);
    if (!r.recordset.length) {
      const existe = await ejecutar('SELECT estado FROM dbo.nomina_pagos WHERE id = @id', { id: [sql.Int, id] }, tx);
      if (!existe.recordset.length) throw e.noEncontrado('La nómina');
      throw e.conflicto('NOMINA_YA_PAGADA', 'Esa nómina ya fue pagada.');
    }
    const n = r.recordset[0];
    if (Number(n.total_usd) <= 0) throw e.reglaNegocio('NOMINA_EN_CERO', 'No hay monto que pagar (0 horas registradas en una modalidad por honorarios).');
    const persona = await ejecutar('SELECT nombres + N\' \' + apellidos AS nombre FROM dbo.personal WHERE id = @p', { p: [sql.Int, n.personal_id] }, tx);
    await ejecutar(
      `INSERT INTO dbo.egresos (fecha, categoria, descripcion, monto_usd, nomina_pago_id) VALUES (@f, N'Nómina', @d, @m, @n)`,
      { f: [sql.Date, aFechaSql(hoyCaracas())], d: [sql.NVarChar(300), `Nómina ${n.periodo} · ${persona.recordset[0].nombre}`], m: [sql.Decimal(12, 2), n.total_usd], n: [sql.Int, n.id] }, tx);
    return { id: n.id, periodo: n.periodo, total_usd: Number(n.total_usd), estado: 'Pagada' };
  });
}

// ───────── Egresos y balance ─────────
async function crearEgreso({ fecha, categoria, descripcion, monto_usd, referencia }) {
  const r = await ejecutar(
    `INSERT INTO dbo.egresos (fecha, categoria, descripcion, monto_usd, referencia) OUTPUT inserted.id VALUES (@f, @c, @d, @m, @r)`,
    { f: [sql.Date, aFechaSql(fecha)], c: [sql.NVarChar(60), categoria], d: [sql.NVarChar(300), descripcion], m: [sql.Decimal(12, 2), monto_usd], r: [sql.NVarChar(60), referencia] });
  return { id: r.recordset[0].id };
}

async function listarEgresos({ periodo, offset, limite }) {
  const lim = periodo ? limitesPeriodo(periodo) : null;
  const params = { d: [sql.Date, lim ? aFechaSql(lim.desde) : null], h: [sql.Date, lim ? aFechaSql(lim.hasta) : null], o: [sql.Int, offset], l: [sql.Int, limite] };
  const filtro = 'WHERE (@d IS NULL OR fecha >= @d) AND (@h IS NULL OR fecha <= @h)';
  const [items, total] = await Promise.all([
    ejecutar(`SELECT id, CONVERT(char(10), fecha, 23) AS fecha, categoria, descripcion, monto_usd, referencia, nomina_pago_id FROM dbo.egresos ${filtro}
              ORDER BY fecha DESC, id DESC OFFSET @o ROWS FETCH NEXT @l ROWS ONLY`, params),
    ejecutar(`SELECT COUNT(*) AS n, ISNULL(SUM(monto_usd), 0) AS total_usd FROM dbo.egresos ${filtro}`, { d: params.d, h: params.h }),
  ]);
  return { items: items.recordset, total: total.recordset[0].n, total_usd: Number(total.recordset[0].total_usd) };
}

/** Balance neto del período = ingresos cobrados (referencias aprobadas ese mes, hora de Caracas) − egresos del mes. */
async function balance(periodo) {
  const lim = limitesPeriodo(periodo);
  const r = await ejecutar(
    `SELECT
       (SELECT ISNULL(SUM(monto_usd), 0) FROM dbo.pagos_referencias WHERE estado = N'Aprobada' AND revisado_en >= @i AND revisado_en < @f) AS ingresos_usd,
       (SELECT ISNULL(SUM(monto_usd), 0) FROM dbo.egresos WHERE fecha BETWEEN @d AND @h) AS egresos_usd`,
    { i: [sql.DateTime2, lim.inicioUtc], f: [sql.DateTime2, lim.finUtc], d: [sql.Date, aFechaSql(lim.desde)], h: [sql.Date, aFechaSql(lim.hasta)] });
  const ingresos = Number(r.recordset[0].ingresos_usd);
  const egresos = Number(r.recordset[0].egresos_usd);
  return { periodo, ingresos_usd: ingresos, egresos_usd: egresos, neto_usd: sumar(ingresos, -egresos) };
}

module.exports = {
  crearPersonal, actualizarPersonal, cambiarActivo, listarPersonal, obtenerPersonal,
  registrarHoras, listarHoras, calcularNominaPeriodo, listarNomina, pagarNomina,
  crearEgreso, listarEgresos, balance,
};
