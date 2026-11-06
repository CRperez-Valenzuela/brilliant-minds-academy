'use strict';
// Identidad visual del panel: solo logotipo BMA, lienzo azul institucional, encabezados morados y sedes oficiales.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const raiz = path.join(__dirname, '..');
const leer = (...p) => fs.readFileSync(path.join(raiz, ...p), 'utf8');

test('el login usa el logotipo BMA sobre tarjeta de cristal; Astra solo aparece en la firma de autoría (lib/firma.ts)', () => {
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

test('rendimiento: esqueleto inmediato, caché SWR en sessionStorage, sin Egresos en el menú y filtro por tarjeta de sede', () => {
  const admin = leer('frontend', 'src', 'admin.ts');
  assert.match(admin, /montar\(zona, esqueletoPara\(id\)\)/);
  assert.match(admin, /const MODULO_EGRESOS_ACTIVO: boolean = false/);
  assert.match(admin, /alElegirSede: \(sedeId\) =>/);
  assert.match(admin, /invalidarCache\(\)/);
  assert.match(leer('frontend', 'src', 'lib', 'cache.ts'), /sessionStorage/);
  assert.match(leer('frontend', 'src', 'lib', 'esqueleto.ts'), /animate-pulse/);
  assert.match(leer('frontend', 'src', 'sedes-gestion.ts'), /data-sede-id/);
});

test('login: red neuronal y firma Astra; niveles fijos de la Sede Este y «Nivel» en lugar de «Grado»', () => {
  const admin = leer('frontend', 'src', 'admin.ts');
  assert.match(admin, /montarRedNeuronal\(/);
  assert.match(admin, /firmaLogin\(\)/);
  assert.match(admin, /firmaSidebar\(\)/);
  const firma = leer('frontend', 'src', 'lib', 'firma.ts');
  assert.match(firma, /Diseñado y desarrollado por Astra Digital Solutions/);
  assert.match(firma, /Astra Academy Suite v1\.0/);
  assert.match(firma, /#22D3EE/);
  assert.match(leer('frontend', 'src', 'invitaciones-modulo.ts'), /\['Kids 1 B', 'Kids 1 A', 'Beginner B', 'Beginner A', 'Adultos', 'Kids 1 C', 'Beginner C'\]/);
  assert.match(admin, /<th scope="col" class="\$\{CLS\.th\}">Nivel<\/th><th scope="col" class="\$\{CLS\.th\}">Sede<\/th>/);
  assert.match(leer('frontend', 'tailwind.config.js'), /Outfit/);
});
