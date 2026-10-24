'use strict';
const fs = require('node:fs');
const { Readable } = require('node:stream');
const { google } = require('googleapis');
const cfg = require('../config/env');
const { AppError, e } = require('../errors/AppError');
const { nombreCarpeta, segmentoSeguro } = require('../utils/archivos');

const MIME_CARPETA = 'application/vnd.google-apps.folder';

const pausa = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Código HTTP de un error de googleapis/gaxios (en algunas versiones llega en `code` como texto). undefined = fallo de red. */
function estadoHttp(err) {
  const n = Number(err && (err.status ?? (err.response && err.response.status) ?? err.code));
  return Number.isInteger(n) && n >= 100 && n < 600 ? n : undefined;
}

/** Solo vale la pena reintentar la limpieza si el fallo es transitorio: sin respuesta (red), 408, 429 o 5xx. */
function esTransitorio(err) {
  const s = estadoHttp(err);
  return s === undefined || s === 408 || s === 429 || s >= 500;
}

function clienteDriveReal() {
  const raw = cfg.drive.credenciales;
  if (!raw || !cfg.drive.carpetaPadreId) {
    throw e.noDisponible('DRIVE_NO_CONFIGURADO', 'La integración con Google Drive no está configurada (GOOGLE_SERVICE_ACCOUNT_JSON / GOOGLE_DRIVE_PARENT_FOLDER_ID).');
  }
  let credenciales;
  try {
    credenciales = JSON.parse(raw.trim().startsWith('{') ? raw : fs.readFileSync(raw, 'utf8'));
  } catch {
    throw e.noDisponible('DRIVE_CREDENCIALES_INVALIDAS', 'Las credenciales de Google Drive no se pudieron leer.');
  }
  const auth = new google.auth.GoogleAuth({ credentials: credenciales, scopes: ['https://www.googleapis.com/auth/drive'] });
  return google.drive({ version: 'v3', auth });
}

/** Defensa en profundidad: el servicio no confía en que el controlador ya validó lo que recibe. */
function validarEntrada({ estudianteId, archivos }) {
  if (!Number.isInteger(estudianteId) || estudianteId <= 0) throw new TypeError('[drive] estudianteId debe ser un entero positivo.');
  if (!Array.isArray(archivos) || !archivos.length) throw new TypeError('[drive] Se requiere al menos un archivo para el expediente.');
  for (const a of archivos) {
    if (!a || !Buffer.isBuffer(a.buffer) || !a.buffer.length) throw new TypeError('[drive] Cada archivo debe traer su contenido en un Buffer no vacío.');
    if (!segmentoSeguro(a.tipo) || !segmentoSeguro(a.ext) || !a.mime) throw new TypeError('[drive] Cada archivo requiere tipo, ext y mime válidos.');
  }
}

/**
 * Google Drive: crea la carpeta 'Nombre_Apellido_ID' y sube los documentos DIRECTAMENTE desde memoria
 * (Readable.from([buffer]) sobre los buffers de multer.memoryStorage()), sin escribir nada en disco.
 *
 * Atomicidad (compensación): si cualquier paso falla, la carpeta parcial se envía a la papelera ANTES de propagar el error.
 * `eliminarCarpeta` queda expuesta para que admisiones.service.js compense cuando la falla ocurre DESPUÉS (p. ej. COMMIT).
 *
 * IMPORTANTE: una cuenta de servicio no tiene cuota de almacenamiento propia; la carpeta padre debe estar en una
 * Unidad Compartida (Shared Drive), por eso TODA petición lleva `supportsAllDrives: true`.
 */
function crearDriveService({ drive, carpetaPadreId = cfg.drive.carpetaPadreId, timeoutMs = cfg.drive.timeoutMs } = {}) {
  let cliente = drive || null;
  const d = () => (cliente ||= clienteDriveReal());
  // Tope por petición: la subida ocurre mientras hay una transacción abierta; un Drive colgado no puede retener la conexión de pg.
  const opciones = { timeout: timeoutMs };

  /**
   * Envía la carpeta (y todo su contenido) a la papelera. NUNCA lanza: es código de compensación y no debe tapar el error original.
   * Reintenta con espera exponencial solo ante fallos transitorios; un 404 cuenta como éxito (ya no existe).
   * Devuelve true si la carpeta quedó fuera de Drive, false si requiere limpieza manual.
   */
  async function eliminarCarpeta(carpetaId, { reintentos = 3, esperaMs = 300 } = {}) {
    if (!carpetaId || typeof carpetaId !== 'string') return false;
    for (let intento = 1; intento <= reintentos; intento += 1) {
      try {
        await d().files.update({ fileId: carpetaId, requestBody: { trashed: true }, fields: 'id', supportsAllDrives: true }, opciones);
        return true;
      } catch (err) {
        if (estadoHttp(err) === 404) return true;
        if (!esTransitorio(err) || intento === reintentos) {
          console.error(`[drive] No se pudo enviar a la papelera la carpeta ${carpetaId} (intento ${intento}/${reintentos}):`, err.message);
          return false;
        }
        await pausa(esperaMs * 2 ** (intento - 1));
      }
    }
    return false;
  }

  async function subirDocumento(carpetaId, a) {
    const nombre = `${segmentoSeguro(a.tipo).toLowerCase()}.${segmentoSeguro(a.ext).toLowerCase()}`;
    const r = await d().files.create({
      requestBody: { name: nombre, parents: [carpetaId] },
      media: { mimeType: a.mime, body: Readable.from([a.buffer], { objectMode: false }) },
      fields: 'id, webViewLink',
      supportsAllDrives: true,
    }, opciones);
    if (!r.data || !r.data.id) throw new Error(`Drive no devolvió el id del archivo ${nombre}.`);
    return { tipo: a.tipo, fileId: r.data.id, url: r.data.webViewLink || null, nombre, mime: a.mime, bytes: a.buffer.length };
  }

  /** archivos: [{ tipo:'FOTO_CARNET', buffer, mime, ext }] → { carpetaId, carpetaUrl, documentos:[{tipo, fileId, url, nombre, mime, bytes}] } */
  async function subirExpediente({ estudianteId, nombres, apellidos, archivos }) {
    validarEntrada({ estudianteId, archivos });
    if (!carpetaPadreId) {
      throw e.noDisponible('DRIVE_NO_CONFIGURADO', 'La integración con Google Drive no está configurada (GOOGLE_DRIVE_PARENT_FOLDER_ID).');
    }

    let carpetaId = null;
    try {
      const carpeta = await d().files.create({
        requestBody: { name: nombreCarpeta(nombres, apellidos, estudianteId), mimeType: MIME_CARPETA, parents: [carpetaPadreId] },
        fields: 'id, webViewLink',
        supportsAllDrives: true,
      }, opciones);
      carpetaId = carpeta.data && carpeta.data.id;
      if (!carpetaId) throw new Error('Drive no devolvió el id de la carpeta.');

      // allSettled (no all): si un documento falla, esperamos a que los demás terminen antes de limpiar, para no dejar
      // subidas "en vuelo" escribiendo dentro de una carpeta que ya enviamos a la papelera.
      const resultados = await Promise.allSettled(archivos.map((a) => subirDocumento(carpetaId, a)));
      const fallo = resultados.find((r) => r.status === 'rejected');
      if (fallo) throw fallo.reason;

      return { carpetaId, carpetaUrl: carpeta.data.webViewLink || null, documentos: resultados.map((r) => r.value) };
    } catch (err) {
      console.error('[drive] Falló la subida del expediente:', err.message);
      if (carpetaId) await eliminarCarpeta(carpetaId);
      if (err instanceof AppError) throw err;
      throw e.externo('DRIVE_ERROR', 'No se pudo guardar la documentación en Google Drive. No se registró la inscripción; intenta de nuevo.');
    }
  }

  return { subirExpediente, eliminarCarpeta };
}

module.exports = { crearDriveService, drive: crearDriveService() };
