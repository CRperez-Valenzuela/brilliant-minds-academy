'use strict';
// Carga y valida variables de entorno UNA vez. Falla al arrancar con un mensaje claro (no en la primera petición).
const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const ES_PRODUCCION = process.env.NODE_ENV === 'production';

function entero(nombre, defecto) {
  const v = process.env[nombre];
  if (v === undefined || v === '') return defecto;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0) throw new Error(`[env] ${nombre} debe ser un entero >= 0 (recibido: ${v})`);
  return n;
}

function validarProduccion(cfg) {
  const faltan = [];
  if (!cfg.jwt.secret || cfg.jwt.secret.length < 32) faltan.push('JWT_SECRET (>= 32 caracteres)');
  if (!cfg.db.server) faltan.push('DB_SERVER');
  if (!cfg.db.database) faltan.push('DB_NAME');
  if (!cfg.db.user) faltan.push('DB_USER');
  if (!cfg.db.password) faltan.push('DB_PASSWORD');
  if (faltan.length) throw new Error(`[env] Variables requeridas ausentes en producción: ${faltan.join(', ')}`);
}

const config = Object.freeze({
  esProduccion: ES_PRODUCCION,
  puerto: entero('PORT', 3000),
  db: Object.freeze({
    server: process.env.DB_SERVER,
    port: entero('DB_PORT', 1433),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    encrypt: process.env.DB_ENCRYPT !== 'false',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERT === 'true',
    poolMax: entero('DB_POOL_MAX', 10),
    poolMin: entero('DB_POOL_MIN', 0),
    idleMs: entero('DB_POOL_IDLE_MS', 30000),
    requestTimeoutMs: entero('DB_REQUEST_TIMEOUT_MS', 30000),
    connectTimeoutMs: entero('DB_CONNECT_TIMEOUT_MS', 15000),
  }),
  jwt: Object.freeze({
    secret: process.env.JWT_SECRET || (ES_PRODUCCION ? '' : 'solo-desarrollo-local-no-usar-en-produccion-0123456789'),
    expiraEn: process.env.JWT_EXPIRES_IN || '8h',
  }),
  drive: Object.freeze({
    carpetaPadreId: process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID || '',
    // JSON de la cuenta de servicio en línea o ruta a un archivo (nunca se versiona).
    credenciales: process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '',
  }),
  bcv: Object.freeze({
    url: process.env.BCV_API_URL || 'https://ve.dolarapi.com/v1/dolares/oficial',
    timeoutMs: entero('BCV_TIMEOUT_MS', 6000),
    maxAntiguedadHoras: entero('BCV_MAX_ANTIGUEDAD_HORAS', 24),
  }),
  whatsapp: Object.freeze({
    token: process.env.WHATSAPP_TOKEN || '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    graphVersion: process.env.GRAPH_API_VERSION || 'v20.0',
  }),
  portalBaseUrl: (process.env.PORTAL_BASE_URL || 'http://localhost:3000').replace(/\/+$/, ''),
  admisiones: Object.freeze({
    maxArchivoMb: entero('ADMISIONES_MAX_ARCHIVO_MB', 5),
    concurrenciaMax: entero('ADMISIONES_CONCURRENCIA_MAX', 4),
  }),
  corsOrigen: process.env.CORS_ORIGIN || '',
});

if (ES_PRODUCCION) validarProduccion(config);

module.exports = config;
