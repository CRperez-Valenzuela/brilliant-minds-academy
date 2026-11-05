'use strict';
// Identidad visual del panel: solo logotipo BMA, lienzo azul institucional, encabezados morados y sedes oficiales.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const raiz = path.join(__dirname, '..');
const leer = (...p) => fs.readFileSync(path.join(raiz, ...p), 'utf8');

test('el login usa el logotipo BMA sobre tarjeta de cristal y no queda rastro de Astra', () => {
  const admin = leer('frontend', 'src', 'admin.ts');
  assert.match(admin, /logoCompletoHtml\(/);
  assert.match(admin, /bg-bma-azul/);
  assert.match(leer('frontend', 'src', 'lib', 'ui.ts'), /bg-white\/90[^']*shadow-2xl[^']*backdrop-blur-md|backdrop-blur-md/);
  assert.equal(fs.existsSync(path.join(raiz, 'frontend', 'src', 'login-animation.ts')), false);
  assert.doesNotMatch(admin, /login-animation|montarAnimacionLogin/);
  for (const f of ['admin.ts', 'lib/marca.ts', 'lib/ui.ts']) assert.doesNotMatch(leer('frontend', 'src', f), /astra/i);
});

test('el lienzo azul solo aplica al panel admin y las cabeceras de tabla son moradas', () => {
  assert.match(leer('frontend', 'admin', 'index.html'), /<html[^>]*data-panel="admin"/);
  assert.match(leer('frontend', 'src', 'styles', 'main.css'), /html\[data-panel='admin'\][\s\S]*bg-bma-azul/);
  assert.match(leer('frontend', 'src', 'lib', 'ui.ts'), /th:[^\n]*bg-bma-purpura[^\n]*text-white/);
});

test('las sedes del Core Base se llaman Sede Este y Sede Norte (seed y migración 011)', () => {
  const seed = leer('scripts', 'seed.js');
  assert.match(seed, /const SEDES = \['Sede Este', 'Sede Norte'\]/);
  assert.match(seed, /ON CONFLICT \(nombre\) DO UPDATE/);
  const m = leer('database', 'migrations', '011_sedes_este_norte.sql');
  assert.match(m, /'Sede Este'/);
  assert.match(m, /'Sede Norte'/);
  assert.doesNotMatch(m, /INSERT\s+INTO\s+sedes/i);
  assert.doesNotMatch(leer('database', 'migrations', '008_nuevos_premium.sql'), /Acarigua|Barquisimeto/);
});
