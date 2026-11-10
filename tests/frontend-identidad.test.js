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
  // La intro de marca (isotipo + texto) vive en su propio módulo y el login solo la orquesta: ver el test «intro de marca del login».
  assert.equal(fs.existsSync(path.join(raiz, 'frontend', 'src', 'login-animation.ts')), true);
  assert.match(admin, /from '\.\/login-animation'/);
  assert.match(admin, /iniciarIntroLogin\(/);
  for (const f of ['admin.ts', 'lib/marca.ts', 'lib/ui.ts', 'login-animation.ts']) assert.doesNotMatch(leer('frontend', 'src', f), /astra/i);
});

test('intro de marca del login: isotipo desde el centro, texto con clip-path, tarjeta de cristal al final y accesible', () => {
  const ts = leer('frontend', 'src', 'login-animation.ts');
  const css = leer('frontend', 'src', 'styles', 'main.css');
  // Activos oficiales, importados para que Vite los emita con hash.
  assert.match(ts, /from '\.\/assets\/bma-isotipo\.png'/);
  assert.match(ts, /from '\.\/assets\/bma-texto\.png'/);
  for (const f of ['bma-isotipo.png', 'bma-texto.png']) assert.equal(fs.existsSync(path.join(raiz, 'frontend', 'src', 'assets', f)), true, f);
  // Orden de la secuencia: isotipo → texto → salida (la tarjeta se revela al final).
  assert.match(ts, /fase: 'isotipo'[\s\S]*fase: 'texto'/);
  assert.match(ts, /poner\('salida'\)/);
  // CSS: escala 0 → 1 con desaceleración, texto con máscara clip-path desde el centro y la tarjeta oculta hasta la revelación.
  assert.match(css, /\.intro-login__isotipo \{[^}]*scale\(0\)/);
  assert.match(css, /\.intro-login\[data-fase='isotipo'\] \.intro-login__isotipo \{[^}]*scale\(1\)[^}]*cubic-bezier/);
  assert.match(css, /\.intro-login__texto \{[^}]*clip-path: inset\(0 50% 0 50%\)/);
  assert.match(css, /clip-path: inset\(0 0 0 0\)/);
  assert.match(css, /\[data-intro='activa'\] \[data-intro-revelar\] \{[^}]*opacity: 0/);
  assert.match(css, /@keyframes intro-tarjeta-revelar/);
  assert.match(leer('frontend', 'src', 'admin.ts'), /<section data-intro-revelar class="\$\{CLS\.loginTarjeta\}/); // la tarjeta glassmorphic es lo que se revela
  // Accesibilidad y robustez: reducir movimiento, formulario inerte durante la intro, velo decorativo, omitible y una sola vez por página.
  assert.match(ts, /prefers-reduced-motion: reduce/);
  assert.match(ts, /pantalla\.inert = true/);
  assert.match(ts, /setAttribute\('aria-hidden', 'true'\)/);
  assert.match(ts, /'Escape'/);
  assert.match(ts, /let yaMostrada = false/);
  // Sin `any` ni supresiones de tipos en el módulo.
  assert.doesNotMatch(ts, /:\s*any\b|\bas any\b|<any>|@ts-ignore|@ts-expect-error/);
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
  // El marcador «A» cian fue sustituido por el isotipo oficial en metal cepillado.
  assert.doesNotMatch(firma, /#22D3EE|CYAN_TECNOLOGICO|<svg/);
  assert.match(firma, /from '\.\.\/assets\/astra-logo\.png'/);
  assert.match(leer('frontend', 'src', 'invitaciones-modulo.ts'), /\['Kids 1 B', 'Kids 1 A', 'Beginner B', 'Beginner A', 'Adultos', 'Kids 1 C', 'Beginner C'\]/);
  assert.match(admin, /<th scope="col" class="\$\{CLS\.th\}">Nivel<\/th><th scope="col" class="\$\{CLS\.th\}">Sede<\/th>/);
  assert.match(leer('frontend', 'tailwind.config.js'), /Outfit/);
});

test('marca unificada: cabecera dual solo en el portal, planilla con solo el isotipo BMA, encabezados púrpura y pie con Astra en ambas', () => {
  assert.equal(fs.existsSync(path.join(raiz, 'frontend', 'src', 'assets', 'astra-logo.png')), true);
  assert.match(leer('frontend', 'src', 'types', 'assets.d.ts'), /declare module '\*\.png'/);
  const firma = leer('frontend', 'src', 'lib', 'firma.ts');
  assert.match(firma, /Desarrollado por Astra Digital Solutions/);
  assert.match(firma, /export function cabeceraDualHtml\(/);
  assert.match(firma, /export function firmaPublica\(/);
  assert.match(firma, /group-data-\[collapsed=true\]\/sb:h-10/); // el isotipo crece en el rail contraído del sidebar

  const planilla = leer('frontend', 'src', 'admisiones.ts');
  // La planilla ya NO usa la cabecera dual: su cabecera lleva solo el isotipo circular de BMA y Astra queda únicamente en el pie.
  assert.doesNotMatch(planilla, /cabeceraDualHtml/);
  assert.match(planilla, /cabeceraIsotipoHtml\(\)/);
  assert.match(planilla, /firmaPublica\(\)/);
  const cabeceraPlanilla = /<header class="flex flex-col gap-4">[\s\S]*?<\/header>/.exec(planilla)?.[0] ?? '';
  assert.match(cabeceraPlanilla, /cabeceraIsotipoHtml\(\)/);
  assert.doesNotMatch(cabeceraPlanilla, /astra|firma|cabeceraDual|logoCompletoHtml/i);
  assert.doesNotMatch(planilla, /astra-logo/); // el metal de Astra solo se importa desde lib/firma.ts
  assert.ok(planilla.indexOf('${firmaPublica()}') > planilla.indexOf('<form id="planilla"'), 'el pie con Astra va después de la planilla');
  const marcaTs = leer('frontend', 'src', 'lib', 'marca.ts');
  assert.match(marcaTs, /export function cabeceraIsotipoHtml\(/);
  assert.match(marcaTs, /from '\.\.\/assets\/bma-isotipo\.png'/);
  assert.equal((marcaTs.match(/<img /g) ?? []).length, 3, 'logo completo, isotipo del sidebar e isotipo grande de la planilla: ningún otro logotipo en marca.ts');
  const encabezado = /function encabezadoSeccion[\s\S]*?\n}/.exec(planilla)?.[0] ?? '';
  assert.match(encabezado, /bg-bma-purpura[ "]/);
  assert.match(encabezado, /text-white/);
  assert.doesNotMatch(encabezado, /bg-bma-azul/);
  // Las 5 secciones (estudiante, representante, autorizadas, documentos, pago) pasan por el mismo encabezado.
  assert.equal((planilla.match(/encabezadoSeccion\(/g) ?? []).length, 3); // definición + seccionHtml + documentos
  for (const n of [1, 2, 3, 5]) assert.match(planilla, new RegExp(`seccionPorId\\('[a-z]+'\\), ${n}\\)`));
  assert.match(planilla, /encabezadoSeccion\('documentos', 4,/);

  const portal = leer('frontend', 'src', 'portal.ts');
  assert.match(portal, /cabeceraDualHtml\(\)/);
  assert.match(portal, /firmaPublica\(\)/);
  assert.match(portal, /case 'Moroso':[\s\S]*?return aviso\('bad'/);
  assert.match(portal, /bg-bma-coral-suave/);
  assert.match(portal, /text-bma-coral-oscuro/);

  // Astra vive solo en firma.ts y en las vistas públicas que la importan por nombre de función; ni marca.ts ni ui.ts la conocen.
  for (const f of ['lib/marca.ts', 'lib/ui.ts']) assert.doesNotMatch(leer('frontend', 'src', f), /astra/i);
});
