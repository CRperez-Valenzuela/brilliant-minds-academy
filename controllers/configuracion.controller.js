'use strict';
const { sql, ejecutar } = require('../config/db');
const { e } = require('../errors/AppError');
const parametros = require('../services/parametros.service');
const { validar, idParam } = require('../utils/validar');
const { asyncHandler, ok } = require('../utils/http');

const METODOS = ['ZELLE', 'BINANCE', 'PAYPAL', 'PAGO_MOVIL'];
const REGLAS_CUENTA = {
  metodo: { tipo: 'enum', valores: METODOS, requerido: true },
  titular: { requerido: true, max: 150 },
  detalle: { requerido: true, max: 500 },
  activa: { tipo: 'booleano', defecto: true },
};

const obtener = asyncHandler(async (_req, res) => {
  const cuentas = await ejecutar('SELECT id, metodo, titular, detalle, activa FROM dbo.cuentas_pago ORDER BY metodo, id');
  ok(res, { matricula_usd: Number(await parametros.obtener('MATRICULA_USD')), cuentas: cuentas.recordset });
});

const fijarMatricula = asyncHandler(async (req, res) => {
  const { matricula_usd } = validar(req.body, { matricula_usd: { tipo: 'decimal', requerido: true, positivo: true, max: 99999999 } });
  await parametros.guardar('MATRICULA_USD', matricula_usd.toFixed(2));
  ok(res, { matricula_usd });
});

const crearCuenta = asyncHandler(async (req, res) => {
  const d = validar(req.body, REGLAS_CUENTA);
  const r = await ejecutar(
    'INSERT INTO dbo.cuentas_pago (metodo, titular, detalle, activa) OUTPUT inserted.id VALUES (@m, @t, @d, @a)',
    { m: [sql.NVarChar(20), d.metodo], t: [sql.NVarChar(150), d.titular], d: [sql.NVarChar(500), d.detalle], a: [sql.Bit, d.activa] });
  ok(res, { id: r.recordset[0].id }, 201);
});

const actualizarCuenta = asyncHandler(async (req, res) => {
  const id = idParam(req.params.id);
  const d = validar(req.body, REGLAS_CUENTA);
  const r = await ejecutar(
    'UPDATE dbo.cuentas_pago SET metodo = @m, titular = @t, detalle = @d, activa = @a OUTPUT inserted.id WHERE id = @id',
    { id: [sql.Int, id], m: [sql.NVarChar(20), d.metodo], t: [sql.NVarChar(150), d.titular], d: [sql.NVarChar(500), d.detalle], a: [sql.Bit, d.activa] });
  if (!r.recordset.length) throw e.noEncontrado('La cuenta');
  ok(res, { id });
});

module.exports = { obtener, fijarMatricula, crearCuenta, actualizarCuenta };
