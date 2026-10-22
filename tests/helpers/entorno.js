'use strict';
/**
 * Entorno de pruebas SIN dependencias de red ni base de datos real.
 *  - Sustituye los paquetes externos pesados (mssql, dotenv, axios, googleapis) por stubs inertes.
 *  - Sustituye config/db por una base de datos falsa programable (`db.handler`) que registra cada consulta.
 * Las pruebas verifican la lógica de negocio y la orquestación; el SQL real se valida en el test de consistencia de esquema
 * y, contra un SQL Server real, con `npm run migrate` + smoke test (ver CAMBIOS_BMA_CORE.md).
 */
const Module = require('node:module');

const sqlStub = new Proxy({}, {
  get: (_t, k) => {
    if (k === 'ISOLATION_LEVEL') return { READ_COMMITTED: 2 };
    if (k === 'MAX') return 'MAX';
    return (...a) => ({ tipo: String(k), a });
  },
});

const externos = {
  mssql: sqlStub,
  dotenv: { config: () => ({}) },
  axios: { get: async () => { throw new Error('axios real no disponible en pruebas'); }, post: async () => { throw new Error('axios real no disponible en pruebas'); } },
  googleapis: { google: { auth: { GoogleAuth: class {} }, drive: () => ({}) } },
  multer: Object.assign(() => ({ fields: () => () => {} }), { memoryStorage: () => ({}) }),
};

const db = {
  sql: sqlStub,
  llamadas: [],
  rollbacks: 0,
  commits: 0,
  handler: async () => ({ recordset: [], rowsAffected: [0] }),
  async ejecutar(texto, params = {}) {
    db.llamadas.push({ texto, params });
    const r = await db.handler(texto, params);
    return r || { recordset: [], rowsAffected: [0] };
  },
  async conTransaccion(fn) {
    try {
      const r = await fn({ tx: true });
      db.commits += 1;
      return r;
    } catch (err) {
      db.rollbacks += 1;
      throw err;
    }
  },
  async getPool() { return {}; },
  async closePool() {},
  reiniciar() { db.llamadas.length = 0; db.rollbacks = 0; db.commits = 0; db.handler = async () => ({ recordset: [], rowsAffected: [0] }); },
};

const cargaOriginal = Module._load;
Module._load = function cargar(request, ...resto) {
  if (Object.prototype.hasOwnProperty.call(externos, request)) return externos[request];
  if (/(^|[\\/])config[\\/]db$/.test(request)) return db;
  return cargaOriginal.call(this, request, ...resto);
};

module.exports = { db };
