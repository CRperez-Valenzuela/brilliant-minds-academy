'use strict';
require('./helpers/entorno');
const test = require('node:test');
const assert = require('node:assert/strict');
const { crearBcvService, extraerTasa } = require('../services/bcv.service');
const { crearGuard } = require('../modules/premium/guard');

test('BCV: interpreta la respuesta de la fuente y rechaza datos inválidos', () => {
  const t = extraerTasa({ fuente: 'oficial', promedio: 36.5123, fechaActualizacion: '2026-10-21T16:00:00.000Z' });
  assert.equal(t.tasa, 36.5123);
  assert.equal(t.fuente, 'dolarapi:oficial');
  assert.ok(t.fechaValor instanceof Date);
  for (const mala of [null, {}, { promedio: 0 }, { promedio: 'abc' }, { promedio: -3 }]) assert.throws(() => extraerTasa(mala));
});

function bcvConFakes({ http, ultima = null, ahora = () => Date.parse('2026-10-21T20:00:00Z') }) {
  const guardadas = [];
  const repo = { guardar: async (t) => { guardadas.push(t); return new Date(ahora()); }, ultima: async () => ultima };
  return { svc: crearBcvService({ http, repo, url: 'https://fuente.test', maxHoras: 24, ahora }), guardadas };
}

test('BCV: cachea 5 min salvo `fresca:true` ("al segundo exacto del envío")', async () => {
  let llamadas = 0;
  const http = { get: async () => { llamadas += 1; return { data: { fuente: 'oficial', promedio: 36 + llamadas } }; } };
  const { svc, guardadas } = bcvConFakes({ http });
  assert.equal((await svc.obtenerTasa()).tasa, 37);
  assert.equal((await svc.obtenerTasa()).tasa, 37); // cache
  assert.equal(llamadas, 1);
  const fresca = await svc.obtenerTasa({ fresca: true });
  assert.equal(fresca.tasa, 38);
  assert.equal(fresca.desactualizada, false);
  assert.equal(guardadas.length, 2);
});

test('BCV: si la fuente cae usa la última tasa guardada (<=24 h) marcándola desactualizada', async () => {
  const http = { get: async () => { throw new Error('ECONNREFUSED'); } };
  const reciente = { tasa: '36.4000', fuente: 'dolarapi:oficial', fecha_valor: null, capturada_en: new Date(Date.parse('2026-10-21T18:00:00Z')) };
  const { svc } = bcvConFakes({ http, ultima: reciente });
  const orig = console.error; console.error = () => {};
  const r = await svc.obtenerTasa({ fresca: true });
  console.error = orig;
  assert.equal(r.tasa, 36.4);
  assert.equal(r.desactualizada, true);
});

test('BCV: sin fuente y con tasa guardada de más de 24 h (o ninguna) → 503 TASA_BCV_NO_DISPONIBLE', async () => {
  const http = { get: async () => { throw new Error('timeout'); } };
  const vieja = { tasa: '30', fuente: 'x', fecha_valor: null, capturada_en: new Date(Date.parse('2026-10-19T00:00:00Z')) };
  const orig = console.error; console.error = () => {};
  for (const ultima of [vieja, null]) {
    const { svc } = bcvConFakes({ http, ultima });
    await assert.rejects(svc.obtenerTasa({ fresca: true }), (e) => e.status === 503 && e.codigo === 'TASA_BCV_NO_DISPONIBLE');
  }
  console.error = orig;
});

const next = () => { const r = { llamado: false }; r.fn = (err) => { r.llamado = true; r.err = err; }; return r; };

test('premium: módulo deshabilitado → 403 MODULO_PREMIUM_DESHABILITADO con tooltip y precio', async () => {
  const repo = { leer: async () => ({ nombre: 'Integración Bancaria', precio_usd: '300.00', habilitado: false }) };
  const { requireModulo } = crearGuard({ repo });
  const n = next();
  await requireModulo('BANCAMIGA')({}, {}, n.fn);
  assert.equal(n.err.status, 403);
  assert.equal(n.err.codigo, 'MODULO_PREMIUM_DESHABILITADO');
  assert.equal(n.err.message, 'Módulo Premium Deshabilitado');
  assert.equal(n.err.detalles.precio_usd, 300);
});

test('premium: habilitado pasa; código sin fila en BD se bloquea; módulo inexistente falla al montar la ruta', async () => {
  const { requireModulo } = crearGuard({ repo: { leer: async (c) => (c === 'APP_MOVIL' ? { nombre: 'App', precio_usd: 450, habilitado: true } : null) } });
  const ok = next();
  await requireModulo('APP_MOVIL')({}, {}, ok.fn);
  assert.equal(ok.err, undefined);
  const bloqueado = next();
  await requireModulo('IA_ATENCION')({}, {}, bloqueado.fn);
  assert.equal(bloqueado.err.codigo, 'MODULO_PREMIUM_DESHABILITADO');
  assert.throws(() => requireModulo('INVENTADO'), /desconocido/);
});

test('premium: cache de 15 s y la activación comercial se refleja al expirar (o al invalidar)', async () => {
  let t = 0; let habilitado = false; let lecturas = 0;
  const repo = { leer: async () => { lecturas += 1; return { nombre: 'WA', precio_usd: 150, habilitado }; } };
  const g = crearGuard({ repo, ttlMs: 15_000, ahora: () => t });
  const mw = g.requireModulo('WHATSAPP_AUTOMATICO');
  let n = next(); await mw({}, {}, n.fn); assert.ok(n.err);
  habilitado = true; t = 5_000;
  n = next(); await mw({}, {}, n.fn); assert.ok(n.err, 'dentro del TTL sigue en caché');
  assert.equal(lecturas, 1);
  t = 16_000;
  n = next(); await mw({}, {}, n.fn); assert.equal(n.err, undefined);
});

test('premium: un fallo de base de datos se propaga al manejador JSON (no se deja pasar la petición)', async () => {
  const boom = new Error('db caída');
  const { requireModulo } = crearGuard({ repo: { leer: async () => { throw boom; } } });
  const n = next();
  await requireModulo('IA_ATENCION')({}, {}, n.fn);
  assert.equal(n.err, boom);
});
