'use strict';
/**
 * Capa de datos: PostgreSQL (Supabase) con el paquete nativo `pg`.
 *
 * - Pool único, perezoso y compartido. La primera consulta lo crea y verifica con `SELECT 1`; si esa conexión inicial
 *   falla, la promesa se descarta para que el siguiente intento reconecte (el pool no queda "envenenado").
 * - Variables del .env: DB_SERVER → host, DB_PORT, DB_NAME → database, DB_USER, DB_PASSWORD (ver config/env.js).
 * - Supabase exige TLS: DB_SSL=true (por defecto). Para verificar el certificado de Supabase, descarga su CA desde
 *   Dashboard → Project Settings → Database → SSL Configuration y apunta DB_SSL_CA_PATH a ese archivo.
 * - Pooler: usa el "Session pooler" (puerto 5432) o la conexión directa. El "Transaction pooler" (6543) también sirve
 *   porque aquí no se usan sentencias preparadas con nombre ni locks de sesión; toda transacción se ejecuta sobre UN solo
 *   cliente (BEGIN … COMMIT) y el cliente se devuelve al pool siempre.
 *
 * Contrato de consulta: `ejecutar(texto, params[], ejecutor?)` → `{ rows, rowCount }`, con marcadores POSICIONALES
 * ($1, $2, …) y `params` como ARREGLO en ese mismo orden. Nunca concatenar datos en el SQL.
 */
const fs = require('node:fs');
const { Pool, types } = require('pg');
const cfg = require('./env');

// ── Conversión de tipos (se registra una sola vez, al cargar el módulo) ──────────────────────────
// DATE → 'YYYY-MM-DD' tal cual. Por defecto pg lo convierte a medianoche en la zona del proceso y corre el día.
types.setTypeParser(1082, (v) => v);
// INT8 (COUNT(*), SUM de enteros, BIGSERIAL) → number. Por defecto pg lo devuelve como string.
types.setTypeParser(20, (v) => Number(v));
// NUMERIC (dinero, tasas, horas) → number, como entregaba el esquema anterior. Los importes se calculan en centavos
// enteros (utils/dinero.js) y las columnas son NUMERIC(<=18,4): caben holgadamente en un double.
types.setTypeParser(1700, (v) => Number(v));
// TIMESTAMPTZ llega como Date (instante UTC real): no requiere parser.

let poolPromise = null;

function opcionesSsl(d) {
  if (!d.ssl) return false;
  const ssl = { rejectUnauthorized: d.sslRejectUnauthorized };
  if (d.sslCaPath) ssl.ca = fs.readFileSync(d.sslCaPath, 'utf8');
  return ssl;
}

function crearConfig() {
  const d = cfg.db;
  if (!d.server || !d.database || !d.user || !d.password) {
    throw new Error('[db] Faltan DB_SERVER, DB_NAME, DB_USER o DB_PASSWORD en el entorno.');
  }
  return {
    host: d.server,
    port: d.port,
    database: d.database,
    user: d.user,
    password: d.password,
    ssl: opcionesSsl(d),
    max: d.poolMax,
    min: d.poolMin,
    idleTimeoutMillis: d.idleMs,
    connectionTimeoutMillis: d.connectTimeoutMs,
    statement_timeout: d.requestTimeoutMs, // el servidor aborta consultas lentas (SQLSTATE 57014)
    application_name: 'bma-core',
  };
}

/** Pista legible para los fallos de conexión más frecuentes con Supabase (nunca incluye credenciales). */
function pistaConexion(err) {
  const msg = String(err && err.message);
  if (err && err.code === 'ENOTFOUND') return 'DB_SERVER no resuelve: copia el host exacto del panel de Supabase (Connect).';
  if (err && err.code === '28P01') return 'Usuario o contraseña rechazados. En el pooler el usuario es "postgres.<ref-del-proyecto>".';
  if (/self.signed|unable to verify|certificate/i.test(msg)) return 'Certificado TLS no verificable: define DB_SSL_CA_PATH con la CA de Supabase.';
  if (/does not support SSL|SSL/i.test(msg)) return 'Revisa DB_SSL (Supabase requiere TLS).';
  if (/Tenant or user not found/i.test(msg)) return 'El pooler no reconoce el usuario/proyecto: revisa DB_USER (postgres.<ref>) y la región del host.';
  return null;
}

function getPool() {
  if (!poolPromise) {
    let pool;
    try {
      pool = new Pool(crearConfig());
    } catch (err) {
      return Promise.reject(err);
    }
    // Sin este listener, un cliente inactivo cuya conexión se cae emite 'error' y tumba el proceso.
    pool.on('error', (err) => console.error('[db] Error en un cliente inactivo del pool:', err.message));
    poolPromise = pool.query('SELECT 1 AS ok').then(() => pool).catch(async (err) => {
      poolPromise = null;
      await pool.end().catch(() => undefined);
      const pista = pistaConexion(err);
      console.error('[db] Falló la conexión inicial:', err.message, pista ? `· ${pista}` : '');
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
  if (pool) await pool.end();
}

const NIVELES = new Set(['READ COMMITTED', 'REPEATABLE READ', 'SERIALIZABLE']);

/**
 * Ejecuta `fn(cliente)` dentro de una transacción: BEGIN → COMMIT si resuelve, ROLLBACK si lanza (el error original se
 * relanza). El cliente se devuelve al pool SIEMPRE (finally); si el ROLLBACK mismo falla, la conexión se destruye
 * (`release(true)`) para no reutilizar una sesión en estado incierto.
 * Pásale `cliente` a `ejecutar(..., cliente)` para que las consultas viajen dentro de la transacción.
 */
async function conTransaccion(fn, nivel = 'READ COMMITTED') {
  if (!NIVELES.has(nivel)) throw new Error(`[db] Nivel de aislamiento no soportado: ${nivel}`);
  const pool = await getPool();
  const cliente = await pool.connect();
  let descartar = false; // true → la sesión puede quedar en estado incierto: se destruye en vez de reutilizarse
  try {
    try {
      await cliente.query(`BEGIN ISOLATION LEVEL ${nivel}`);
    } catch (err) {
      descartar = true;
      throw err;
    }
    let resultado;
    try {
      resultado = await fn(cliente);
    } catch (err) {
      try {
        await cliente.query('ROLLBACK');
      } catch (rollbackErr) {
        descartar = true;
        console.error('[db] Rollback falló (se descarta la conexión):', rollbackErr.message);
      }
      throw err; // el error original (con su SQLSTATE) llega intacto al errorHandler
    }
    try {
      await cliente.query('COMMIT');
    } catch (err) {
      descartar = true;
      throw err;
    }
    return resultado;
  } finally {
    cliente.release(descartar);
  }
}

/**
 * Consulta parametrizada con marcadores $1, $2, … `params` es un ARREGLO (undefined se envía como NULL).
 * `ejecutor` = cliente de `conTransaccion` o undefined (usa el pool). Devuelve `{ rows, rowCount }`.
 */
async function ejecutar(textoSql, params = [], ejecutor) {
  if (!Array.isArray(params)) {
    throw new TypeError('[db] `params` debe ser un arreglo ordenado ($1, $2, …), no un objeto.');
  }
  const valores = params.map((v) => (v === undefined ? null : v));
  const destino = ejecutor || (await getPool());
  const r = await destino.query(textoSql, valores);
  return { rows: r.rows, rowCount: r.rowCount };
}

/** Sentencias sin parámetros que pueden traer varias instrucciones (DDL de migraciones). Usa un cliente dedicado. */
async function ejecutarScript(textoSql, ejecutor) {
  const destino = ejecutor || (await getPool());
  await destino.query(textoSql);
}

module.exports = { getPool, closePool, conTransaccion, ejecutar, ejecutarScript };
