'use strict';
/**
 * Contrato de la ruta raíz «/» (entrega profesional de Brilliant Minds Academy).
 *
 * Ejecuta el `app.js` REAL con un `express` simulado que solo registra lo que la app monta: así se verifica, sin red ni
 * dependencias instaladas, que
 *   1. «/» redirige al panel (`/admin`) y ya no sirve ningún índice temporal;
 *   2. la redirección no interfiere con los recursos estáticos (`/assets`) ni con el formulario público (`/admisiones`);
 *   3. el índice de desarrollo con viñetas (`frontend/index.html`) fue eliminado.
 * La semántica de coincidencia exacta de `app.get('/')` es la documentada de Express (no coincide con `/assets/x.js`).
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
require('./helpers/entorno');

const raiz = path.join(__dirname, '..');

function expressSimulado() {
  const rutasGet = [];
  const montajes = [];
  const app = {
    disable() {},
    set() {},
    use(...args) { montajes.push(args); },
    get(ruta, ...manejadores) { rutasGet.push({ ruta, manejadores }); },
  };
  const fabrica = () => app;
  fabrica.json = () => function json() {};
  fabrica.static = (dir, opciones) => ({ tipo: 'static', dir, opciones });
  return { fabrica, rutasGet, montajes };
}

function cargarApp() {
  const sim = expressSimulado();
  const cargaPrevia = Module._load;
  Module._load = function cargar(request, ...resto) {
    if (request === 'express') return sim.fabrica;
    if (request === './routes') return { api: function api() {}, fachada: function fachada() {} };
    return cargaPrevia.call(this, request, ...resto);
  };
  try {
    const ruta = require.resolve('../app');
    delete require.cache[ruta];
    const { crearApp } = require('../app');
    crearApp();
  } finally {
    Module._load = cargaPrevia;
  }
  return sim;
}

test('GET / redirige al panel administrativo (/admin) y no encadena otro manejador', () => {
  const { rutasGet } = cargarApp();
  const raizGet = rutasGet.filter((r) => r.ruta === '/');
  assert.equal(raizGet.length, 1, 'debe existir exactamente una ruta GET «/»');
  assert.equal(raizGet[0].manejadores.length, 1);

  const llamadas = [];
  const res = { redirect: (...args) => { llamadas.push(args); } };
  raizGet[0].manejadores[0]({}, res, () => assert.fail('«/» no debe delegar con next()'));
  // Un solo argumento → Express usa 302 (no 301): la raíz se puede reapuntar sin que el navegador la fije en caché.
  assert.deepEqual(llamadas, [['/admin']]);
});

test('la raíz no interfiere con /assets, /admin, /admisiones ni /portal/:token', () => {
  const { rutasGet, montajes } = cargarApp();

  // Las únicas rutas GET directas son «/» y el portal por token: ningún comodín que pueda tragarse /assets/* o /admisiones/*.
  assert.deepEqual(rutasGet.map((r) => r.ruta).sort(), ['/', '/portal/:token']);

  const estaticos = montajes
    .filter((a) => a[0] !== '/api' && a[0] !== '/ir' && a[1] && a[1].tipo === 'static')
    .map((a) => ({ ruta: a[0], dir: path.relative(raiz, a[1].dir), opciones: a[1].opciones }));
  const porRuta = Object.fromEntries(estaticos.map((e) => [e.ruta, e]));

  assert.equal(porRuta['/assets'].dir, path.join('public', 'assets'));
  assert.equal(porRuta['/assets'].opciones.immutable, true);
  assert.equal(porRuta['/assets'].opciones.index, false, '/assets nunca debe listar ni servir index');
  assert.equal(porRuta['/admin'].dir, path.join('public', 'admin'));
  assert.equal(porRuta['/admisiones'].dir, path.join('public', 'admisiones'), 'el formulario público sigue servido tal cual');
});

test('el índice temporal de desarrollo con viñetas fue eliminado', () => {
  assert.equal(fs.existsSync(path.join(raiz, 'frontend', 'index.html')), false);
  // El build nunca lo incluyó como entrada: las únicas son los tres cascarones (admin, admisiones, portal).
  const vite = fs.readFileSync(path.join(raiz, 'frontend', 'vite.config.ts'), 'utf8');
  assert.doesNotMatch(vite, /resolve\(aqui,\s*['"]index\.html['"]\)/);
});
