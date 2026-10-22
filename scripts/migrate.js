'use strict';
// Aplica database/migrations/*.sql en orden, una sola vez cada una. Cada archivo corre dentro de UNA transacción
// (PostgreSQL admite DDL transaccional): o se aplica completo junto con su registro en schema_migrations, o no se aplica nada.
// Uso: npm run migrate
const fs = require('node:fs');
const path = require('node:path');
const { conTransaccion, ejecutar, ejecutarScript, closePool } = require('../config/db');

const DIR = path.resolve(__dirname, '..', 'database', 'migrations');
// Clave del candado de asesoría que serializa a dos migradores simultáneos (p. ej. dos despliegues a la vez).
const CLAVE_CANDADO = 726_150_001;

async function yaAplicada(cliente, archivo) {
  const t = await ejecutar("SELECT to_regclass('public.schema_migrations') AS tabla", [], cliente);
  if (!t.rows[0].tabla) return false; // primera migración: la tabla de control aún no existe
  const r = await ejecutar('SELECT 1 FROM schema_migrations WHERE nombre = $1', [archivo], cliente);
  return r.rowCount > 0;
}

async function main() {
  const archivos = fs.readdirSync(DIR).filter((f) => f.endsWith('.sql')).sort();
  for (const archivo of archivos) {
    const texto = fs.readFileSync(path.join(DIR, archivo), 'utf8');
    const aplicada = await conTransaccion(async (cliente) => {
      // pg_advisory_xact_lock se libera solo al terminar la transacción: seguro incluso detrás de un pooler en modo transacción.
      await ejecutar('SELECT pg_advisory_xact_lock($1)', [CLAVE_CANDADO], cliente);
      if (await yaAplicada(cliente, archivo)) return false;
      await ejecutarScript(texto, cliente);
      await ejecutar('INSERT INTO schema_migrations (nombre) VALUES ($1) ON CONFLICT (nombre) DO NOTHING', [archivo], cliente);
      return true;
    });
    console.log(aplicada ? `> Aplicada ${archivo}` : `= ${archivo} (ya aplicada)`);
  }
  console.log('Migraciones al día.');
}

main()
  .catch((err) => { console.error('Migración fallida:', err.message); process.exitCode = 1; })
  .finally(() => closePool());
