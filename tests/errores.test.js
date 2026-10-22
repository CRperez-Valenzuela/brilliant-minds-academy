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
const errorPg = (code, mensaje, extra = {}) => Object.assign(new Error(mensaje), { name: 'error', severity: 'ERROR', code, ...extra });

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

test('PostgreSQL: duplicados (23505) → 409 con código legible según el índice/constraint violado', () => {
  const ref = normalizar(errorPg('23505', 'duplicate key value violates unique constraint "ux_pagos_referencia_activa"', { constraint: 'ux_pagos_referencia_activa' }));
  assert.equal(ref.status, 409);
  assert.equal(ref.codigo, 'REFERENCIA_DUPLICADA');
  const ced = normalizar(errorPg('23505', 'duplicate key value violates unique constraint "uq_personal_cedula"', { constraint: 'uq_personal_cedula' }));
  assert.equal(ced.codigo, 'CEDULA_DUPLICADA');
  assert.equal(normalizar(errorPg('23505', 'sin nombre conocido')).codigo, 'REGISTRO_DUPLICADO');
  assert.equal(normalizar(errorPg('23505', 'x', { constraint: 'ux_cuotas_mensualidad_concepto' })).codigo, 'CUOTA_DUPLICADA');
});

test('PostgreSQL: FK, NOT NULL, CHECK, tipos, deadlock, timeout y conexión caída no filtran SQL al cliente', () => {
  assert.equal(normalizar(errorPg('23503', 'insert or update on table "cuotas" violates foreign key constraint "fk_x"')).codigo, 'VIOLACION_INTEGRIDAD');
  assert.equal(normalizar(errorPg('23502', 'null value in column "nombres"')).status, 422);
  assert.equal(normalizar(errorPg('23514', 'new row violates check constraint "ck_personal_coherencia"')).status, 422);
  assert.equal(normalizar(errorPg('22001', 'value too long for type character varying(100)')).status, 422);
  assert.equal(normalizar(errorPg('22P02', 'invalid input syntax for type integer: "abc"')).status, 422);
  for (const c of ['40P01', '40001']) {
    const dl = normalizar(errorPg(c, 'deadlock detected'));
    assert.equal(dl.status, 503);
    assert.equal(dl.codigo, 'REINTENTAR');
    assert.equal(dl.headers['Retry-After'], '2');
  }
  assert.equal(normalizar(errorPg('57014', 'canceling statement due to statement timeout')).status, 504);
  for (const c of ['08006', '08001', '28P01', '53300', '57P01']) assert.equal(normalizar(errorPg(c, 'x')).codigo, 'BASE_DATOS_NO_DISPONIBLE', c);
  // errores de red / del pool sin SQLSTATE
  assert.equal(normalizar(Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:5432'), { code: 'ECONNREFUSED' })).codigo, 'BASE_DATOS_NO_DISPONIBLE');
  assert.equal(normalizar(new Error('timeout exceeded when trying to connect')).status, 503);
  assert.equal(normalizar(new Error('Connection terminated unexpectedly')).status, 503);
  // un EPERM de Node (5 letras mayúsculas) NO se confunde con un SQLSTATE
  assert.equal(normalizar(Object.assign(new Error('operation not permitted'), { code: 'EPERM' })).codigo, 'ERROR_INTERNO');
  const res = resFalsa();
  const orig = console.error; console.error = () => {};
  errorHandler(new Error("SELECT * FROM usuarios_admin WHERE password_hash = 'x' falló"), { id: 'r', method: 'GET', originalUrl: '/' }, res, () => {});
  console.error = orig;
  assert.equal(res.estado, 500);
  assert.equal(res.cuerpo.error.codigo, 'ERROR_INTERNO');
  assert.ok(!JSON.stringify(res.cuerpo).includes('password_hash'));
  // el detalle del servidor ("Key (cedula)=(V-1) already exists") jamás llega al cliente
  const dup = resFalsa();
  errorHandler(errorPg('23505', 'dup', { constraint: 'uq_representantes_cedula', detail: 'Key (cedula)=(V-12345678) already exists.' }), { id: 'r', method: 'POST', originalUrl: '/' }, dup, () => {});
  assert.equal(dup.estado, 409);
  assert.ok(!JSON.stringify(dup.cuerpo).includes('V-12345678'));
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
