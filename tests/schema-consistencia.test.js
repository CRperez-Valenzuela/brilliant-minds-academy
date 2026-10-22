'use strict';
/**
 * Auditoría estática SQL ↔ código (no necesita base de datos): todo lo que el backend escribe o lee de MSSQL debe existir
 * en database/migrations/*.sql, y los valores literales (estados, métodos…) deben coincidir con los CHECK del esquema.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.resolve(__dirname, '..');
const leer = (p) => fs.readFileSync(path.join(RAIZ, p), 'utf8');
const migraciones = fs.readdirSync(path.join(RAIZ, 'database', 'migrations')).filter((f) => f.endsWith('.sql')).sort().map((f) => [f, leer(`database/migrations/${f}`)]);
const sqlTodo = migraciones.map(([, t]) => t).join('\n');

function archivosJs(dir, acc = []) {
  for (const e of fs.readdirSync(path.join(RAIZ, dir), { withFileTypes: true })) {
    const rel = path.join(dir, e.name);
    if (e.isDirectory()) archivosJs(rel, acc); else if (e.name.endsWith('.js')) acc.push(rel);
  }
  return acc;
}
const FUENTES = ['services', 'controllers', 'modules', 'scripts'].flatMap((d) => archivosJs(d));
const codigo = FUENTES.map((f) => [f, leer(f)]);

// ── Esquema ─────────────────────────────────────────────────────────────────────────────────────
const tablas = {};
for (const m of sqlTodo.matchAll(/CREATE TABLE dbo\.(\w+)\s*\(([\s\S]*?)\n\);/g)) {
  const cols = new Set();
  for (const linea of m[2].split('\n')) {
    const c = /^\s{2}([a-z_0-9]+)\s+(?:INT|BIGINT|NVARCHAR|CHAR|DATE|DATETIME2|DECIMAL|BIT|SMALLINT)/i.exec(linea);
    if (c) cols.add(c[1]);
  }
  tablas[m[1]] = cols;
}
const vistaTexto = /CREATE OR ALTER VIEW dbo\.(\w+) AS([\s\S]*?)\nGO/.exec(sqlTodo);
const vista = { nombre: vistaTexto[1], cols: new Set([...vistaTexto[2].matchAll(/\bAS\s+(\w+)\s*[,\n]/g)].map((m) => m[1])) };
for (const m of vistaTexto[2].matchAll(/\be\.(\w+)\s*,/g)) vista.cols.add(m[1]);
const objetos = new Set([...Object.keys(tablas), vista.nombre]);

test('el esquema define las tablas del Core Base', () => {
  for (const t of ['usuarios_admin', 'representantes', 'estudiantes', 'documentos_estudiante', 'cuotas', 'pagos_referencias', 'tasas_bcv', 'cuentas_pago',
    'personal', 'horas_clase', 'nomina_pagos', 'egresos', 'notificaciones_whatsapp', 'portal_tokens', 'modulos_premium', 'parametros', 'schema_migrations']) {
    assert.ok(tablas[t] && tablas[t].size >= 2, `falta la tabla ${t} (o no se pudo leer)`);
  }
  assert.ok(vista.cols.has('estado_dinamico') && vista.cols.has('estatus_pago') && vista.cols.has('deuda_vencida_usd'));
});

test('todo objeto dbo.* referenciado por el código existe en las migraciones', () => {
  const faltan = [];
  for (const [f, t] of codigo) for (const m of t.matchAll(/\bdbo\.(\w+)/g)) if (!objetos.has(m[1])) faltan.push(`${f}: dbo.${m[1]}`);
  assert.deepEqual([...new Set(faltan)], []);
});

test('INSERT INTO dbo.X (columnas…) solo usa columnas existentes', () => {
  const malas = [];
  for (const [f, t] of codigo) {
    for (const m of t.matchAll(/INSERT INTO dbo\.(\w+)\s*\(([^)]*)\)/g)) {
      const cols = tablas[m[1]];
      if (!cols) continue;
      for (const c of m[2].split(',').map((x) => x.trim()).filter(Boolean)) if (!cols.has(c)) malas.push(`${f}: ${m[1]}.${c}`);
    }
  }
  assert.deepEqual(malas, []);
});

test('UPDATE dbo.X SET col = … solo usa columnas existentes', () => {
  const malas = [];
  for (const [f, t] of codigo) {
    for (const m of t.matchAll(/UPDATE dbo\.(\w+)\s+SET\s+([\s\S]*?)(?=\bOUTPUT\b|\bWHERE\b|`|'\s*,)/g)) {
      const cols = tablas[m[1]];
      if (!cols) continue;
      const lista = m[2].replace(/\$\{[^}]*\}/g, '');
      for (const a of lista.matchAll(/(?:^|,)\s*(\w+)\s*=/g)) if (!cols.has(a[1])) malas.push(`${f}: ${m[1]}.${a[1]}`);
    }
  }
  assert.deepEqual(malas, []);
});

test('columnas con alias de la vista (v.xxx) existen en dbo.vw_estudiantes_estado', () => {
  const malas = [];
  for (const [f, t] of codigo) {
    if (!/vw_estudiantes_estado v\b/.test(t)) continue;
    for (const m of t.matchAll(/\bv\.(\w+)/g)) if (!vista.cols.has(m[1])) malas.push(`${f}: v.${m[1]}`);
  }
  assert.deepEqual(malas, []);
});

test('literales de estado/tipo/método usados en SQL coinciden con los CHECK del esquema', () => {
  const permitidos = new Set();
  for (const m of sqlTodo.matchAll(/CHECK\s*\(([^;]*?)\)(?:\s*,|\s*\n|\s*;)/g)) for (const l of m[1].matchAll(/N'([^']+)'/g)) permitidos.add(l[1]);
  for (const m of sqlTodo.matchAll(/DEFAULT N'([^']+)'/g)) permitidos.add(m[1]);
  assert.ok(permitidos.has('Por Validar') && permitidos.has('En Revisión') && permitidos.has('PAGO_MOVIL'));
  const desconocidos = [];
  for (const [f, t] of codigo) {
    for (const m of t.matchAll(/\b(?:estado|estatus_academico|tipo|metodo_pago|modalidad_pago|estado_dinamico)\s*(?:=|<>|IN)\s*\(?\s*((?:N'[^']+'\s*,?\s*)+)/g)) {
      for (const l of m[1].matchAll(/N'([^']+)'/g)) if (!permitidos.has(l[1])) desconocidos.push(`${f}: N'${l[1]}'`);
    }
  }
  assert.deepEqual([...new Set(desconocidos)], []);
});

test('enums de los controladores (métodos de pago, estados) coinciden con el esquema', () => {
  const metodosCheck = [...(/ck_pagos_metodo CHECK \(metodo_pago IN \(([^)]*)\)/.exec(sqlTodo)[1]).matchAll(/N'([^']+)'/g)].map((m) => m[1]).sort();
  for (const f of ['controllers/admisiones.controller.js', 'controllers/portal.controller.js', 'controllers/configuracion.controller.js']) {
    const t = leer(f);
    const lista = /\[('ZELLE'[^\]]*)\]/.exec(t);
    assert.ok(lista, `${f} no declara los métodos de pago`);
    assert.deepEqual([...lista[1].matchAll(/'([^']+)'/g)].map((m) => m[1]).sort(), metodosCheck, f);
  }
});

test('T-SQL: hábitos que rompen en SQL Server (sin ";" antes de ELSE, CREATE VIEW en su propio lote, constraints con nombre único)', () => {
  for (const [f, t] of migraciones) {
    assert.ok(!/;\s*\n?\s*ELSE\b/i.test(t), `${f}: ';' antes de ELSE`);
    const parens = [...t].reduce((n, c) => n + (c === '(' ? 1 : c === ')' ? -1 : 0), 0);
    assert.equal(parens, 0, `${f}: paréntesis desbalanceados`);
  }
  const nombres = [...sqlTodo.matchAll(/CONSTRAINT\s+(\w+)/g)].map((m) => m[1]);
  assert.equal(nombres.length, new Set(nombres).size, 'nombres de CONSTRAINT repetidos: SQL Server exige unicidad por esquema');
  const idx = [...sqlTodo.matchAll(/CREATE (?:UNIQUE )?INDEX (\w+) ON dbo\.(\w+)/g)].map((m) => `${m[2]}.${m[1]}`);
  assert.equal(idx.length, new Set(idx).size, 'índices repetidos');
  const lotes = sqlTodo.split(/^\s*GO\s*$/gim).filter((l) => /CREATE OR ALTER VIEW/.test(l));
  for (const l of lotes) assert.ok(/^\s*(--[^\n]*\n\s*)*CREATE OR ALTER VIEW/.test(l.trim()), 'CREATE VIEW debe ser la primera sentencia de su lote');
});

test('toda consulta del código usa parámetros: ningún SQL se arma con ${…} de datos de usuario', () => {
  const peligro = [];
  for (const [f, t] of codigo) {
    for (const m of t.matchAll(/`([^`]*\$\{[^}]+\}[^`]*)`/g)) {
      if (!/\b(SELECT|INSERT|UPDATE|DELETE|MERGE)\b/.test(m[1])) continue;
      for (const interp of m[1].matchAll(/\$\{([^}]+)\}/g)) {
        // permitidas: fragmentos constantes definidos en el propio módulo (filtro, COLS_PERSONAL) o constantes numéricas
        if (!/^(filtro|COLS_PERSONAL|DIAS_VIGENCIA)$/.test(interp[1].trim())) peligro.push(`${f}: \${${interp[1]}}`);
      }
    }
  }
  assert.deepEqual(peligro, []);
});
