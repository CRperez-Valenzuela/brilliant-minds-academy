'use strict';
const fs = require('node:fs');
const { Readable } = require('node:stream');
const { google } = require('googleapis');
const cfg = require('../config/env');
const { e } = require('../errors/AppError');
const { nombreCarpeta } = require('../utils/archivos');

const MIME_CARPETA = 'application/vnd.google-apps.folder';

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

/**
 * Google Drive: crea la carpeta 'Nombre_Apellido_ID' y sube los documentos DIRECTAMENTE desde memoria
 * (Readable.from(buffer)), sin escribir nada en disco. Si algo falla, la carpeta parcial se envía a la papelera.
 * IMPORTANTE: una cuenta de servicio no tiene cuota de almacenamiento propia; la carpeta padre debe estar en una
 * Unidad Compartida (Shared Drive) o los archivos fallarán con "storageQuotaExceeded".
 */
function crearDriveService({ drive, carpetaPadreId = cfg.drive.carpetaPadreId } = {}) {
  let cliente = drive || null;
  const d = () => (cliente ||= clienteDriveReal());

  async function enviarAPapelera(fileId) {
    try {
      await d().files.update({ fileId, requestBody: { trashed: true }, supportsAllDrives: true });
    } catch (err) {
      console.error(`[drive] No se pudo limpiar la carpeta ${fileId}:`, err.message);
    }
  }

  /** archivos: [{ tipo:'FOTO_CARNET', buffer, mime, ext }] → { carpetaId, carpetaUrl, documentos:[{tipo, fileId, url, nombre}] } */
  async function subirExpediente({ estudianteId, nombres, apellidos, archivos }) {
    let carpetaId = null;
    try {
      const carpeta = await d().files.create({
        requestBody: { name: nombreCarpeta(nombres, apellidos, estudianteId), mimeType: MIME_CARPETA, parents: [carpetaPadreId] },
        fields: 'id, webViewLink',
        supportsAllDrives: true,
      });
      carpetaId = carpeta.data.id;

      const documentos = await Promise.all(archivos.map(async (a) => {
        const nombre = `${a.tipo.toLowerCase()}.${a.ext}`;
        const r = await d().files.create({
          requestBody: { name: nombre, parents: [carpetaId] },
          media: { mimeType: a.mime, body: Readable.from([a.buffer]) },
          fields: 'id, webViewLink',
          supportsAllDrives: true,
        });
        return { tipo: a.tipo, fileId: r.data.id, url: r.data.webViewLink || null, nombre, mime: a.mime, bytes: a.buffer.length };
      }));

      return { carpetaId, carpetaUrl: carpeta.data.webViewLink || null, documentos };
    } catch (err) {
      console.error('[drive] Falló la subida del expediente:', err.message);
      if (carpetaId) await enviarAPapelera(carpetaId);
      if (err && err.name === 'AppError') throw err;
      throw e.externo('DRIVE_ERROR', 'No se pudo guardar la documentación en Google Drive. No se registró la inscripción; intenta de nuevo.');
    }
  }

  return { subirExpediente, eliminarCarpeta: enviarAPapelera };
}

module.exports = { crearDriveService, drive: crearDriveService() };
