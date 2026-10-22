'use strict';
// Aplica database/migrations/*.sql en orden, una sola vez cada una, separando lotes por líneas "GO".
// Uso: npm run migrate
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const fs = require('node:fs');
const path = require('node:path');
const { getPool, closePool, sql } = require('../config/db');

const DIR = path.resolve(__dirname, '..', 'database', 'migrations');

function lotes(texto) {
  return texto
    .split(/^\s*GO\s*$/gim)
    .map((l) => l.trim())
    .filter(Boolean);
}

async function main() {
  const pool = await getPool();
  // La tabla de control se crea con el primer lote de 001; si no existe aún, se asume vacía.
  const existeControl = (await pool.request().query(
    "SELECT OBJECT_ID(N'dbo.schema_migrations', N'U') AS id")).recordset[0].id;
  const aplicadas = new Set(
    existeControl ? (await pool.request().query('SELECT nombre FROM dbo.schema_migrations')).recordset.map((r) => r.nombre) : [],
  );

  const archivos = fs.readdirSync(DIR).filter((f) => f.endsWith('.sql')).sort();
  for (const archivo of archivos) {
    if (aplicadas.has(archivo)) {
      console.log(`= ${archivo} (ya aplicada)`);
      continue;
    }
    console.log(`> Aplicando ${archivo}`);
    for (const lote of lotes(fs.readFileSync(path.join(DIR, archivo), 'utf8'))) {
      await pool.request().batch(lote);
    }
    await pool.request().input('n', sql.NVarChar(150), archivo)
      .query('INSERT INTO dbo.schema_migrations (nombre) VALUES (@n)');
  }
  console.log('Migraciones al día.');
}

main()
  .catch((err) => { console.error('Migración fallida:', err.message); process.exitCode = 1; })
  .finally(() => closePool());
