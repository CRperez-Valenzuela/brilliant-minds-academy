'use strict';
// Pool único de MSSQL (node-mssql / tedious). Perezoso y compartido: la primera consulta crea y verifica el pool;
// si la conexión inicial falla se descarta la promesa para que el siguiente intento reconecte (no queda "envenenado").
const sql = require('mssql');
const cfg = require('./env');

let poolPromise = null;

function crearConfig() {
  const d = cfg.db;
  if (!d.server || !d.database || !d.user || !d.password) {
    throw new Error('[db] Faltan DB_SERVER, DB_NAME, DB_USER o DB_PASSWORD en el entorno.');
  }
  return {
    server: d.server,
    port: d.port,
    database: d.database,
    user: d.user,
    password: d.password,
    connectionTimeout: d.connectTimeoutMs,
    requestTimeout: d.requestTimeoutMs,
    options: { encrypt: d.encrypt, trustServerCertificate: d.trustServerCertificate, enableArithAbort: true },
    pool: { max: d.poolMax, min: d.poolMin, idleTimeoutMillis: d.idleMs },
  };
}

function getPool() {
  if (!poolPromise) {
    let pool;
    try {
      pool = new sql.ConnectionPool(crearConfig());
    } catch (err) {
      return Promise.reject(err);
    }
    // Sin este listener, una conexión inactiva que se cae tumba el proceso.
    pool.on('error', (err) => console.error('[db] Error en el pool:', err.message));
    poolPromise = pool.connect().catch((err) => {
      poolPromise = null;
      console.error('[db] Falló la conexión inicial:', err.message);
      throw err;
    });
  }
  return poolPromise;
}

async function closePool() {
  if (!poolPromise) return;
  const pendiente = poolPromise;
  poolPromise = null;
  const pool = await pendiente.catch(() => null);
  if (pool) await pool.close();
}

/**
 * Ejecuta `fn(tx)` dentro de una transacción. COMMIT si resuelve, ROLLBACK si lanza (el error original se relanza).
 * Una transacción por petición: el cliente se devuelve al pool siempre (sin fugas de conexiones).
 */
async function conTransaccion(fn, nivel = sql.ISOLATION_LEVEL.READ_COMMITTED) {
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  await tx.begin(nivel);
  try {
    const resultado = await fn(tx);
    await tx.commit();
    return resultado;
  } catch (err) {
    try {
      await tx.rollback();
    } catch (rollbackErr) {
      console.error('[db] Rollback falló:', rollbackErr.message);
    }
    throw err;
  }
}

/** Atajo para consultas parametrizadas. `params` = { nombre: [tipo, valor] }. Nunca concatenar SQL. */
async function ejecutar(textoSql, params = {}, ejecutor) {
  const request = (ejecutor ? new sql.Request(ejecutor) : (await getPool()).request());
  for (const [nombre, [tipo, valor]] of Object.entries(params)) request.input(nombre, tipo, valor);
  return request.query(textoSql);
}

module.exports = { sql, getPool, closePool, conTransaccion, ejecutar };
