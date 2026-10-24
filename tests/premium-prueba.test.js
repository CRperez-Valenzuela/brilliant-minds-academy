'use strict';
const { db } = require('./helpers/entorno');
const Module = require('node:module');
const test = require('node:test');
const assert = require('node:assert/strict');
const { AppError } = require('../errors/AppError');
const { crearGuard, estadoEfectivo } = require('../modules/premium/guard');
const { activarPrueba, DIAS_PRUEBA } = require('../modules/premium/prueba.service');

const rs = (...filas) => ({ rows: filas, rowCount: filas.length });
const T0 = Date.parse('2026-10-23T12:00:00Z');
const dias = (n) => new Date(T0 + n * 86_400_000).toISOString();
const siguiente = () => { const r = { llamado: false }; r.fn = (err) => { r.llamado = true; r.err = err; }; return r; };

// ── estadoEfectivo (puro) ────────────────────────────────────────────────────────────────────────
test('estadoEfectivo: permanente, prueba vigente (días hacia arriba), vencida y deshabilitado', () => {
  const base = { nombre: 'WA', precio_usd: '150.00' };
  assert.deepEqual(
    (({ habilitado, enPrueba, vencida }) => ({ habilitado, enPrueba, vencida }))(estadoEfectivo({ ...base, habilitado: true, expira_prueba_en: null }, T0)),
    { habilitado: true, enPrueba: false, vencida: false });
  const prueba = estadoEfectivo({ ...base, habilitado: true, expira_prueba_en: dias(14.2) }, T0);
  assert.equal(prueba.habilitado, true);
  assert.equal(prueba.enPrueba, true);
  assert.equal(prueba.diasRestantes, 15);
  assert.equal(estadoEfectivo({ ...base, habilitado: true, expira_prueba_en: dias(0.01) }, T0).diasRestantes, 1);
  const vencida = estadoEfectivo({ ...base, habilitado: true, expira_prueba_en: dias(-1) }, T0);
  assert.deepEqual([vencida.habilitado, vencida.vencida, vencida.motivo], [false, true, 'PRUEBA_EXPIRADA']);
  // límite exacto: en el instante de expiración ya está vencida
  assert.equal(estadoEfectivo({ ...base, habilitado: true, expira_prueba_en: dias(0) }, T0).vencida, true);
  // un módulo deshabilitado ignora un expira_prueba_en residual
  assert.equal(estadoEfectivo({ ...base, habilitado: false, expira_prueba_en: dias(5) }, T0).habilitado, false);
  assert.equal(estadoEfectivo(null, T0, 'X').motivo, 'NO_REGISTRADO');
});

// ── guard: ventana de prueba ─────────────────────────────────────────────────────────────────────
function repoFalso(fila) {
  const r = { fila, bloqueos: [], falloBloqueo: null };
  r.leer = async () => r.fila;
  r.bloquearVencida = async (c) => { r.bloqueos.push(c); if (r.falloBloqueo) throw r.falloBloqueo; return 1; };
  return r;
}

test('guard: prueba vigente deja pasar; permanente también', async () => {
  for (const exp of [dias(3), null]) {
    const repo = repoFalso({ nombre: 'WA', precio_usd: 150, habilitado: true, expira_prueba_en: exp });
    const n = siguiente();
    await crearGuard({ repo, ahora: () => T0 }).requireModulo('WHATSAPP_AUTOMATICO')({}, {}, n.fn);
    assert.equal(n.err, undefined);
    assert.equal(repo.bloqueos.length, 0);
  }
});

test('guard: prueba vencida → bloquea en la base (habilitado = 0), responde 403 MODULO_PREMIUM_DESHABILITADO y no vuelve a escribir', async () => {
  const repo = repoFalso({ nombre: 'WA', precio_usd: '150.00', habilitado: true, expira_prueba_en: dias(-0.5) });
  const g = crearGuard({ repo, ahora: () => T0 });
  const mw = g.requireModulo('WHATSAPP_AUTOMATICO');
  const n = siguiente();
  await mw({}, {}, n.fn);
  assert.equal(n.err.status, 403);
  assert.equal(n.err.codigo, 'MODULO_PREMIUM_DESHABILITADO');
  assert.equal(n.err.message, 'Módulo Premium Deshabilitado');
  assert.deepEqual(n.err.detalles, { modulo: 'WHATSAPP_AUTOMATICO', nombre: 'WA', precio_usd: 150, motivo: 'PRUEBA_EXPIRADA' });
  assert.deepEqual(repo.bloqueos, ['WHATSAPP_AUTOMATICO']);
  const n2 = siguiente();
  await mw({}, {}, n2.fn); // segunda petición: la caché ya refleja el bloqueo
  assert.equal(n2.err.codigo, 'MODULO_PREMIUM_DESHABILITADO');
  assert.equal(repo.bloqueos.length, 1);
});

test('guard: una prueba que vence DENTRO de la ventana de caché se bloquea igual (la vigencia se evalúa en cada petición)', async () => {
  let t = T0;
  const repo = repoFalso({ nombre: 'WA', precio_usd: 150, habilitado: true, expira_prueba_en: new Date(T0 + 10_000).toISOString() });
  const mw = crearGuard({ repo, ttlMs: 60_000, ahora: () => t }).requireModulo('WHATSAPP_AUTOMATICO');
  let n = siguiente(); await mw({}, {}, n.fn); assert.equal(n.err, undefined);
  t = T0 + 20_000; // la caché (60 s) sigue vigente, la prueba no
  n = siguiente(); await mw({}, {}, n.fn);
  assert.equal(n.err.codigo, 'MODULO_PREMIUM_DESHABILITADO');
  assert.equal(repo.bloqueos.length, 1);
});

test('guard: si no se puede persistir el bloqueo igual se niega el acceso (fail-closed) y se reintenta después', async () => {
  const repo = repoFalso({ nombre: 'WA', precio_usd: 150, habilitado: true, expira_prueba_en: dias(-1) });
  repo.falloBloqueo = new Error('db caída');
  const g = crearGuard({ repo, ahora: () => T0 });
  const orig = console.error; console.error = () => {};
  const n = siguiente();
  await g.requireModulo('WHATSAPP_AUTOMATICO')({}, {}, n.fn);
  console.error = orig;
  assert.equal(n.err.codigo, 'MODULO_PREMIUM_DESHABILITADO');
});

test('guard.evaluar({fresco}) ignora la caché (lo usa el cron antes de cada ciclo)', async () => {
  let habilitado = false; let lecturas = 0;
  const repo = { leer: async () => { lecturas += 1; return { nombre: 'WA', precio_usd: 150, habilitado, expira_prueba_en: null }; }, bloquearVencida: async () => 0 };
  const g = crearGuard({ repo, ttlMs: 15_000, ahora: () => T0 });
  assert.equal((await g.evaluar('WHATSAPP_AUTOMATICO')).habilitado, false);
  habilitado = true;
  assert.equal((await g.evaluar('WHATSAPP_AUTOMATICO')).habilitado, false, 'dentro del TTL sigue en caché');
  assert.equal((await g.evaluar('WHATSAPP_AUTOMATICO', { fresco: true })).habilitado, true);
  assert.equal(lecturas, 2);
});

// ── activarPrueba (servicio) ─────────────────────────────────────────────────────────────────────
test('activarPrueba: una sola sentencia atómica con parámetros posicionales; fija habilitado y expira_prueba_en = NOW() + 15 días', async () => {
  db.reiniciar();
  db.handler = async (texto) => (/^\s*UPDATE modulos_premium/.test(texto)
    ? rs({ codigo: 'WHATSAPP_AUTOMATICO', nombre: 'WA', habilitado_en: new Date(T0), prueba_iniciada_en: new Date(T0), expira_prueba_en: new Date(T0 + 15 * 86_400_000) })
    : rs());
  const r = await activarPrueba({ codigo: 'WHATSAPP_AUTOMATICO' });
  assert.equal(db.llamadas.length, 1, 'sin SELECT previo: la condición vive en el UPDATE');
  const { texto, params } = db.llamadas[0];
  assert.deepEqual(params, ['WHATSAPP_AUTOMATICO', DIAS_PRUEBA]);
  assert.equal(DIAS_PRUEBA, 15);
  assert.match(texto, /habilitado = TRUE/);
  assert.match(texto, /expira_prueba_en = NOW\(\) \+ \(\$2::int \* INTERVAL '1 day'\)/);
  assert.match(texto, /WHERE codigo = \$1 AND habilitado = FALSE AND prueba_iniciada_en IS NULL/);
  assert.equal(r.en_prueba, true);
  assert.equal(r.dias_prueba, 15);
  assert.equal(r.modulo, 'WHATSAPP_AUTOMATICO');
});

test('activarPrueba: diagnostica 404 / ya habilitado (permanente o en prueba) / prueba ya utilizada', async () => {
  const caso = async (fila) => {
    db.reiniciar();
    db.handler = async (texto) => (/^\s*UPDATE/.test(texto) ? rs() : (fila ? rs(fila) : rs()));
    return activarPrueba({ codigo: 'BANCAMIGA' }).then(() => null, (e) => e);
  };
  let e = await caso(null);
  assert.ok(e instanceof AppError); assert.equal(e.status, 404);
  e = await caso({ nombre: 'B', habilitado: true, prueba_iniciada_en: null, expira_prueba_en: null });
  assert.deepEqual([e.status, e.codigo, e.detalles.en_prueba], [409, 'MODULO_YA_HABILITADO', false]);
  e = await caso({ nombre: 'B', habilitado: true, prueba_iniciada_en: new Date(), expira_prueba_en: new Date(Date.now() + 86_400_000) });
  assert.deepEqual([e.codigo, e.detalles.en_prueba], ['MODULO_YA_HABILITADO', true]);
  e = await caso({ nombre: 'B', habilitado: false, prueba_iniciada_en: new Date(), expira_prueba_en: null });
  assert.deepEqual([e.status, e.codigo], [409, 'PRUEBA_YA_UTILIZADA']);
  e = await caso({ nombre: 'B', habilitado: true, prueba_iniciada_en: new Date(), expira_prueba_en: new Date(Date.now() - 1000) }); // vencida aún sin limpiar
  assert.equal(e.codigo, 'PRUEBA_YA_UTILIZADA');
});

// ── POST /api/premium/activar-prueba (cadena de middlewares real, Express simulado) ───────────────
test('POST /premium/activar-prueba: solo admin, valida el módulo, responde 201 e invalida la caché del guard', async () => {
  const registros = [];
  const cargaPrevia = Module._load;
  Module._load = function cargar(request, ...resto) {
    if (request === 'express') {
      return { Router: () => ({
        get: (path, ...h) => { registros.push({ m: 'GET', path, h }); },
        post: (path, ...h) => { registros.push({ m: 'POST', path, h }); },
        put: (path, ...h) => { registros.push({ m: 'PUT', path, h }); },
        use() {},
      }) };
    }
    if (request === 'jsonwebtoken') return { sign: () => 'x', verify: (t) => JSON.parse(t) }; // el "token" de la prueba es el propio JSON del payload
    return cargaPrevia.call(this, request, ...resto);
  };
  let premium;
  try { premium = require('../modules/premium/premium.routes'); } finally { Module._load = cargaPrevia; }
  assert.ok(premium.catalogoRouter);

  const ruta = registros.find((r) => r.m === 'POST' && r.path === '/activar-prueba');
  assert.ok(ruta, 'la ruta POST /activar-prueba existe');
  assert.equal(ruta.h.length, 4, 'requireAuth → requireRol(admin) → requireConsolidado (sin sede) → handler');

  const correr = async (rol, cuerpo) => {
    const req = { get: (h) => (h.toLowerCase() === 'authorization' ? `Bearer ${JSON.stringify({ sub: 7, rol, nombre: 'U' })}` : ''), body: cuerpo };
    const res = { statusCode: null, cuerpo: null, status(c) { this.statusCode = c; return this; }, json(b) { this.cuerpo = b; return this; } };
    let error = null;
    for (const mw of ruta.h) {
      let siguienteLlamado = false; let err;
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => {
        const next = (e) => { siguienteLlamado = true; err = e; resolve(); };
        Promise.resolve(mw(req, res, next)).then(() => { if (res.cuerpo !== null) resolve(); }, (e) => { err = e; siguienteLlamado = true; resolve(); });
      });
      if (err) { error = err; break; }
      if (!siguienteLlamado) break;
    }
    return { res, error };
  };

  db.reiniciar();
  let r = await correr('secretaria', { modulo: 'WHATSAPP_AUTOMATICO' });
  assert.equal(r.error.status, 403, 'una secretaria no puede activar pruebas');
  assert.equal(db.llamadas.length, 0);

  r = await correr('admin', { modulo: 'NO_EXISTE' });
  assert.equal(r.error.status, 422);
  assert.equal(db.llamadas.length, 0);

  db.handler = async () => rs({ codigo: 'WHATSAPP_AUTOMATICO', nombre: 'WA', habilitado_en: new Date(), prueba_iniciada_en: new Date(), expira_prueba_en: new Date(Date.now() + 15 * 86_400_000) });
  const { guard } = require('../modules/premium/guard');
  let invalidada = 0; const invalidarOriginal = guard.invalidar; guard.invalidar = () => { invalidada += 1; };
  const silencio = console.log; console.log = () => {};
  r = await correr('admin', { modulo: 'WHATSAPP_AUTOMATICO' });
  console.log = silencio; guard.invalidar = invalidarOriginal;
  assert.equal(invalidada, 1);
  assert.equal(r.error, null);
  assert.equal(r.res.statusCode, 201);
  assert.equal(r.res.cuerpo.ok, true);
  assert.equal(r.res.cuerpo.data.dias_prueba, 15);
});
