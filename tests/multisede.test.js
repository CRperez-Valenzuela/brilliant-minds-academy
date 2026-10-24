'use strict';
const { db } = require('./helpers/entorno');
const test = require('node:test');
const assert = require('node:assert/strict');
const { alcanceDe } = require('../utils/alcance');
const { prepararInscripcion } = require('../controllers/admisiones.controller');
const { AppError } = require('../errors/AppError');

// `jsonwebtoken` real si está instalado; si no (entorno sin red), un HS256 mínimo con crypto para poder ejercitar el middleware.
const Module = require('node:module');
const crypto = require('node:crypto');
try { require.resolve('jsonwebtoken'); } catch {
  const b64 = (o) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');
  const firma = (data, secreto) => crypto.createHmac('sha256', secreto).update(data).digest('base64url');
  const jwtMinimo = {
    sign: (payload, secreto) => { const d = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}`; return `${d}.${firma(d, secreto)}`; },
    verify: (token, secreto) => {
      const [h, p, f] = String(token).split('.');
      if (firma(`${h}.${p}`, secreto) !== f) throw Object.assign(new Error('invalid signature'), { name: 'JsonWebTokenError' });
      return JSON.parse(Buffer.from(p, 'base64url').toString('utf8'));
    },
  };
  const cargaOriginal = Module._load;
  Module._load = function cargar(request, ...resto) { return request === 'jsonwebtoken' ? jwtMinimo : cargaOriginal.call(this, request, ...resto); };
}
const { firmarToken, requireAuth } = require('../middlewares/auth');

const rs = (...filas) => ({ rows: filas, rowCount: filas.length });

// ── Reloj del cron: 08:00 de Caracas (UTC-4 fijo) = 12:00 UTC ────────────────────────────────────
test('cron por sede: SQL posicional ($n) con alcance de sede; recorre cada sede activa y al final los estudiantes sin sede', async () => {
  const { crearCronWhatsapp } = require('../cron/whatsappCron');
  const rs = (...filas) => ({ rows: filas, rowCount: filas.length });
  const consultas = [];
  const db = {
    ejecutar: async (texto, params) => {
      const maximo = Math.max(0, ...[...texto.matchAll(/\$(\d+)/g)].map((m) => Number(m[1])));
      assert.equal(params.length, maximo, `parámetros posicionales: usa $1..$${maximo}, recibió ${params.length}`);
      assert.ok(!/\bdbo\.|GETDATE|\bTOP\s*\(?\d/i.test(texto), 'sin residuos de MSSQL');
      if (/FROM sedes/.test(texto)) return rs({ id: 1, nombre: 'Norte' }, { id: 2, nombre: 'Sur' });
      if (/INSERT INTO parametros/.test(texto)) return rs({ clave: 'x' });
      if (/FROM \(\s*SELECT DISTINCT ON/.test(texto)) { consultas.push(['PREV', params[8]]); return rs({ estudiante_id: 100 + params[8] }); }
      if (/GROUP BY v\.id/.test(texto)) { consultas.push(['MOR', params[7]]); return rs(); }
      return rs();
    },
  };
  const enviados = [];
  const notificaciones = { VENTANA_PREVENTIVA: { min: 3, max: 5 }, generarAlerta: async (a) => { enviados.push([a.tipo, a.estudianteId]); return { notificacion_id: 1 }; } };
  const cron = crearCronWhatsapp({
    db, notificaciones, guard: { evaluar: async () => ({ habilitado: true }) }, whatsapp: { configurado: () => true },
    bcv: { obtenerTasa: async () => ({}) }, config: { delayMs: 0, maxEnviosPorCiclo: 50, morosidadCadaDias: 7, maxFallosSeguidos: 5, arrendamientoMin: 120, hora: '08:00' },
    esperar: async () => undefined, log: () => undefined, logError: () => undefined,
  });
  const r = await cron.ejecutarCiclo();
  assert.equal(r.estado, 'COMPLETADO');
  assert.deepEqual(consultas, [['PREV', 1], ['MOR', 1], ['PREV', 2], ['MOR', 2], ['PREV', null], ['MOR', null]]);
  assert.deepEqual(r.por_sede.map((x) => x.sede_id), [1, 2, null]);
  assert.deepEqual(enviados, [['PREVENTIVA', 101], ['PREVENTIVA', 102], ['PREVENTIVA', 100]], 'sede 1, sede 2 y al final los sin sede');
});

test('alcance: fail-closed para quien no es admin y no tiene sede; el admin sin sede es consolidado', () => {
  assert.equal(alcanceDe({ rol: 'admin', sede_id: null }), null);
  assert.equal(alcanceDe({ rol: 'admin' }), null);
  assert.equal(alcanceDe({ rol: 'secretaria', sede_id: 4 }), 4);
  assert.throws(() => alcanceDe({ rol: 'secretaria', sede_id: null }), (e) => e instanceof AppError && e.status === 403 && e.codigo === 'SEDE_NO_ASIGNADA');
  assert.throws(() => alcanceDe({ rol: 'secretaria' }), (e) => e.codigo === 'SEDE_NO_ASIGNADA');
  assert.throws(() => alcanceDe({ rol: 'admin', sede_id: 0 }), (e) => e.status === 403);
  assert.throws(() => alcanceDe({ rol: 'admin', sede_id: -2 }), (e) => e.status === 403);
});

test('auth: el JWT lleva sede_id y requireAuth lo expone en req.usuario (NULL cuando no hay sede)', () => {
  const pasar = (usuario) => {
    const token = firmarToken(usuario);
    const req = { get: () => `Bearer ${token}` };
    let err = 'sin-next';
    requireAuth(req, {}, (e) => { err = e; });
    assert.equal(err, undefined);
    return req.usuario;
  };
  assert.deepEqual(pasar({ id: 1, rol: 'secretaria', nombre: 'Ana', sede_id: 9 }), { id: 1, rol: 'secretaria', nombre: 'Ana', sede_id: 9 });
  assert.equal(pasar({ id: 2, rol: 'admin', nombre: 'Root', sede_id: null }).sede_id, null);
  assert.equal(pasar({ id: 3, rol: 'admin', nombre: 'Viejo' }).sede_id, null, 'usuario sin la columna (antes de migrar) → sin sede');
});

// ── Formulario con invitación ───────────────────────────────────────────────────────────────────
const JPG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
const PDF = Buffer.from('%PDF-1.4 contenido');
const body = {
  alumno_nombres: 'Luis', alumno_apellidos: 'Pérez', alumno_fecha_nacimiento: '2015-03-02',
  representante_nombres: 'Ana', representante_apellidos: 'Pérez', representante_cedula: 'V-12345678',
  telefono_codigo: '+58', telefono_numero: '414 123 4567', referencia_bancaria: 'REF-998877', metodo_pago: 'ZELLE',
};
const files = () => ({ foto_carnet: [{ buffer: JPG }], cedula_identidad: [{ buffer: PDF }], acta_nacimiento: [{ buffer: JPG }] });
const TOKEN = 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718';

test('formulario: con invitación el grado puede no llegar (lo impone el servidor); sin invitación sigue siendo obligatorio', () => {
  const conInv = prepararInscripcion({ ...body, invitacion: TOKEN }, files());
  assert.equal(conInv.datos.invitacion, TOKEN);
  assert.equal(conInv.datos.grado_solicitado, null);
  try {
    prepararInscripcion(body, files());
    assert.fail('debía lanzar');
  } catch (err) {
    assert.equal(err.status, 422);
    assert.deepEqual(err.detalles.filter((d) => d.campo === 'grado_solicitado'), [{ campo: 'grado_solicitado', mensaje: 'Es obligatorio.' }]);
  }
  assert.ok(prepararInscripcion({ ...body, grado_solicitado: '3er grado' }, files()).datos.invitacion === null);
});

test('formulario: un token de invitación mal formado se rechaza con 422 en el campo invitacion', () => {
  for (const malo of ['xyz', 'A'.repeat(48), 'a'.repeat(47), `${TOKEN} `.repeat(2)]) {
    try {
      prepararInscripcion({ ...body, grado_solicitado: '3er grado', invitacion: malo }, files());
      assert.fail(`debía rechazar ${malo}`);
    } catch (err) {
      assert.equal(err.status, 422, malo);
      assert.ok(err.detalles.some((d) => d.campo === 'invitacion'), malo);
    }
  }
});
