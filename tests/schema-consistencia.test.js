'use strict';
/**
 * Auditoría estática SQL ↔ código (no necesita base de datos): todo lo que el backend escribe o lee de PostgreSQL debe existir
 * en database/migrations/*.sql, los valores literales (estados, métodos…) deben coincidir con los CHECK del esquema y el SQL
 * no debe conservar rastros de T-SQL. La validación semántica real (el servidor de PostgreSQL parseando cada consulta) está en
 * tests/integracion.pg.test.js.
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
const FUENTES = ['services', 'controllers', 'modules', 'scripts', 'middlewares', 'routes', 'config'].flatMap((d) => archivosJs(d));
// Se ignoran los comentarios JS (// y /* */): el SQL vive en cadenas/plantillas y la prosa en español no debe confundirse con consultas.
const sinComentariosJs = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/(^|[^:'"`\w])\/\/ .*$/gm, '$1');
const codigo = FUENTES.map((f) => [f, sinComentariosJs(leer(f))]);
// Solo el SQL embebido (cadenas con palabras clave), para no confundir prosa de comentarios con consultas.
const sinComentariosSql = (t) => t.replace(/--[^\n]*/g, '');

// ── Esquema ─────────────────────────────────────────────────────────────────────────────────────
const TIPOS = 'SERIAL|BIGSERIAL|INTEGER|SMALLINT|BIGINT|VARCHAR|CHAR|TEXT|DATE|TIMESTAMPTZ|NUMERIC|BOOLEAN';
const tablas = {};
const unicos = {}; // tabla → Set de 'col1,col2'
for (const m of sqlTodo.matchAll(/CREATE TABLE IF NOT EXISTS (\w+)\s*\(([\s\S]*?)\n\);/g)) {
  const cols = new Set();
  const uq = new Set();
  for (const linea of m[2].split('\n')) {
    const c = new RegExp(`^\\s{2}([a-z_0-9]+)\\s+(?:${TIPOS})\\b`, 'i').exec(sinComentariosSql(linea));
    if (c) {
      cols.add(c[1]);
      if (/\b(PRIMARY KEY|UNIQUE)\b/i.test(linea)) uq.add(c[1]);
    }
    const t = /CONSTRAINT\s+\w+\s+(?:UNIQUE|PRIMARY KEY)\s*\(([^)]*)\)/i.exec(linea);
    if (t) uq.add(t[1].split(',').map((x) => x.trim()).join(','));
  }
  tablas[m[1]] = cols;
  unicos[m[1]] = uq;
}
for (const m of sqlTodo.matchAll(/CREATE UNIQUE INDEX IF NOT EXISTS \w+ ON (\w+)\s*\(([^)]*)\)/g)) {
  unicos[m[1]].add(m[2].split(',').map((x) => x.trim()).join(','));
}
const vistaTexto = /CREATE OR REPLACE VIEW (\w+)[\s\S]*?\bAS\s+SELECT([\s\S]*?);\s*$/m.exec(sqlTodo);
const vista = { nombre: vistaTexto[1], cols: new Set([...vistaTexto[2].matchAll(/\bAS\s+(\w+)\s*[,\n]/g)].map((m) => m[1])) };
for (const m of vistaTexto[2].matchAll(/\be\.(\w+)\s*,/g)) vista.cols.add(m[1]);
vista.cols.add('proximo_vencimiento');
const objetos = new Set([...Object.keys(tablas), vista.nombre]);
// Nombres de CTE (WITH x AS (...), y AS (...)) que el código define y consulta.
for (const [, t] of codigo) for (const m of t.matchAll(/(?:\bWITH|,)\s+(\w+)\s+AS\s*\(\s*SELECT/g)) objetos.add(m[1]);

test('el esquema define las tablas del Core Base', () => {
  for (const t of ['usuarios_admin', 'representantes', 'estudiantes', 'documentos_estudiante', 'cuotas', 'pagos_referencias', 'tasas_bcv', 'cuentas_pago',
    'personal', 'horas_clase', 'nomina_pagos', 'egresos', 'notificaciones_whatsapp', 'portal_tokens', 'modulos_premium', 'parametros', 'schema_migrations']) {
    assert.ok(tablas[t] && tablas[t].size >= 2, `falta la tabla ${t} (o no se pudo leer)`);
  }
  assert.ok(vista.cols.has('estado_dinamico') && vista.cols.has('estatus_pago') && vista.cols.has('deuda_vencida_usd'));
});

test('todo objeto referenciado en FROM/JOIN/INTO/UPDATE existe en las migraciones', () => {
  const faltan = [];
  for (const [f, t] of codigo) {
    for (const m of t.matchAll(/\b(?:FROM|JOIN|INTO|UPDATE)\s+([a-z_][a-z_0-9]*)\b/g)) if (!objetos.has(m[1])) faltan.push(`${f}: ${m[1]}`);
  }
  assert.deepEqual([...new Set(faltan)], []);
});

test('INSERT INTO x (columnas…) solo usa columnas existentes', () => {
  const malas = [];
  for (const [f, t] of codigo) {
    for (const m of t.matchAll(/INSERT INTO ([a-z_]+)\s*\(([^)]*)\)/g)) {
      const cols = tablas[m[1]];
      if (!cols) continue;
      for (const c of m[2].split(',').map((x) => x.trim()).filter(Boolean)) if (!cols.has(c)) malas.push(`${f}: ${m[1]}.${c}`);
    }
  }
  assert.deepEqual(malas, []);
});

test('UPDATE x SET col = … solo usa columnas existentes', () => {
  const malas = [];
  for (const [f, t] of codigo) {
    for (const m of t.matchAll(/UPDATE ([a-z_]+)\s+SET\s+([\s\S]*?)(?=\bRETURNING\b|\bWHERE\b|`|'\s*,)/g)) {
      const cols = tablas[m[1]];
      if (!cols) continue;
      const lista = m[2].replace(/\$\{[^}]*\}/g, '').replace(/\([^)]*\)/g, '()'); // quita subconsultas/funciones
      for (const a of lista.matchAll(/(?:^|,)\s*(\w+)\s*=/g)) if (!cols.has(a[1])) malas.push(`${f}: ${m[1]}.${a[1]}`);
    }
  }
  assert.deepEqual(malas, []);
});

test('ON CONFLICT (cols) apunta a una restricción UNIQUE/PRIMARY KEY o índice único real de la tabla', () => {
  let revisados = 0;
  const malas = [];
  for (const [f, t] of codigo) {
    for (const m of t.matchAll(/INSERT INTO ([a-z_]+)[^`]*?ON CONFLICT\s*\(([^)]*)\)/g)) {
      revisados += 1;
      const objetivo = m[2].split(',').map((x) => x.trim()).join(',');
      if (!unicos[m[1]] || !unicos[m[1]].has(objetivo)) malas.push(`${f}: ${m[1]} (${objetivo})`);
    }
  }
  assert.ok(revisados >= 5, 'se esperaban al menos 5 upserts (representantes, usuarios_admin, parametros, nomina_pagos, cuotas)');
  assert.deepEqual(malas, []);
});

test('columnas con alias de la vista (v.xxx) existen en vw_estudiantes_estado', () => {
  const malas = [];
  for (const [f, t] of codigo) {
    if (!/vw_estudiantes_estado v\b/.test(t)) continue;
    for (const m of t.matchAll(/\bv\.(\w+)/g)) if (!vista.cols.has(m[1])) malas.push(`${f}: v.${m[1]}`);
  }
  assert.deepEqual(malas, []);
});

test('literales de estado/tipo/método usados en SQL coinciden con los CHECK del esquema', () => {
  const permitidos = new Set();
  for (const m of sqlTodo.matchAll(/CHECK\s*\(([^;]*?)\)(?:\s*,|\s*\n|\s*;)/g)) for (const l of m[1].matchAll(/'([^']+)'/g)) permitidos.add(l[1]);
  for (const m of sqlTodo.matchAll(/DEFAULT '([^']+)'/g)) permitidos.add(m[1]);
  assert.ok(permitidos.has('Por Validar') && permitidos.has('En Revisión') && permitidos.has('PAGO_MOVIL'));
  const desconocidos = [];
  for (const [f, t] of codigo) {
    for (const m of t.matchAll(/\b(?:estado|estatus_academico|tipo|metodo_pago|modalidad_pago|estado_dinamico)\s*(?:=|<>|IN)\s*\(?\s*((?:'[^']+'\s*,?\s*)+)/g)) {
      for (const l of m[1].matchAll(/'([^']+)'/g)) if (!permitidos.has(l[1])) desconocidos.push(`${f}: '${l[1]}'`);
    }
  }
  assert.deepEqual([...new Set(desconocidos)], []);
});

test('enums de los controladores (métodos de pago) coinciden con el esquema', () => {
  const metodosCheck = [...(/ck_pagos_metodo CHECK \(metodo_pago IN \(([^)]*)\)/.exec(sqlTodo)[1]).matchAll(/'([^']+)'/g)].map((m) => m[1]).sort();
  for (const f of ['controllers/admisiones.controller.js', 'controllers/portal.controller.js', 'controllers/configuracion.controller.js']) {
    const t = leer(f);
    const lista = /\[('ZELLE'[^\]]*)\]/.exec(t);
    assert.ok(lista, `${f} no declara los métodos de pago`);
    assert.deepEqual([...lista[1].matchAll(/'([^']+)'/g)].map((m) => m[1]).sort(), metodosCheck, f);
  }
});

test('PostgreSQL puro: ningún rastro de T-SQL en las migraciones ni en el código', () => {
  const tsql = /\b(NVARCHAR|NCHAR|DATETIME2?|IDENTITY\s*\(|GETDATE|SYSUTCDATETIME|SYSDATETIMEOFFSET|ISNULL\s*\(|OBJECT_ID|MERGE\b|CROSS APPLY|OUTER APPLY|OFFSET\s+@|FETCH NEXT|UPDLOCK|HOLDLOCK|ROWLOCK|CREATE OR ALTER)\b|\bTOP\s*\(?\s*[@\d]|\bdbo\.|\bOUTPUT\s+inserted|@\w+\s*(?:,|\)|=|\bIS\b)|^\s*GO\s*$|\bCONVERT\s*\(|\bDATEADD\s*\(/im;
  const literalUnicode = /(?<![A-Za-z0-9_])N'/; // literales N'…' de T-SQL (sensible a mayúsculas: no confundir con "…n'")
  for (const [f, t] of migraciones) assert.ok(!tsql.test(sinComentariosSql(t)) && !literalUnicode.test(sinComentariosSql(t)), `${f}: sintaxis T-SQL`);
  for (const [f, t] of codigo) {
    const limpio = t;
    assert.ok(!tsql.test(limpio) && !literalUnicode.test(limpio), `${f}: sintaxis T-SQL ${tsql.exec(limpio)?.[0]}`);
    assert.ok(!/recordset|rowsAffected|require\('mssql'\)/.test(limpio), `${f}: API de mssql`);
  }
});

test('PostgreSQL: DDL idempotente, paréntesis balanceados y nombres de índice/constraint únicos', () => {
  for (const [f, t] of migraciones) {
    const limpio = sinComentariosSql(t);
    const parens = [...limpio].reduce((n, c) => n + (c === '(' ? 1 : c === ')' ? -1 : 0), 0);
    assert.equal(parens, 0, `${f}: paréntesis desbalanceados`);
    for (const m of limpio.matchAll(/CREATE (?:UNIQUE )?INDEX (?!IF NOT EXISTS)\w+/g)) assert.fail(`${f}: ${m[0]} sin IF NOT EXISTS`);
    for (const m of limpio.matchAll(/CREATE TABLE (?!IF NOT EXISTS)\w+/g)) assert.fail(`${f}: ${m[0]} sin IF NOT EXISTS`);
  }
  const nombres = [...sqlTodo.matchAll(/CONSTRAINT\s+(\w+)/g)].map((m) => m[1]);
  assert.equal(nombres.length, new Set(nombres).size, 'nombres de CONSTRAINT repetidos');
  const idx = [...sqlTodo.matchAll(/CREATE (?:UNIQUE )?INDEX IF NOT EXISTS (\w+)/g)].map((m) => m[1]);
  assert.equal(idx.length, new Set(idx).size, 'índices repetidos');
  assert.ok(idx.includes('ux_pagos_referencia_activa') && idx.includes('ux_estudiantes_identidad') && idx.includes('ux_egresos_nomina'));
});

test('Supabase: RLS activado en las 17 tablas del Core Base, vista con security_invoker y sin tipos de dinero flotantes', () => {
  const seg = migraciones.find(([f]) => f.startsWith('004'))[1];
  for (const t of Object.keys(tablas)) assert.ok(new RegExp(`'${t}'`).test(seg), `004 no activa RLS en ${t}`);
  assert.match(sqlTodo, /VIEW vw_estudiantes_estado WITH \(security_invoker = true\)/);
  assert.ok(!/\b(FLOAT|REAL|DOUBLE PRECISION|MONEY)\b/i.test(sinComentariosSql(sqlTodo)), 'dinero/tasas deben ser NUMERIC');
  assert.ok(/AT TIME ZONE 'America\/Caracas'/.test(sqlTodo), 'la vista debe calcular "hoy" en hora de Caracas');
});

test('toda consulta usa parámetros posicionales: ningún SQL se arma con ${…} de datos de usuario', () => {
  const peligro = [];
  for (const [f, t] of codigo) {
    for (const m of t.matchAll(/`([^`]*\$\{[^}]+\}[^`]*)`/g)) {
      if (!/\b(SELECT|INSERT|UPDATE|DELETE)\b/.test(m[1])) continue;
      for (const interp of m[1].matchAll(/\$\{([^}]+)\}/g)) {
        // permitidas: fragmentos constantes definidos en el propio módulo (filtro, COLS_PERSONAL)
        if (!/^(filtro|COLS_PERSONAL)$/.test(interp[1].trim())) peligro.push(`${f}: \${${interp[1]}}`);
      }
    }
  }
  assert.deepEqual(peligro, []);
});

test('el código usa el contrato { rows, rowCount } y params como arreglo (nada de objetos { nombre: [tipo, valor] })', () => {
  const malos = [];
  for (const [f, t] of codigo) {
    if (f === path.join('config', 'db.js')) continue;
    if (/\bsql\.(Int|NVarChar|Decimal|Date|Bit|DateTime2|Char)\b/.test(t)) malos.push(`${f}: tipos de mssql`);
    if (/ejecutar\([^)]*,\s*\{[^}]*\[\s*sql\./.test(t)) malos.push(`${f}: params como objeto`);
  }
  assert.deepEqual(malos, []);
});
