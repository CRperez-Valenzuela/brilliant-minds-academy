'use strict';

/** Detecta el tipo real por "magic bytes": el mimetype que declara el navegador es manipulable. */
function detectarTipo(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 4) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: 'image/jpeg', ext: 'jpg' };
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return { mime: 'image/png', ext: 'png' };
  if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) return { mime: 'application/pdf', ext: 'pdf' };
  return null;
}

/** 'María José' → 'María_José'; elimina todo lo que no sea letra, dígito, guion o guion bajo (anti path-traversal en nombres de Drive). */
function segmentoSeguro(texto) {
  return String(texto).trim().replace(/\s+/g, '_').replace(/[^\p{L}\p{N}_-]/gu, '').slice(0, 40);
}

/** Nombre de carpeta en Drive: 'Nombre_Apellido_ID' (primer nombre + primer apellido + id del estudiante). */
function nombreCarpeta(nombres, apellidos, id) {
  const primero = (s) => segmentoSeguro(String(s).trim().split(/\s+/)[0] || 'X');
  return `${primero(nombres)}_${primero(apellidos)}_${id}`;
}

module.exports = { detectarTipo, segmentoSeguro, nombreCarpeta };
