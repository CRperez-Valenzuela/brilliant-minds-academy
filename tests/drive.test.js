'use strict';
require('./helpers/entorno');
const test = require('node:test');
const assert = require('node:assert/strict');
const { Readable } = require('node:stream');
const { crearDriveService } = require('../services/drive.service');

// El servicio loguea en console.error al compensar; se silencia solo dentro de este archivo.
const errorOriginal = console.error;
test.before(() => { console.error = () => {}; });
test.after(() => { console.error = errorOriginal; });

const FOTO = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
const PDF = Buffer.from('%PDF-1.7 contenido');
const archivos = [
  { tipo: 'FOTO_CARNET', buffer: FOTO, mime: 'image/jpeg', ext: 'jpg' },
  { tipo: 'CEDULA_IDENTIDAD', buffer: PDF, mime: 'application/pdf', ext: 'pdf' },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const errHttp = (status, msg = 'fallo') => Object.assign(new Error(msg), { status });

/** Cliente de Drive falso: consume el stream de verdad (como lo haría googleapis) y registra cada llamada. */
function clienteFalso({ falla = {}, lento = {}, updateFalla } = {}) {
  const c = { creaciones: [], updates: [], bytes: {}, enVuelo: 0, enVueloAlLimpiar: null, opciones: [] };
  let n = 0;
  c.files = {
    async create(params, opts) {
      c.opciones.push(opts);
      c.creaciones.push(params);
      const nombre = params.requestBody.name;
      c.enVuelo += 1;
      try {
        if (lento[nombre]) await sleep(lento[nombre]);
        if (falla[nombre]) throw errHttp(500, `boom ${nombre}`);
        if (params.media) {
          assert.ok(params.media.body instanceof Readable, 'el cuerpo debe ser un stream');
          const partes = [];
          for await (const parte of params.media.body) partes.push(Buffer.from(parte));
          c.bytes[nombre] = Buffer.concat(partes);
        }
        n += 1;
        return { data: { id: `id-${n}`, webViewLink: `https://drive.test/${n}` } };
      } finally {
        c.enVuelo -= 1;
      }
    },
    async update(params, opts) {
      c.opciones.push(opts);
      c.enVueloAlLimpiar = c.enVuelo;
      c.updates.push(params);
      if (updateFalla) {
        const r = updateFalla(c.updates.length);
        if (r) throw r;
      }
      return { data: { id: params.fileId } };
    },
  };
  return c;
}

test('sube desde memoria: stream con los bytes exactos, supportsAllDrives en cada petición y carpeta Nombre_Apellido_ID', async () => {
  const cli = clienteFalso();
  const svc = crearDriveService({ drive: cli, carpetaPadreId: 'PADRE', timeoutMs: 1234 });
  const r = await svc.subirExpediente({ estudianteId: 10, nombres: 'María José', apellidos: 'Pérez Gómez', archivos });

  const [carpeta, ...docs] = cli.creaciones;
  assert.equal(carpeta.requestBody.name, 'María_Pérez_10');
  assert.equal(carpeta.requestBody.mimeType, 'application/vnd.google-apps.folder');
  assert.deepEqual(carpeta.requestBody.parents, ['PADRE']);
  assert.ok(cli.creaciones.every((p) => p.supportsAllDrives === true), 'TODA creación lleva supportsAllDrives');
  assert.ok(cli.opciones.every((o) => o.timeout === 1234), 'cada petición lleva el timeout');
  assert.deepEqual(docs.map((p) => p.requestBody.name), ['foto_carnet.jpg', 'cedula_identidad.pdf']);
  assert.ok(docs.every((p) => p.requestBody.parents[0] === r.carpetaId));
  assert.deepEqual(cli.bytes['foto_carnet.jpg'], FOTO);
  assert.deepEqual(cli.bytes['cedula_identidad.pdf'], PDF);
  assert.equal(r.documentos.length, 2);
  assert.equal(r.documentos[0].bytes, FOTO.length);
  assert.equal(cli.updates.length, 0, 'en el camino feliz no se limpia nada');
});

test('nomenclatura anti path-traversal: sin puntos, barras ni símbolos en la carpeta', async () => {
  const cli = clienteFalso();
  const svc = crearDriveService({ drive: cli, carpetaPadreId: 'PADRE' });
  await svc.subirExpediente({ estudianteId: 7, nombres: '../../etc/passwd', apellidos: 'Pérez<script>', archivos });
  assert.equal(cli.creaciones[0].requestBody.name, 'etcpasswd_Pérezscript_7');
});

test('si un documento falla: espera a que los demás terminen, luego manda la carpeta a la papelera y propaga 502 DRIVE_ERROR', async () => {
  const cli = clienteFalso({ falla: { 'cedula_identidad.pdf': true }, lento: { 'foto_carnet.jpg': 40 } });
  const svc = crearDriveService({ drive: cli, carpetaPadreId: 'PADRE' });
  await assert.rejects(
    svc.subirExpediente({ estudianteId: 10, nombres: 'Luis', apellidos: 'Pérez', archivos }),
    (err) => err.status === 502 && err.codigo === 'DRIVE_ERROR');
  assert.equal(cli.updates.length, 1);
  assert.equal(cli.updates[0].requestBody.trashed, true);
  assert.equal(cli.updates[0].supportsAllDrives, true);
  assert.equal(cli.updates[0].fileId, 'id-1', 'se limpia la carpeta, no un archivo');
  assert.equal(cli.enVueloAlLimpiar, 0, 'no puede haber subidas en vuelo cuando se limpia');
});

test('si falla la creación de la carpeta no hay nada que limpiar', async () => {
  const cli = clienteFalso({ falla: { 'Luis_Pérez_10': true } });
  const svc = crearDriveService({ drive: cli, carpetaPadreId: 'PADRE' });
  await assert.rejects(svc.subirExpediente({ estudianteId: 10, nombres: 'Luis', apellidos: 'Pérez', archivos }), (err) => err.codigo === 'DRIVE_ERROR');
  assert.equal(cli.updates.length, 0);
});

test('eliminarCarpeta: 404 cuenta como éxito y no reintenta', async () => {
  const cli = clienteFalso({ updateFalla: () => errHttp(404) });
  const svc = crearDriveService({ drive: cli, carpetaPadreId: 'PADRE' });
  assert.equal(await svc.eliminarCarpeta('x'), true);
  assert.equal(cli.updates.length, 1);
});

test('eliminarCarpeta: reintenta fallos transitorios (503) y termina en true', async () => {
  const cli = clienteFalso({ updateFalla: (i) => (i < 3 ? errHttp(503) : null) });
  const svc = crearDriveService({ drive: cli, carpetaPadreId: 'PADRE' });
  assert.equal(await svc.eliminarCarpeta('x', { esperaMs: 1 }), true);
  assert.equal(cli.updates.length, 3);
});

test('eliminarCarpeta: un 403 no se reintenta y devuelve false SIN lanzar (no puede tapar el error original)', async () => {
  const cli = clienteFalso({ updateFalla: () => errHttp(403, 'sin permiso') });
  const svc = crearDriveService({ drive: cli, carpetaPadreId: 'PADRE' });
  assert.equal(await svc.eliminarCarpeta('x', { esperaMs: 1 }), false);
  assert.equal(cli.updates.length, 1);
});

test('eliminarCarpeta: agotados los reintentos transitorios devuelve false; sin id devuelve false', async () => {
  const cli = clienteFalso({ updateFalla: () => errHttp(500) });
  const svc = crearDriveService({ drive: cli, carpetaPadreId: 'PADRE' });
  assert.equal(await svc.eliminarCarpeta('x', { reintentos: 2, esperaMs: 1 }), false);
  assert.equal(cli.updates.length, 2);
  assert.equal(await svc.eliminarCarpeta(''), false);
  assert.equal(await svc.eliminarCarpeta(null), false);
});

test('entrada inválida: sin archivos, buffer vacío, id no entero o sin carpeta padre configurada', async () => {
  const cli = clienteFalso();
  const svc = crearDriveService({ drive: cli, carpetaPadreId: 'PADRE' });
  const base = { estudianteId: 1, nombres: 'A', apellidos: 'B', archivos };
  await assert.rejects(svc.subirExpediente({ ...base, archivos: [] }), TypeError);
  await assert.rejects(svc.subirExpediente({ ...base, archivos: [{ ...archivos[0], buffer: Buffer.alloc(0) }] }), TypeError);
  await assert.rejects(svc.subirExpediente({ ...base, estudianteId: '1; DROP' }), TypeError);
  await assert.rejects(crearDriveService({ drive: cli, carpetaPadreId: '' }).subirExpediente(base), (err) => err.status === 503 && err.codigo === 'DRIVE_NO_CONFIGURADO');
  assert.equal(cli.creaciones.length, 0, 'ninguna entrada inválida llega a Drive');
});
