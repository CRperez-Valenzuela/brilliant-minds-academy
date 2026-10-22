'use strict';
/**
 * Entorno de las pruebas de INTEGRACIÓN: usa el config/db REAL contra un PostgreSQL real (variable PG_TEST_PORT).
 * Solo se sustituyen los paquetes de terceros que no forman parte de la capa de datos y que quizá no estén instalados
 * (dotenv, axios, googleapis, multer, bcryptjs, exceljs); `pg` es el real si está instalado y, si no, el cliente mínimo
 * de tests/helpers/pg-minimo.js (mismo protocolo, mismas reglas de inferencia de $n).
 * También sirve como precarga de procesos hijos:  node -r ./tests/helpers/entorno-integracion.js scripts/migrate.js
 */
const Module = require('node:module');
const path = require('node:path');

let pg;
let origenPg = 'pg';
try {
  // eslint-disable-next-line global-require
  pg = require('pg');
} catch {
  // eslint-disable-next-line global-require
  pg = require('./pg-minimo');
  origenPg = 'pg-minimo';
}

/** Hash "falso" determinista SOLO para pruebas (bcryptjs real no es necesario para validar el SQL). */
const bcryptStub = {
  hash: async (txt) => `$2a$12$prueba.${Buffer.from(String(txt)).toString('base64').slice(0, 30)}`,
  hashSync: (txt) => `$2a$12$prueba.${Buffer.from(String(txt)).toString('base64').slice(0, 30)}`,
  compare: async (txt, h) => h === bcryptStub.hashSync(txt),
};

/** Libro de Excel falso: acumula las filas escritas por exportarLibro (streaming) para poder contarlas. */
const libros = [];
class WorkbookWriterFalso {
  constructor() { this.hojas = []; libros.push(this); }
  addWorksheet(nombre) {
    const hoja = { nombre, filas: [], columns: null, views: null, getRow: () => ({ font: null, commit() {} }), addRow(f) { hoja.filas.push(f); return { commit() {} }; }, commit() {} };
    this.hojas.push(hoja);
    return hoja;
  }
  async commit() {}
}

const externos = {
  pg,
  dotenv: { config: () => ({}) },
  axios: { get: async () => { throw new Error('axios real no disponible en pruebas'); }, post: async () => { throw new Error('axios real no disponible en pruebas'); } },
  googleapis: { google: { auth: { GoogleAuth: class {} }, drive: () => ({}) } },
  multer: Object.assign(() => ({ fields: () => () => {} }), { memoryStorage: () => ({}) }),
  bcryptjs: bcryptStub,
  exceljs: { stream: { xlsx: { WorkbookWriter: WorkbookWriterFalso } } },
};

const cargaOriginal = Module._load;
Module._load = function cargar(request, ...resto) {
  if (Object.prototype.hasOwnProperty.call(externos, request)) {
    // `pg`/`dotenv`... reales si existen en node_modules; aquí solo se intercepta lo declarado arriba.
    if (request === 'pg' && origenPg === 'pg') return cargaOriginal.call(this, request, ...resto);
    if (['dotenv', 'axios', 'googleapis', 'multer', 'bcryptjs'].includes(request)) {
      try { return cargaOriginal.call(this, request, ...resto); } catch { return externos[request]; }
    }
    return externos[request];
  }
  return cargaOriginal.call(this, request, ...resto);
};

module.exports = { origenPg, libros, RAIZ: path.resolve(__dirname, '..', '..') };
