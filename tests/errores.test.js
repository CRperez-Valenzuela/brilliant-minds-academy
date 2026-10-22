'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { AppError, e } = require('../errors/AppError');
const { errorHandler, notFound, normalizar } = require('../middlewares/errorHandler');
const { crearLimitador } = require('../middlewares/limitador');

function resFalsa() {
  const r = { headers: {}, headersSent: false, estado: null, cuerpo: null, destruida: false };
  r.set = (h, v) => { if (typeof h === 'string') r.headers[h] = v; else Object.assign(r.headers, h); return r; };
  r.removeHeader = (h) => { delete r.headers[h]; };
  r.status = (s) => { r.estado = s; return r; };
  r.json = (c) => { r.cuerpo = c; return r; };
  r.destroy = () => { r.destruida = true; };
  return r;
}
const errorMssql = (numero, mensaje, extra = {}) => Object.assign(new Error(mensaje), { name: 'RequestError', number: numero, ...extra });

test('todo error sale como JSON { ok:false, error:{codigo,mensaje,requestId} }', () => {
  const res = resFalsa();
  errorHandler(e.validacion([{ campo: 'x', mensaje: 'mal' }]), { id: 'req-1', method: 'POST', originalUrl: '/api/x' }, res, () => {});
  assert.equal(res.estado, 422);
  assert.deepEqual(res.cuerpo, { ok: false, error: { codigo: 'VALIDACION', mensaje: 'Hay datos inválidos o faltantes.', requestId: 'req-1', detalles: [{ campo: 'x', mensaje: 'mal' }] } });
});

test('JSON malformado → 400 JSON_INVALIDO; cuerpo gigante → 413', () => {
  assert.equal(normalizar(Object.assign(new SyntaxError('x'), { type: 'entity.parse.failed' })).codigo, 'JSON_INVALIDO');
  assert.equal(normalizar(Object.assign(new Error('x'), { type: 'entity.too.large' })).status, 413);
});

test('multer: archivo grande → 413, campo inesperado → 422', () => {
  assert.equal(normalizar(Object.assign(new Error('x'), { name: 'MulterError', code: 'LIMIT_FILE_SIZE', field: 'acta_nacimiento' })).status, 413);
  assert.equal(normalizar(Object.assign(new Error('x'), { name: 'MulterError', code: 'LIMIT_UNEXPECTED_FILE', field: 'virus' })).status, 422);
});

test('MSSQL: duplicados (2601/2627) → 409 con código legible según el índice violado', () => {
  const ref = normalizar(errorMssql(2601, "Cannot insert duplicate key row in object 'dbo.pagos_referencias' with unique index 'ux_pagos_referencia_activa'."));
  assert.equal(ref.status, 409);
  assert.equal(ref.codigo, 'REFERENCIA_DUPLICADA');
  const ced = normalizar(errorMssql(2627, "Violation of UNIQUE KEY constraint 'uq_personal_cedula'. Cannot insert duplicate key in object 'dbo.personal'."));
  assert.equal(ced.codigo, 'CEDULA_DUPLICADA');
  assert.equal(normalizar(errorMssql(2627, 'sin nombre conocido')).codigo, 'REGISTRO_DUPLICADO');
});

test('MSSQL: FK, truncamiento, deadlock y conexión caída no filtran SQL al cliente', () => {
  assert.equal(normalizar(errorMssql(547, 'The INSERT statement conflicted with the FOREIGN KEY constraint "fk_x"')).codigo, 'VIOLACION_INTEGRIDAD');
  assert.equal(normalizar(errorMssql(8152, 'String or binary data would be truncated')).status, 422);
  const dl = normalizar(errorMssql(1205, 'deadlock'));
  assert.equal(dl.status, 503);
  assert.equal(dl.headers['Retry-After'], '2');
  assert.equal(normalizar(errorMssql(undefined, 'timeout', { code: 'ETIMEOUT' })).status, 504);
  const caida = normalizar(Object.assign(new Error('Failed to connect'), { name: 'ConnectionError', code: 'ESOCKET' }));
  assert.equal(caida.codigo, 'BASE_DATOS_NO_DISPONIBLE');
  const res = resFalsa();
  const orig = console.error; console.error = () => {};
  errorHandler(new Error("SELECT * FROM dbo.usuarios_admin WHERE password_hash = 'x' falló"), { id: 'r', method: 'GET', originalUrl: '/' }, res, () => {});
  console.error = orig;
  assert.equal(res.estado, 500);
  assert.equal(res.cuerpo.error.codigo, 'ERROR_INTERNO');
  assert.ok(!JSON.stringify(res.cuerpo).includes('password_hash'));
});

test('error antes del primer byte de un .xlsx: se quita Content-Disposition; con cabeceras ya enviadas se corta la conexión', () => {
  const res = resFalsa();
  res.headers['Content-Disposition'] = 'attachment; filename="x.xlsx"';
  errorHandler(e.noDisponible('X', 'y'), { id: 'r' }, res, () => {});
  assert.equal(res.headers['Content-Disposition'], undefined);
  const res2 = resFalsa();
  res2.headersSent = true;
  errorHandler(e.noDisponible('X', 'y'), { id: 'r' }, res2, () => {});
  assert.equal(res2.destruida, true);
});

test('ruta inexistente → AppError 404 RUTA_NO_ENCONTRADA', () => {
  let capturado;
  notFound({ method: 'GET', originalUrl: '/api/nada?x=1' }, null, (err) => { capturado = err; });
  assert.ok(capturado instanceof AppError);
  assert.equal(capturado.status, 404);
  assert.match(capturado.message, /GET \/api\/nada/);
});

test('limitador: bloquea tras el máximo con 429 + Retry-After', () => {
  const lim = crearLimitador({ ventanaMs: 60_000, max: 2, codigo: 'DEMASIADAS' });
  const req = { ip: '1.2.3.4' };
  const res = { on() {} };
  const resultados = [];
  for (let i = 0; i < 3; i += 1) lim(req, res, (err) => resultados.push(err));
  assert.equal(resultados[0], undefined);
  assert.equal(resultados[1], undefined);
  assert.equal(resultados[2].status, 429);
  assert.ok(Number(resultados[2].headers['Retry-After']) >= 1);
});
