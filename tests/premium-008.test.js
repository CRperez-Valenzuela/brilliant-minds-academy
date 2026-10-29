'use strict';
// Migración 008: catálogo de módulos, traducción del SQLSTATE BM403 del trigger de sedes y estilo PostgreSQL puro (sin residuos MSSQL).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { CATALOGO, porCodigo, LIMITE_SEDES_BASE, MODULO_MULTI_SEDE } = require('../modules/premium/catalogo');
const { normalizar } = require('../middlewares/errorHandler');

const RAIZ = path.resolve(__dirname, '..');
const sql008 = fs.readFileSync(path.join(RAIZ, 'database', 'migrations', '008_nuevos_premium.sql'), 'utf8');
const sinComentarios = (t) => t.replace(/--[^\n]*/g, '');

test('catálogo: MULTI_SEDE_PREMIUM (US$ 50) y FACTURACION_MASIVA (US$ 20) con los códigos exactos de la migración 008', () => {
  assert.equal(porCodigo('MULTI_SEDE_PREMIUM').precioUsd, 50);
  assert.equal(porCodigo('MULTI_SEDE_PREMIUM').nombre, 'Expansión Multi-Sede Avanzada (3+ Sedes)');
  assert.equal(porCodigo('FACTURACION_MASIVA').precioUsd, 20);
  assert.equal(porCodigo('FACTURACION_MASIVA').nombre, 'Módulo de Facturación Masiva Automatizada');
  assert.equal(new Set(CATALOGO.map((m) => m.codigo)).size, CATALOGO.length, 'sin códigos repetidos');
  assert.equal(LIMITE_SEDES_BASE, 2);
  assert.equal(MODULO_MULTI_SEDE, 'MULTI_SEDE_PREMIUM');
  for (const m of CATALOGO) assert.ok(m.codigo.length <= 30, `${m.codigo} cabe en VARCHAR(30)`);
});

test('008: cada módulo del catálogo tiene su código en alguna migración (003 o 008) con el mismo precio', () => {
  const todas = fs.readdirSync(path.join(RAIZ, 'database', 'migrations')).filter((f) => f.endsWith('.sql'))
    .map((f) => fs.readFileSync(path.join(RAIZ, 'database', 'migrations', f), 'utf8')).join('\n');
  for (const m of CATALOGO) {
    const fila = new RegExp(`\\('${m.codigo}',[\\s\\S]*?([0-9]+\\.[0-9]{2})\\)`).exec(todas);
    assert.ok(fila, `${m.codigo} sin INSERT en las migraciones`);
    assert.equal(Number(fila[1]), m.precioUsd, `${m.codigo}: precio del catálogo = precio sembrado`);
  }
});

test('errorHandler: SQLSTATE BM403 → 403 MODULO_PREMIUM_DESHABILITADO con el detalle JSON del trigger', () => {
  const err = Object.assign(new Error('MODULO_PREMIUM_DESHABILITADO'), {
    name: 'error', severity: 'ERROR', code: 'BM403',
    detail: JSON.stringify({ modulo: 'MULTI_SEDE_PREMIUM', nombre: 'Expansión Multi-Sede Avanzada (3+ Sedes)', precio_usd: 50, limite_sedes_base: 2 }),
  });
  const r = normalizar(err);
  assert.deepEqual([r.status, r.codigo, r.mensaje], [403, 'MODULO_PREMIUM_DESHABILITADO', 'Módulo Premium Deshabilitado']);
  assert.deepEqual(r.detalles, { modulo: 'MULTI_SEDE_PREMIUM', nombre: 'Expansión Multi-Sede Avanzada (3+ Sedes)', precio_usd: 50, limite_sedes_base: 2 });
});

test('errorHandler: BM403 con detail ausente, no-JSON o de otro tipo JSON no revienta y conserva los datos por defecto', () => {
  for (const detail of [undefined, '', 'no es json {', '[1,2]', 'null', '42']) {
    const r = normalizar(Object.assign(new Error('x'), { name: 'error', severity: 'ERROR', code: 'BM403', detail }));
    assert.equal(r.status, 403);
    assert.equal(r.codigo, 'MODULO_PREMIUM_DESHABILITADO');
    assert.deepEqual(r.detalles, { modulo: 'MULTI_SEDE_PREMIUM', limite_sedes_base: 2 }, `detail=${JSON.stringify(detail)}`);
  }
});

test('008: PostgreSQL puro — sin residuos de MSSQL (N\'…\', dbo., GETDATE, IDENTITY, TOP, @@), idempotente y con search_path fijo', () => {
  const t = sinComentarios(sql008);
  assert.ok(!/\bN'/.test(t), "sin prefijo N'…' de MSSQL");
  assert.ok(!/\bdbo\.|GETDATE|\bIDENTITY\b|\bTOP\s*\(?\d|@@|\bNVARCHAR\b|\bSCOPE_IDENTITY\b|\bIF\s+NOT\s+EXISTS\s*\(\s*SELECT\s+\*\s+FROM\s+sys\./i.test(t));
  assert.match(t, /ON CONFLICT \(codigo\) DO NOTHING/);
  assert.match(t, /CREATE OR REPLACE FUNCTION fn_limitar_sedes_base\(\)/);
  assert.match(t, /SET search_path = public, pg_temp/);
  assert.match(t, /REVOKE ALL ON FUNCTION fn_limitar_sedes_base\(\) FROM PUBLIC/);
  assert.match(t, /DROP TRIGGER IF EXISTS trg_sedes_limite_base ON sedes;\s*CREATE TRIGGER trg_sedes_limite_base BEFORE INSERT ON sedes/);
  assert.match(t, /pg_advisory_xact_lock\(/, 'serializa las altas de sedes');
  assert.match(t, /ERRCODE = 'BM403'/);
});

test('sedes.service: comprueba el cupo con el módulo fresco y usa marcadores posicionales', () => {
  const t = sinComentarios(fs.readFileSync(path.join(RAIZ, 'services', 'sedes.service.js'), 'utf8'));
  assert.match(t, /guard\.evaluar\(MODULO_MULTI_SEDE, \{ fresco: true \}\)/);
  assert.match(t, /SELECT 1 AS x FROM sedes WHERE nombre = \$1/);
});

test('routes: la generación masiva de mensualidades exige FACTURACION_MASIVA', () => {
  const rutas = sinComentarios(fs.readFileSync(path.join(RAIZ, 'routes', 'index.js'), 'utf8'));
  assert.match(rutas, /api\.post\('\/facturacion\/cuotas\/generar-mensualidades', soloAdmin, guard\.requireModulo\('FACTURACION_MASIVA'\), facturacion\.generarMensualidades\)/);
});
