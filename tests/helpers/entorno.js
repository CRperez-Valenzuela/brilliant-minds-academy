'use strict';
/**
 * Entorno de pruebas SIN dependencias de red ni base de datos real.
 *  - Sustituye los paquetes externos pesados (pg, dotenv, axios, googleapis) por stubs inertes.
 *  - Sustituye config/db por una base de datos falsa programable (`db.handler`) que registra cada consulta.
 * Las pruebas verifican la lógica de negocio y la orquestación; el SQL real se valida en tests/schema-consistencia.test.js (estático)
 * y contra un PostgreSQL real en tests/integracion.pg.test.js (`npm run test:integracion`, ver CAMBIOS_BMA_CORE.md).
 */
const Module = require('node:module');

class PoolStub { on() { return this; } async query() { return { rows: [], rowCount: 0 }; } async connect() { return { query: async () => ({ rows: [], rowCount: 0 }), release() {} }; } async end() {} }
const pgStub = { Pool: PoolStub, types: { setTypeParser() {} } };

const externos = {
  pg: pgStub,
  dotenv: { config: () => ({}) },
  axios: { get: async () => { throw new Error('axios real no disponible en pruebas'); }, post: async () => { throw new Error('axios real no disponible en pruebas'); } },
  googleapis: { google: { auth: { GoogleAuth: class {} }, drive: () => ({}) } },
  multer: Object.assign(() => ({ fields: () => () => {} }), { memoryStorage: () => ({}) }),
};

const db = {
  llamadas: [],
  rollbacks: 0,
  commits: 0,
  handler: async () => ({ rows: [], rowCount: 0 }),
  async ejecutar(texto, params = []) {
    // Mismo contrato que config/db.js: los parámetros son un ARREGLO posicional ($1, $2, …).
    if (!Array.isArray(params)) throw new TypeError('params debe ser un arreglo ordenado');
    const esperados = new Set([...texto.matchAll(/\$(\d+)/g)].map((m) => Number(m[1])));
    const maximo = esperados.size ? Math.max(...esperados) : 0;
    if (maximo !== params.length) throw new Error(`La consulta usa $1..$${maximo} pero recibió ${params.length} parámetro(s): ${texto.slice(0, 80)}`);
    db.llamadas.push({ texto, params });
    const r = await db.handler(texto, params);
    return r || { rows: [], rowCount: 0 };
  },
  async ejecutarScript() {},
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
  reiniciar() { db.llamadas.length = 0; db.rollbacks = 0; db.commits = 0; db.handler = async () => ({ rows: [], rowCount: 0 }); },
};

const cargaOriginal = Module._load;
Module._load = function cargar(request, ...resto) {
  if (Object.prototype.hasOwnProperty.call(externos, request)) return externos[request];
  if (/(^|[\\/])config[\\/]db$/.test(request)) return db;
  return cargaOriginal.call(this, request, ...resto);
};

module.exports = { db };
