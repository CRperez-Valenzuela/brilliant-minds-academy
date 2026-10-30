'use strict';
require('./helpers/entorno');
const test = require('node:test');
const assert = require('node:assert/strict');
const { AppError } = require('../errors/AppError');
const { crearWhatsappService, clasificarErrorMeta, CLASE_FALLA } = require('../services/whatsapp.service');

const { DESTINATARIO: D, SISTEMICA: S, DESCONOCIDA: X } = CLASE_FALLA;
const clase = (codigo, http) => clasificarErrorMeta({ codigo, http });

/** Servicio con `http` simulado que rechaza con la forma de error de axios (response.status + response.data.error). */
const conRespuesta = (status, error) => crearWhatsappService({
  http: { post: async () => { throw Object.assign(new Error(`Request failed with status code ${status}`), { response: { status, data: error === undefined ? {} : { error } } }); } },
  token: 't', phoneId: 'p', version: 'v1',
});
const fallo = (svc) => svc.enviarTexto('584141234567', 'hola').then(() => assert.fail('debía fallar'), (err) => err);

test('H1 · clasificación: códigos del DESTINATARIO, SISTÉMICOS y desconocidos según la tabla oficial de errores de la Cloud API', () => {
  for (const c of [131021, 131026, 131047, 131049, 131050, 131056]) assert.equal(clase(c), D, `${c} debe ser del destinatario`);
  for (const c of [0, 4, 10, 190, 200, 250, 299, 368, 80007, 130429, 131005, 131031, 131037, 131042, 131045, 131048, 132000, 132001, 132005, 132007, 132015, 132016, 133010]) {
    assert.equal(clase(c), S, `${c} debe ser sistémico`);
  }
  // Ambiguos o no documentados: a propósito NO se clasifican (cuentan para el cortafuegos, como antes de H1). Los bordes del rango 200–299 son 199 y 300.
  for (const c of [100, 131000, 131009, 131016, 131030, 131051, 132012, 133004, 135000, 130472, 199, 300]) assert.equal(clase(c), X, `${c} debe quedar sin clasificar`);
});

test('H1 · el código llega como número o texto numérico; null, vacío o basura NO se confunden con el 0 (que significa «token inválido»)', () => {
  assert.equal(clase('190'), S);
  assert.equal(clase(' 131026 '), D);
  assert.equal(clase(0), S, 'el 0 real de Meta es una falla de autenticación');
  assert.equal(clase('0'), S);
  for (const basura of [null, undefined, '', '   ', 'abc', NaN, 1.5, '1.5', '-190', true, {}, []]) assert.equal(clase(basura), X, `${JSON.stringify(basura)} no debe tomarse por un código`);
});

test('H1 · sin código de Meta solo un 401/403 es sistémico; timeouts, 5xx y 429 sin cuerpo no lo son; con código, el código manda', () => {
  assert.equal(clase(null, 401), S);
  assert.equal(clase(undefined, 403), S);
  for (const http of [500, 502, 429, 408, 400, null, undefined]) assert.equal(clase(null, http), X, `HTTP ${http} sin cuerpo`);
  assert.equal(clasificarErrorMeta(), X);
  assert.equal(clase(131026, 401), D, 'el código documentado pesa más que el estado HTTP');
  assert.equal(clase(100, 401), X, 'un código sin clasificar no se escala por el estado HTTP');
});

test('H1 · enviarTexto: toda falla de Meta sale como WHATSAPP_ENVIO_FALLIDO (502) con detalles { motivo, meta_codigo, http_status, clase }', async () => {
  let err = await fallo(conRespuesta(400, { code: 131047, message: 'Re-engagement message' }));
  assert.ok(err instanceof AppError);
  assert.deepEqual([err.status, err.codigo], [502, 'WHATSAPP_ENVIO_FALLIDO'], 'el código público no cambia: el envío manual y el frontend siguen igual');
  assert.deepEqual(err.detalles, { motivo: 'Meta 131047: Re-engagement message', meta_codigo: 131047, http_status: 400, clase: 'DESTINATARIO' });

  err = await fallo(conRespuesta(401, { code: 190, message: 'Access token expired' }));
  assert.deepEqual([err.detalles.meta_codigo, err.detalles.http_status, err.detalles.clase], [190, 401, 'SISTEMICA']);

  err = await fallo(conRespuesta(400, { code: '132001', message: 'Template name does not exist' })); // código como texto → se normaliza a número
  assert.deepEqual([err.detalles.meta_codigo, err.detalles.clase], [132001, 'SISTEMICA']);

  err = await fallo(conRespuesta(500, { code: null, message: 'sin código' })); // code nulo NO es el 0
  assert.deepEqual([err.detalles.meta_codigo, err.detalles.clase], [null, 'DESCONOCIDA']);

  err = await fallo(conRespuesta(401, undefined)); // 401 sin cuerpo de error
  assert.deepEqual([err.detalles.meta_codigo, err.detalles.http_status, err.detalles.clase], [null, 401, 'SISTEMICA']);
  assert.match(err.detalles.motivo, /status code 401/);
});

test('H1 · corte de red / timeout (sin respuesta de Meta): clase DESCONOCIDA y el motivo conserva el texto del error', async () => {
  const svc = crearWhatsappService({ http: { post: async () => { throw new Error('timeout of 10000ms exceeded'); } }, token: 't', phoneId: 'p', version: 'v1' });
  const err = await fallo(svc);
  assert.deepEqual(err.detalles, { motivo: 'timeout of 10000ms exceeded', meta_codigo: null, http_status: null, clase: 'DESCONOCIDA' });
});

test('sin configurar sigue siendo 503 WHATSAPP_NO_CONFIGURADO sin tocar la red, y un AppError previo se relanza intacto', async () => {
  const sinRed = { post: async () => { throw new Error('no debía llamar a la red'); } };
  const err = await fallo(crearWhatsappService({ http: sinRed, token: '', phoneId: '', version: 'v1' }));
  assert.deepEqual([err.status, err.codigo], [503, 'WHATSAPP_NO_CONFIGURADO']);

  const propio = new AppError(500, 'PROPIO', 'ya era un AppError');
  const rel = await fallo(crearWhatsappService({ http: { post: async () => { throw propio; } }, token: 't', phoneId: 'p', version: 'v1' }));
  assert.equal(rel, propio);
});

test('envío correcto: POST a la Graph API con Bearer y cuerpo de texto (el contrato con Meta no cambió)', async () => {
  const llamadas = [];
  const svc = crearWhatsappService({ http: { post: async (...a) => { llamadas.push(a); return {}; } }, token: 'tok', phoneId: '123', version: 'v99.0' });
  assert.equal(svc.configurado(), true);
  await svc.enviarTexto('584141234567', 'Hola');
  const [url, cuerpo, opciones] = llamadas[0];
  assert.equal(url, 'https://graph.facebook.com/v99.0/123/messages');
  assert.deepEqual(cuerpo, { messaging_product: 'whatsapp', to: '584141234567', type: 'text', text: { body: 'Hola', preview_url: true } });
  assert.equal(opciones.headers.Authorization, 'Bearer tok');
});
