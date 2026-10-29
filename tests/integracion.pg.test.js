'use strict';
/**
 * Pruebas de INTEGRACIÓN contra un PostgreSQL REAL (sin dobles de la base de datos): migraciones, scripts, servicios,
 * transacciones, concurrencia, RLS de Supabase y el mapeo de errores SQLSTATE.
 *
 *   PG_TEST_PORT=5432 [PG_TEST_HOST=127.0.0.1] [PG_TEST_USER=postgres] [PG_TEST_PASSWORD=...] npm run test:integracion
 *
 * Crea una base de datos desechable (bma_it_<pid>_<ts>) y la elimina al terminar. Necesita un rol con permiso CREATEDB:
 * NO apuntes esto a la base de producción de Supabase. Sin PG_TEST_PORT las pruebas se omiten (npm test sigue en verde).
 */
const { origenPg, libros, RAIZ } = require('./helpers/entorno-integracion');
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');

const PORT = process.env.PG_TEST_PORT;
const omitir = PORT ? false : 'defina PG_TEST_PORT para ejecutar la integración contra PostgreSQL';
const NOMBRE_DB = `bma_it_${process.pid}_${Date.now()}`;
const conexion = {
  DB_SERVER: process.env.PG_TEST_HOST || '127.0.0.1',
  DB_PORT: PORT || '5432',
  DB_NAME: NOMBRE_DB,
  DB_USER: process.env.PG_TEST_USER || 'postgres',
  DB_PASSWORD: process.env.PG_TEST_PASSWORD || 'trust-local',
  DB_SSL: process.env.PG_TEST_SSL || 'false',
};

let db; let svc; let admin;
const t = (nombre, fn) => test(nombre, { skip: omitir }, fn);

// ── utilidades ──────────────────────────────────────────────────────────────────────────────────
const sumarDias = (f, n) => { const d = new Date(`${f}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const bcvFalso = { obtenerTasa: async () => ({ tasa: 36.5, desactualizada: false, capturadaEn: new Date() }) };
const filas = async (texto, p = []) => (await db.ejecutar(texto, p)).rows;
const uno = async (texto, p = []) => (await filas(texto, p))[0];
let seq = 0;

function driveFalso(modo = 'ok') {
  const f = { subidas: [], eliminadas: [] };
  f.subirExpediente = async (a) => {
    f.subidas.push(a);
    if (modo === 'falla') throw svc.AppError(502, 'DRIVE_ERROR', 'Drive caído');
    return {
      carpetaId: `carpeta-${a.estudianteId}`, carpetaUrl: `https://drive.test/${a.estudianteId}`,
      documentos: a.archivos.map((x) => ({ tipo: x.tipo, fileId: `f-${a.estudianteId}-${x.tipo}`, url: null, nombre: `${x.tipo}.${x.ext}`, mime: x.mime, bytes: x.buffer.length })),
    };
  };
  f.eliminarCarpeta = async (id) => { f.eliminadas.push(id); };
  return f;
}
const archivos = [
  { tipo: 'FOTO_CARNET', buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1]), mime: 'image/jpeg', ext: 'jpg' },
  { tipo: 'CEDULA_IDENTIDAD', buffer: Buffer.from('%PDF-1.7 x'), mime: 'application/pdf', ext: 'pdf' },
  { tipo: 'ACTA_NACIMIENTO', buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 1]), mime: 'image/png', ext: 'png' },
];
const inscripcion = (ov = {}) => ({
  alumno_nombres: 'Luis', alumno_apellidos: 'Pérez', alumno_cedula: null, alumno_fecha_nacimiento: '2015-03-02', grado_solicitado: '3er grado',
  colegio_procedencia: null, ultimo_grado_aprobado: null, tipo_sangre: 'O+', alergias: null, condiciones_medicas: null, medicamentos: null,
  emergencia_nombre: null, emergencia_telefono: null, representante_nombres: 'Ana', representante_apellidos: 'Pérez', representante_cedula: 'V-12345678',
  representante_email: 'ana@example.com', telefono: '584141234567', referencia_bancaria: 'REF-998877', metodo_pago: 'PAGO_MOVIL', ...ov,
});

/** Siembra directa (sin pasar por los servicios) un representante + estudiante + cuota. */
async function sembrar({ estatus = 'Activo', vence = sumarDias(svc.hoy(), 10), monto = 25, estadoCuota = 'Pendiente', nombres = 'Sofía', apellidos = 'Gómez', sedeId = null } = {}) {
  seq += 1;
  const rep = await uno(
    `INSERT INTO representantes (nombres, apellidos, cedula, telefono) VALUES ('Rep', 'Siembra', $1, '584120000000') RETURNING id`, [`V-S${seq}${Date.now() % 100000}`]);
  const est = await uno(
    `INSERT INTO estudiantes (representante_id, nombres, apellidos, fecha_nacimiento, grado_solicitado, estatus_academico, sede_id)
     VALUES ($1, $2, $3, '2014-05-06', '4to grado', $4, $5) RETURNING id`, [rep.id, nombres, apellidos, estatus, sedeId]);
  const cuota = await uno(
    `INSERT INTO cuotas (estudiante_id, tipo, concepto, monto_usd, fecha_vencimiento, estado) VALUES ($1, 'MENSUALIDAD', $2, $3, $4, $5) RETURNING id`,
    [est.id, `Mensualidad S${seq}`, monto, vence, estadoCuota]);
  return { repId: rep.id, estId: est.id, cuotaId: cuota.id };
}

function hijo(script, extraEnv = {}) {
  return execFileSync(process.execPath, ['-r', path.join(RAIZ, 'tests', 'helpers', 'entorno-integracion.js'), path.join(RAIZ, script)], {
    env: { ...process.env, ...conexion, NODE_ENV: 'test', ...extraEnv }, encoding: 'utf8', cwd: RAIZ,
  });
}

// ── Preparación / limpieza ──────────────────────────────────────────────────────────────────────
test.before(async () => {
  if (omitir) return;
  Object.assign(process.env, conexion);
  const { Pool } = require('pg');
  admin = new Pool({ host: conexion.DB_SERVER, port: Number(conexion.DB_PORT), user: conexion.DB_USER, password: conexion.DB_PASSWORD, database: 'postgres', ssl: false });
  await admin.query(`CREATE DATABASE ${NOMBRE_DB}`);
  // Roles de Supabase (a nivel de clúster): solo se crean si no existen.
  await admin.query(`DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  END $$`);
  db = require('../config/db');
  const fechas = require('../utils/fechas');
  svc = {
    hoy: () => fechas.hoyCaracas(),
    periodo: () => fechas.periodoActual(),
    AppError: (...a) => new (require('../errors/AppError').AppError)(...a),
    admisiones: require('../services/admisiones.service'),
    pagos: require('../services/pagos.service'),
    crm: require('../services/crm.service'),
    facturacion: require('../services/facturacion.service'),
    conta: require('../services/contabilidad.service'),
    portal: require('../services/portal.service'),
    notif: require('../services/notificaciones.service'),
    parametros: require('../services/parametros.service'),
    exportacion: require('../services/exportacion.service'),
    guard: require('../modules/premium/guard'),
    sedes: require('../services/sedes.service'),
    invitaciones: require('../services/invitaciones.service'),
    alcance: require('../utils/alcance'),
    bcv: require('../services/bcv.service'),
    normalizar: require('../middlewares/errorHandler').normalizar,
  };
});

test.after(async () => {
  if (omitir) return;
  if (db) await db.closePool();
  if (admin) {
    await admin.query(`DROP DATABASE IF EXISTS ${NOMBRE_DB} WITH (FORCE)`);
    await admin.end();
  }
});

// ── Migraciones y scripts ───────────────────────────────────────────────────────────────────────
t('migrate.js: aplica las 8 migraciones en orden y una segunda ejecución no hace nada (idempotente)', () => {
  const primera = hijo('scripts/migrate.js');
  for (const f of fs.readdirSync(path.join(RAIZ, 'database', 'migrations')).filter((x) => x.endsWith('.sql'))) assert.match(primera, new RegExp(`Aplicada ${f}`));
  const segunda = hijo('scripts/migrate.js');
  assert.ok(!/Aplicada/.test(segunda), segunda);
  assert.equal((segunda.match(/ya aplicada/g) || []).length, 8);
  assert.match(segunda, /Migraciones al día/);
});

t(`el esquema real contiene las 19 tablas + la vista, con RLS activo y la vista con security_invoker (driver: ${origenPg})`, async () => {
  const tablas = await filas(`SELECT relname, relrowsecurity FROM pg_class WHERE relkind = 'r' AND relnamespace = 'public'::regnamespace ORDER BY 1`);
  assert.equal(tablas.length, 19); // 17 del Core Base + sedes + invitaciones_inscripcion
  assert.ok(tablas.every((x) => x.relrowsecurity), 'todas las tablas deben tener RLS');
  const v = await uno(`SELECT array_to_string(reloptions, ',') AS opciones FROM pg_class WHERE relname = 'vw_estudiantes_estado'`);
  assert.equal(v.opciones, 'security_invoker=true');
  const reg = await filas('SELECT nombre FROM schema_migrations ORDER BY nombre');
  assert.equal(reg.length, 8);
});

t('crear-admin.js: upsert por correo (ON CONFLICT), normaliza a minúsculas, reactiva y no duplica', async () => {
  const env = { ADMIN_NOMBRE: 'Admin Uno', ADMIN_EMAIL: 'Admin@BMA.example', ADMIN_PASSWORD: 'una-clave-de-prueba-larga-1' };
  hijo('scripts/crear-admin.js', env);
  await db.ejecutar('UPDATE usuarios_admin SET activo = FALSE');
  hijo('scripts/crear-admin.js', { ...env, ADMIN_NOMBRE: 'Admin Dos', ADMIN_PASSWORD: 'otra-clave-de-prueba-larga-2' });
  const u = await filas('SELECT nombre, email, activo, rol FROM usuarios_admin');
  assert.deepEqual(u, [{ nombre: 'Admin Dos', email: 'admin@bma.example', activo: true, rol: 'admin' }]);
  assert.throws(() => hijo('scripts/crear-admin.js', { ...env, ADMIN_PASSWORD: 'corta' }), /Command failed/);
});

// ── Capa db.js ──────────────────────────────────────────────────────────────────────────────────
t('db.js: tipos (DATE→texto, NUMERIC→number, COUNT→number), params nulos/undefined y rechazo de params como objeto', async () => {
  const r = await uno(`SELECT DATE '2026-10-21' AS d, 12.50::numeric(10,2) AS n, COUNT(*) AS c, $1::text AS t, $2::int AS i`, [null, undefined]);
  assert.deepEqual(r, { d: '2026-10-21', n: 12.5, c: 1, t: null, i: null });
  await assert.rejects(() => db.ejecutar('SELECT $1::int', { a: 1 }), TypeError);
  await assert.rejects(() => db.ejecutar('SELECT $1::int AS x', ['no-es-entero']), (e) => e.code === '22P02');
});

t('conTransaccion: COMMIT al resolver, ROLLBACK al lanzar (error original intacto), sin fugas de conexiones', async () => {
  await db.conTransaccion(async (tx) => { await db.ejecutar(`INSERT INTO parametros VALUES ('T_OK', '1')`, [], tx); });
  assert.equal((await uno(`SELECT valor FROM parametros WHERE clave = 'T_OK'`)).valor, '1');
  for (let i = 0; i < 5; i += 1) {
    await assert.rejects(
      db.conTransaccion(async (tx) => { await db.ejecutar(`INSERT INTO parametros VALUES ('T_FALLA', 'x')`, [], tx); throw new Error('boom'); }),
      /boom/);
  }
  assert.equal((await filas(`SELECT 1 FROM parametros WHERE clave = 'T_FALLA'`)).length, 0);
  // un error SQL dentro de la transacción conserva su SQLSTATE y deja la sesión limpia para el siguiente uso
  await assert.rejects(
    db.conTransaccion(async (tx) => { await db.ejecutar(`INSERT INTO cuentas_pago (metodo, titular, detalle) VALUES ('CHEQUE', 'x', 'y')`, [], tx); }),
    (e) => e.code === '23514');
  const pool = await db.getPool();
  assert.equal(pool.totalCount, pool.idleCount, 'todas las conexiones vuelven al pool');
  await assert.rejects(db.conTransaccion(async () => {}, 'LEVEL RARO'), /aislamiento/);
});

// ── Parámetros, cuentas y BCV ───────────────────────────────────────────────────────────────────
t('parametros: upsert ON CONFLICT, matrícula sin configurar → 503 y cuentas activas', async () => {
  await assert.rejects(svc.parametros.matriculaUsd(), (e) => e.status === 503 && e.codigo === 'CONFIG_INCOMPLETA');
  await svc.parametros.guardar('MATRICULA_USD', '100.00');
  await svc.parametros.guardar('MATRICULA_USD', '120.00');
  assert.equal(await svc.parametros.matriculaUsd(), 120);
  assert.equal((await filas(`SELECT 1 FROM parametros WHERE clave = 'MATRICULA_USD'`)).length, 1);
  await svc.parametros.guardar('MATRICULA_USD', '100.00');
  await db.ejecutar(`INSERT INTO cuentas_pago (metodo, titular, detalle, activa) VALUES ('ZELLE', 'BMA LLC', 'pagos@bma.example', TRUE), ('PAYPAL', 'BMA', 'x@y.z', FALSE)`);
  const cuentas = await svc.parametros.cuentasActivas();
  assert.deepEqual(cuentas.map((c) => c.metodo), ['ZELLE']);
});

t('bcv: guarda la captura (INSERT … RETURNING) y, si la fuente cae, usa la última tasa guardada marcándola desactualizada', async () => {
  const http = { get: async () => ({ data: { fuente: 'oficial', promedio: 36.5123, fechaActualizacion: '2026-10-21T12:00:00-04:00' } }) };
  const ok = await svc.bcv.crearBcvService({ http }).obtenerTasa({ fresca: true });
  assert.equal(ok.tasa, 36.5123);
  assert.ok(ok.capturadaEn instanceof Date);
  const guardada = await uno('SELECT tasa, fuente FROM tasas_bcv ORDER BY capturada_en DESC LIMIT 1');
  assert.deepEqual(guardada, { tasa: 36.5123, fuente: 'dolarapi:oficial' });
  const caida = await svc.bcv.crearBcvService({ http: { get: async () => { throw new Error('sin red'); } } }).obtenerTasa({ fresca: true });
  assert.deepEqual([caida.tasa, caida.desactualizada], [36.5123, true]);
  const err = console.error; console.error = () => {};
  try {
    await db.ejecutar(`UPDATE tasas_bcv SET capturada_en = NOW() - INTERVAL '48 hours'`);
    await assert.rejects(svc.bcv.crearBcvService({ http: { get: async () => { throw new Error('sin red'); } } }).obtenerTasa({ fresca: true }), (e) => e.status === 503);
  } finally { console.error = err; }
});

// ── Admisiones ──────────────────────────────────────────────────────────────────────────────────
t('inscripción completa: representante (upsert), estudiante Pendiente, cuota matrícula En Revisión, referencia Por Validar, 3 documentos', async () => {
  const drive = driveFalso();
  const r = await svc.admisiones.registrarInscripcion({ datos: inscripcion(), archivos }, { bcvSvc: bcvFalso, driveSvc: drive });
  assert.equal(r.estatus, 'Pendiente por Validación Administrativa');
  assert.equal(r.monto_usd, 100);
  assert.equal(r.monto_bs, 3650);
  const est = await uno('SELECT * FROM estudiantes WHERE id = $1', [r.estudiante_id]);
  assert.equal(est.estatus_academico, 'Pendiente por Validación Administrativa');
  assert.equal(est.fecha_nacimiento, '2015-03-02'); // sin desfase de zona horaria
  assert.equal(est.drive_folder_id, `carpeta-${r.estudiante_id}`);
  assert.deepEqual(await uno(`SELECT estado, tipo, monto_usd, fecha_vencimiento FROM cuotas WHERE estudiante_id = $1`, [r.estudiante_id]),
    { estado: 'En Revisión', tipo: 'MATRICULA', monto_usd: 100, fecha_vencimiento: svc.hoy() });
  assert.deepEqual(await uno('SELECT referencia, estado, monto_bs, tasa_bcv FROM pagos_referencias WHERE estudiante_id = $1', [r.estudiante_id]),
    { referencia: 'REF-998877', estado: 'Por Validar', monto_bs: 3650, tasa_bcv: 36.5 });
  assert.equal((await filas('SELECT 1 FROM documentos_estudiante WHERE estudiante_id = $1', [r.estudiante_id])).length, 3);
  const rep = await uno(`SELECT telefono FROM representantes WHERE cedula = 'V-12345678'`);
  assert.equal(rep.telefono, '584141234567');
});

t('segunda inscripción del mismo representante (cédula en minúsculas): no duplica, actualiza teléfono y conserva el correo', async () => {
  const datos = inscripcion({ alumno_nombres: 'María', representante_cedula: 'v-12345678', representante_email: null, telefono: '584149999999', referencia_bancaria: 'REF-000111' });
  await svc.admisiones.registrarInscripcion({ datos, archivos }, { bcvSvc: bcvFalso, driveSvc: driveFalso() });
  const reps = await filas(`SELECT cedula, email, telefono FROM representantes WHERE upper(cedula) = 'V-12345678'`);
  assert.deepEqual(reps, [{ cedula: 'V-12345678', email: 'ana@example.com', telefono: '584149999999' }]);
  assert.equal((await uno(`SELECT COUNT(*)::int AS n FROM estudiantes e JOIN representantes r ON r.id = e.representante_id WHERE r.cedula = 'V-12345678'`)).n, 2);
});

t('referencia bancaria duplicada (aunque cambie la capitalización): 409 REFERENCIA_DUPLICADA, rollback total y Drive intacto', async () => {
  const antes = (await uno('SELECT COUNT(*)::int AS n FROM estudiantes')).n;
  const drive = driveFalso();
  const err = await svc.admisiones.registrarInscripcion({ datos: inscripcion({ alumno_nombres: 'Pedro', referencia_bancaria: 'ref-998877' }), archivos }, { bcvSvc: bcvFalso, driveSvc: drive }).catch((e) => e);
  assert.equal(err.code, '23505');
  assert.equal(err.constraint, 'ux_pagos_referencia_activa');
  const http = svc.normalizar(err);
  assert.deepEqual([http.status, http.codigo], [409, 'REFERENCIA_DUPLICADA']);
  assert.equal((await uno('SELECT COUNT(*)::int AS n FROM estudiantes')).n, antes, 'rollback: no queda el estudiante');
  assert.equal(drive.subidas.length, 0);
});

t('si Drive falla se revierte TODO (estudiante, cuota y pago) y el AppError 502 se propaga', async () => {
  const antes = (await uno('SELECT COUNT(*)::int AS n FROM pagos_referencias')).n;
  await assert.rejects(
    svc.admisiones.registrarInscripcion({ datos: inscripcion({ alumno_nombres: 'Rosa', referencia_bancaria: 'REF-DRIVE-1' }), archivos }, { bcvSvc: bcvFalso, driveSvc: driveFalso('falla') }),
    (e) => e.status === 502 && e.codigo === 'DRIVE_ERROR');
  assert.equal((await uno('SELECT COUNT(*)::int AS n FROM pagos_referencias')).n, antes);
  assert.equal((await filas(`SELECT 1 FROM estudiantes WHERE nombres = 'Rosa'`)).length, 0);
});

t('mismo estudiante dos veces (ux_estudiantes_identidad): 409 ESTUDIANTE_DUPLICADO', async () => {
  const err = await svc.admisiones.registrarInscripcion({ datos: inscripcion({ referencia_bancaria: 'REF-OTRA-9' }), archivos }, { bcvSvc: bcvFalso, driveSvc: driveFalso() }).catch((e) => e);
  assert.equal(svc.normalizar(err).codigo, 'ESTUDIANTE_DUPLICADO');
});

t('sin matrícula configurada (0) las inscripciones se bloquean con 503 sin tocar la base', async () => {
  await svc.parametros.guardar('MATRICULA_USD', '0.00');
  const antes = (await uno('SELECT COUNT(*)::int AS n FROM estudiantes')).n;
  await assert.rejects(svc.admisiones.registrarInscripcion({ datos: inscripcion({ alumno_nombres: 'Zoe' }), archivos }, { bcvSvc: bcvFalso, driveSvc: driveFalso() }), (e) => e.codigo === 'CONFIG_INCOMPLETA');
  assert.equal((await uno('SELECT COUNT(*)::int AS n FROM estudiantes')).n, antes);
  await svc.parametros.guardar('MATRICULA_USD', '100.00');
});

// ── Bandeja de auditoría y pagos ────────────────────────────────────────────────────────────────
t('bandeja: lista cronológica con filtro por estado, paginación LIMIT/OFFSET y total', async () => {
  const r = await svc.pagos.bandeja({ estado: 'Por Validar', offset: 0, limite: 50 });
  assert.equal(r.total, 2);
  assert.equal(r.items[0].referencia, 'REF-998877'); // la más antigua primero
  assert.equal(r.items[0].fecha_vencimiento, svc.hoy());
  assert.equal(r.items[0].estudiante, 'Luis Pérez');
  assert.equal(r.items[0].representante, 'Ana Pérez');
  assert.ok(r.items[0].declarado_en instanceof Date);
  const p2 = await svc.pagos.bandeja({ estado: 'Por Validar', offset: 1, limite: 1 });
  assert.deepEqual([p2.items.length, p2.total], [1, 2]);
  assert.equal((await svc.pagos.bandeja({ estado: null, offset: 0, limite: 50 })).total, 2); // sin filtro de estado
  assert.equal((await svc.pagos.bandeja({ estado: 'Aprobada', offset: 0, limite: 50 })).total, 0);
});

t('aprobar: pago Aprobada, cuota Pagada, estudiante Activo y estatus recalculado "Al día"; aprobar de nuevo → 409', async () => {
  const pago = (await svc.pagos.bandeja({ estado: 'Por Validar', offset: 0, limite: 1 })).items[0];
  const admin1 = await uno('SELECT id FROM usuarios_admin LIMIT 1');
  const r = await svc.pagos.aprobar({ pagoId: pago.id, usuarioId: admin1.id, nota: 'Verificado en el banco' });
  assert.deepEqual([r.estado_dinamico, r.estatus_pago, r.deuda_vencida_usd], ['Activo', 'Al día', 0]);
  assert.equal((await uno('SELECT estatus_academico FROM estudiantes WHERE id = $1', [pago.estudiante_id])).estatus_academico, 'Activo');
  assert.equal((await uno('SELECT estado FROM cuotas WHERE id = $1', [pago.cuota_id])).estado, 'Pagada');
  const fila = await uno('SELECT estado, revisado_por, nota_revision, revisado_en FROM pagos_referencias WHERE id = $1', [pago.id]);
  assert.deepEqual([fila.estado, fila.revisado_por, fila.nota_revision, fila.revisado_en instanceof Date], ['Aprobada', admin1.id, 'Verificado en el banco', true]);
  await assert.rejects(svc.pagos.aprobar({ pagoId: pago.id, usuarioId: admin1.id }), (e) => e.status === 409 && e.codigo === 'PAGO_YA_PROCESADO');
  await assert.rejects(svc.pagos.aprobar({ pagoId: 999999, usuarioId: admin1.id }), (e) => e.status === 404);
});

t('rechazar: la cuota vuelve a Pendiente y la referencia rechazada se puede volver a usar (índice parcial)', async () => {
  const s = await sembrar();
  const admin1 = await uno('SELECT id FROM usuarios_admin LIMIT 1');
  const p1 = await svc.pagos.declararReferencia({ estudianteId: s.estId, cuotaId: s.cuotaId, referencia: 'ref-reuso-1', metodo: 'ZELLE', tasa: 36.5 });
  assert.equal(p1.montoBs, 912.5);
  assert.equal((await uno('SELECT referencia FROM pagos_referencias WHERE id = $1', [p1.pagoId])).referencia, 'REF-REUSO-1');
  await svc.pagos.rechazar({ pagoId: p1.pagoId, usuarioId: admin1.id, nota: 'No aparece en el banco' });
  assert.equal((await uno('SELECT estado FROM cuotas WHERE id = $1', [s.cuotaId])).estado, 'Pendiente');
  const p2 = await svc.pagos.declararReferencia({ estudianteId: s.estId, cuotaId: s.cuotaId, referencia: 'REF-REUSO-1', metodo: 'ZELLE', tasa: 36.5 });
  assert.ok(p2.pagoId > p1.pagoId);
});

t('declararReferencia sin transacción propia: referencia duplicada NO deja la cuota atascada en "En Revisión"', async () => {
  const a = await sembrar();
  const b = await sembrar();
  await svc.pagos.declararReferencia({ estudianteId: a.estId, cuotaId: a.cuotaId, referencia: 'ATASCO-1', metodo: 'BINANCE', tasa: 36.5 });
  const err = await svc.pagos.declararReferencia({ estudianteId: b.estId, cuotaId: b.cuotaId, referencia: 'atasco-1', metodo: 'BINANCE', tasa: 36.5 }).catch((e) => e);
  assert.equal(err.code, '23505');
  assert.equal((await uno('SELECT estado FROM cuotas WHERE id = $1', [b.cuotaId])).estado, 'Pendiente');
  // otro método de pago sí admite la misma referencia
  await svc.pagos.declararReferencia({ estudianteId: b.estId, cuotaId: b.cuotaId, referencia: 'ATASCO-1', metodo: 'ZELLE', tasa: 36.5 });
});

t('concurrencia: dos aprobaciones simultáneas del mismo pago → una gana (FOR UPDATE), la otra recibe 409', async () => {
  const s = await sembrar();
  const admin1 = await uno('SELECT id FROM usuarios_admin LIMIT 1');
  const { pagoId } = await svc.pagos.declararReferencia({ estudianteId: s.estId, cuotaId: s.cuotaId, referencia: 'CONC-APROBAR', metodo: 'PAYPAL', tasa: 36.5 });
  const res = await Promise.allSettled(Array.from({ length: 6 }, () => svc.pagos.aprobar({ pagoId, usuarioId: admin1.id })));
  assert.equal(res.filter((x) => x.status === 'fulfilled').length, 1);
  assert.ok(res.filter((x) => x.status === 'rejected').every((x) => x.reason.codigo === 'PAGO_YA_PROCESADO'));
});

t('concurrencia: dos declaraciones simultáneas sobre la misma cuota → una gana y la otra CUOTA_NO_PAGABLE', async () => {
  const s = await sembrar();
  const res = await Promise.allSettled(['CONC-DECL-A', 'CONC-DECL-B', 'CONC-DECL-C'].map((ref) =>
    svc.pagos.declararReferencia({ estudianteId: s.estId, cuotaId: s.cuotaId, referencia: ref, metodo: 'ZELLE', tasa: 36.5 })));
  assert.equal(res.filter((x) => x.status === 'fulfilled').length, 1);
  assert.ok(res.filter((x) => x.status === 'rejected').every((x) => x.reason.codigo === 'CUOTA_NO_PAGABLE'));
  assert.equal((await uno('SELECT COUNT(*)::int AS n FROM pagos_referencias WHERE cuota_id = $1', [s.cuotaId])).n, 1);
});

// ── CRM / vista en tiempo real ──────────────────────────────────────────────────────────────────
t('vista: Moroso solo con cuotas vencidas (hoy = día de Caracas); "En Revisión" vencida también cuenta; Al día tras aprobar', async () => {
  const hoy = svc.hoy();
  const ok = await sembrar({ vence: hoy, nombres: 'Vence', apellidos: 'Hoy' });          // vence hoy → NO es mora
  const mora = await sembrar({ vence: sumarDias(hoy, -3), monto: 40, nombres: 'En', apellidos: 'Mora' });
  const enRev = await sembrar({ vence: sumarDias(hoy, -1), estadoCuota: 'En Revisión', nombres: 'Revision', apellidos: 'Vencida' });
  const retirado = await sembrar({ estatus: 'Fuera de la Academia', vence: sumarDias(hoy, -9), nombres: 'Fuera', apellidos: 'Total' });
  const pend = await sembrar({ estatus: 'Pendiente por Validación Administrativa', vence: sumarDias(hoy, -9), nombres: 'Nuevo', apellidos: 'Ingreso' });
  const v = async (id) => uno('SELECT estado_dinamico, estatus_pago, cuotas_vencidas, deuda_vencida_usd, proximo_vencimiento FROM vw_estudiantes_estado WHERE id = $1', [id]);
  assert.deepEqual(await v(ok.estId), { estado_dinamico: 'Activo', estatus_pago: 'Al día', cuotas_vencidas: 0, deuda_vencida_usd: 0, proximo_vencimiento: hoy });
  assert.deepEqual(await v(mora.estId), { estado_dinamico: 'Moroso', estatus_pago: 'Moroso', cuotas_vencidas: 1, deuda_vencida_usd: 40, proximo_vencimiento: sumarDias(hoy, -3) });
  assert.equal((await v(enRev.estId)).estado_dinamico, 'Moroso');
  assert.deepEqual([(await v(retirado.estId)).estado_dinamico, (await v(retirado.estId)).estatus_pago], ['Fuera de la Academia', 'N/A']);
  assert.deepEqual([(await v(pend.estId)).estado_dinamico, (await v(pend.estId)).estatus_pago], ['Pendiente por Validación Administrativa', 'Pendiente de Validación']);
  // aprobar la referencia de la cuota vencida lo devuelve a "Al día" en tiempo real
  const admin1 = await uno('SELECT id FROM usuarios_admin LIMIT 1');
  const { pagoId } = await svc.pagos.declararReferencia({ estudianteId: mora.estId, cuotaId: mora.cuotaId, referencia: 'MORA-PAGA-1', metodo: 'ZELLE', tasa: 36.5 });
  assert.equal((await v(mora.estId)).estado_dinamico, 'Moroso', 'En Revisión sigue siendo mora hasta que un administrador apruebe');
  const r = await svc.pagos.aprobar({ pagoId, usuarioId: admin1.id });
  assert.deepEqual([r.estado_dinamico, r.estatus_pago], ['Activo', 'Al día']);
});

t('crm: resumen por estado, listado con búsqueda ILIKE (comodines % _ escapados), filtros y detalle', async () => {
  await sembrar({ vence: sumarDias(svc.hoy(), -4), nombres: 'Segundo', apellidos: 'Moroso' });
  const r = await svc.crm.resumen();
  assert.ok(r.morosos >= 1 && r.activos >= 1 && r.fuera_de_la_academia >= 1 && r.pendientes_validacion >= 1);
  assert.equal(r.total, r.activos + r.morosos + r.fuera_de_la_academia + r.pendientes_validacion);
  const porNombre = await svc.crm.listar({ q: 'pérez', offset: 0, limite: 50 });
  assert.ok(porNombre.items.length >= 2 && porNombre.items.every((x) => /pérez/i.test(`${x.nombres} ${x.apellidos} ${x.representante}`)));
  assert.equal((await svc.crm.listar({ q: 'PÉREZ', offset: 0, limite: 50 })).total, porNombre.total, 'insensible a mayúsculas');
  assert.equal((await svc.crm.listar({ q: '%', offset: 0, limite: 50 })).total, 0, 'el comodín % se trata como texto');
  assert.equal((await svc.crm.listar({ q: '_', offset: 0, limite: 50 })).total, 0);
  assert.equal((await svc.crm.listar({ q: "o'brien; DROP TABLE cuotas;--", offset: 0, limite: 50 })).total, 0);
  const morosos = await svc.crm.listar({ estado: 'Moroso', offset: 0, limite: 2 });
  assert.ok(morosos.total >= 2 && morosos.items.length === 2 && morosos.items.every((x) => x.estado_dinamico === 'Moroso'));
  assert.equal(typeof morosos.items[0].deuda_vencida_usd, 'number');
  assert.match(morosos.items[0].proximo_vencimiento, /^\d{4}-\d{2}-\d{2}$/);
  const d = await svc.crm.detalle((await uno(`SELECT id FROM estudiantes WHERE nombres = 'Luis'`)).id);
  assert.equal(d.fecha_nacimiento, '2015-03-02');
  assert.equal(d.estado_dinamico, 'Activo');
  assert.equal(d.documentos.length, 3);
  assert.equal(d.pagos[0].estado, 'Aprobada');
  assert.equal(d.rep_cedula, 'V-12345678');
  await assert.rejects(svc.crm.detalle(987654), (e) => e.status === 404);
});

t('retirar anula las cuotas pendientes y deja de ser moroso; reactivar solo aplica a retirados', async () => {
  const s = await sembrar({ vence: sumarDias(svc.hoy(), -2) });
  assert.equal((await uno('SELECT estado_dinamico FROM vw_estudiantes_estado WHERE id = $1', [s.estId])).estado_dinamico, 'Moroso');
  await svc.crm.retirar({ id: s.estId, motivo: 'Mudanza' });
  assert.equal((await uno('SELECT estado FROM cuotas WHERE id = $1', [s.cuotaId])).estado, 'Anulada');
  const e = await uno('SELECT estatus_academico, fecha_retiro, motivo_retiro FROM estudiantes WHERE id = $1', [s.estId]);
  assert.deepEqual([e.estatus_academico, e.fecha_retiro, e.motivo_retiro], ['Fuera de la Academia', svc.hoy(), 'Mudanza']);
  await assert.rejects(svc.crm.retirar({ id: s.estId }), (x) => x.codigo === 'YA_RETIRADO');
  await assert.rejects(svc.crm.retirar({ id: 987654 }), (x) => x.status === 404);
  await svc.crm.reactivar({ id: s.estId });
  assert.equal((await uno('SELECT fecha_retiro FROM estudiantes WHERE id = $1', [s.estId])).fecha_retiro, null);
  await assert.rejects(svc.crm.reactivar({ id: s.estId }), (x) => x.codigo === 'NO_REACTIVABLE');
});

// ── Facturación ─────────────────────────────────────────────────────────────────────────────────
t('facturación: crearCuota, listarCuotas con filtros opcionales tipados y reglas de negocio', async () => {
  const s = await sembrar({ nombres: 'Cuota', apellidos: 'Prueba' });
  const c = await svc.facturacion.crearCuota({ estudiante_id: s.estId, tipo: 'OTRO', concepto: 'Excursión', monto_usd: 15.5, fecha_vencimiento: sumarDias(svc.hoy(), 20) });
  assert.ok(c.id > 0);
  const lista = await svc.facturacion.listarCuotas({ estudianteId: s.estId, estado: 'Pendiente', offset: 0, limite: 10 });
  assert.equal(lista.total, 2);
  assert.equal(lista.items[0].estudiante, 'Cuota Prueba');
  assert.match(lista.items[0].fecha_vencimiento, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal((await svc.facturacion.listarCuotas({ offset: 0, limite: 5 })).items.length, 5); // filtros nulos
  assert.equal((await svc.facturacion.listarCuotas({ estudianteId: s.estId, estado: 'Pagada', offset: 0, limite: 5 })).total, 0);
  await assert.rejects(svc.facturacion.crearCuota({ estudiante_id: 987654, tipo: 'OTRO', concepto: 'x', monto_usd: 1, fecha_vencimiento: svc.hoy() }), (e) => e.status === 404);
  const fuera = await sembrar({ estatus: 'Fuera de la Academia' });
  await assert.rejects(svc.facturacion.crearCuota({ estudiante_id: fuera.estId, tipo: 'OTRO', concepto: 'x', monto_usd: 1, fecha_vencimiento: svc.hoy() }), (e) => e.codigo === 'ESTUDIANTE_FUERA');
});

t('generarMensualidades es idempotente, también con ejecuciones simultáneas (índice único parcial + ON CONFLICT DO NOTHING)', async () => {
  const activos = (await uno(`SELECT COUNT(*)::int AS n FROM estudiantes WHERE estatus_academico = 'Activo'`)).n;
  const args = { concepto: 'Mensualidad prueba', monto_usd: 50, fecha_vencimiento: sumarDias(svc.hoy(), 5) };
  const [x, y, z] = await Promise.all([svc.facturacion.generarMensualidades(args), svc.facturacion.generarMensualidades(args), svc.facturacion.generarMensualidades(args)]);
  assert.equal(x.creadas + y.creadas + z.creadas, activos);
  assert.equal((await svc.facturacion.generarMensualidades(args)).creadas, 0);
  assert.equal((await uno(`SELECT COUNT(*)::int AS n FROM cuotas WHERE concepto = 'Mensualidad prueba'`)).n, activos);
  // el mismo concepto cargado a mano para un estudiante ya cubierto → 409 CUOTA_DUPLICADA
  const e = await uno(`SELECT estudiante_id FROM cuotas WHERE concepto = 'Mensualidad prueba' LIMIT 1`);
  const err = await svc.facturacion.crearCuota({ estudiante_id: e.estudiante_id, tipo: 'MENSUALIDAD', concepto: 'Mensualidad prueba', monto_usd: 50, fecha_vencimiento: svc.hoy() }).catch((x) => x);
  assert.equal(svc.normalizar(err).codigo, 'CUOTA_DUPLICADA');
  // una anulada libera el concepto
  await db.ejecutar(`UPDATE cuotas SET estado = 'Anulada' WHERE estudiante_id = $1 AND concepto = 'Mensualidad prueba'`, [e.estudiante_id]);
  assert.equal((await svc.facturacion.generarMensualidades(args)).creadas, 1);
});

t('tablero: contrato exacto, KPIs numéricos y cobrado por día en hora de Caracas', async () => {
  const r = await svc.facturacion.tablero(svc.periodo());
  assert.deepEqual(Object.keys(r), ['periodo', 'cobrado', 'saldos_vencidos', 'cuentas_pendientes', 'referencias_por_validar', 'cobrado_por_dia']);
  for (const k of [r.cobrado.monto_usd, r.saldos_vencidos.monto_usd, r.cuentas_pendientes.monto_usd]) assert.equal(typeof k, 'number');
  assert.ok(r.cobrado.cantidad >= 2 && r.cobrado.monto_usd >= 100);
  assert.ok(r.saldos_vencidos.cantidad >= 1);
  assert.ok(r.cobrado_por_dia.length >= 1 && /^\d{4}-\d{2}-\d{2}$/.test(r.cobrado_por_dia[0].dia));
  assert.equal(r.cobrado_por_dia.reduce((a, d) => a + d.monto_usd, 0), r.cobrado.monto_usd);
  assert.equal(r.referencias_por_validar, (await uno(`SELECT COUNT(*)::int AS n FROM pagos_referencias WHERE estado = 'Por Validar'`)).n);
});

// ── Portal privado ──────────────────────────────────────────────────────────────────────────────
t('portal: el token se guarda solo como hash, vence a los 30 días, la vista lista cuotas abiertas y declarar usa transacción propia', async () => {
  const s = await sembrar({ vence: sumarDias(svc.hoy(), 3), nombres: 'Portal', apellidos: 'Token' });
  const token = await svc.portal.emitirToken(s.estId);
  assert.match(token, /^[a-f0-9]{48}$/);
  const guardado = await uno('SELECT token_hash, expira_en, creado_en FROM portal_tokens WHERE estudiante_id = $1', [s.estId]);
  assert.match(guardado.token_hash, /^[a-f0-9]{64}$/);
  assert.notEqual(guardado.token_hash, token);
  const dias = Math.round((guardado.expira_en - guardado.creado_en) / 86_400_000);
  assert.equal(dias, 30);
  const vista = await svc.portal.vista(token, { bcvSvc: bcvFalso });
  assert.equal(vista.estudiante, 'Portal Token');
  assert.equal(vista.cuotas[0].monto_bs, 912.5);
  assert.equal(vista.cuotas[0].fecha_vencimiento, sumarDias(svc.hoy(), 3));
  assert.ok(vista.cuentas.length >= 1);
  const d = await svc.portal.declarar(token, { cuota_id: s.cuotaId, referencia: 'portal-ref-77', metodo_pago: 'ZELLE' }, { bcvSvc: bcvFalso });
  assert.deepEqual([d.estado, d.monto_usd, d.monto_bs], ['Por Validar', 25, 912.5]);
  await assert.rejects(svc.portal.declarar(token, { cuota_id: s.cuotaId, referencia: 'otra-ref-78', metodo_pago: 'ZELLE' }, { bcvSvc: bcvFalso }), (e) => e.codigo === 'CUOTA_NO_PAGABLE');
  await assert.rejects(svc.portal.vista('f'.repeat(48), { bcvSvc: bcvFalso }), (e) => e.status === 404);
  await assert.rejects(svc.portal.vista('no-es-un-token'), (e) => e.status === 404);
  await db.ejecutar(`UPDATE portal_tokens SET expira_en = NOW() - INTERVAL '1 minute' WHERE estudiante_id = $1`, [s.estId]);
  await assert.rejects(svc.portal.vista(token, { bcvSvc: bcvFalso }), (e) => e.status === 404, 'token vencido');
});

// ── Notificaciones WhatsApp ─────────────────────────────────────────────────────────────────────
t('notificaciones: preventiva (cuota a 4 días) y morosidad se registran con tasa fresca, link único y estado ENVIADA/FALLIDA', async () => {
  const wa = (falla) => ({ enviados: [], enviarTexto: async function enviar(to, txt) { if (falla) throw falla; this.enviados.push({ to, txt }); } });
  const fresca = { obtenerTasa: async (o) => { assert.deepEqual(o, { fresca: true }); return { tasa: 36.5123, capturadaEn: new Date(), desactualizada: false }; } };
  const prev = await sembrar({ vence: sumarDias(svc.hoy(), 4), nombres: 'Preventiva', apellidos: 'Cuatro' });
  const w = wa();
  const r = await svc.notif.generarAlerta({ tipo: 'PREVENTIVA', estudianteId: prev.estId, enviar: true, usuarioId: (await uno('SELECT id FROM usuarios_admin LIMIT 1')).id }, { bcvSvc: fresca, waSvc: w });
  assert.deepEqual([r.estado, r.monto_usd, r.monto_bs], ['ENVIADA', 25, 912.81]);
  assert.equal(w.enviados.length, 1);
  const n = await uno('SELECT tipo, estado, cuota_id, tasa_bcv, creado_por FROM notificaciones_whatsapp WHERE id = $1', [r.notificacion_id]);
  assert.deepEqual([n.tipo, n.estado, n.cuota_id, n.tasa_bcv], ['PREVENTIVA', 'ENVIADA', prev.cuotaId, 36.5123]);
  assert.ok(n.creado_por > 0);
  assert.equal((await uno('SELECT COUNT(*)::int AS n FROM portal_tokens WHERE estudiante_id = $1', [prev.estId])).n, 1);

  const mor = await sembrar({ vence: sumarDias(svc.hoy(), -6), monto: 30, nombres: 'Morosa', apellidos: 'Seis' });
  const fallo = new (require('../errors/AppError').AppError)(502, 'WHATSAPP_ENVIO_FALLIDO', 'Meta rechazó', { motivo: 'Meta 131047' });
  await assert.rejects(svc.notif.generarAlerta({ tipo: 'MOROSIDAD', estudianteId: mor.estId, enviar: true }, { bcvSvc: fresca, waSvc: wa(fallo) }), (e) => e.status === 502);
  const f = await uno(`SELECT estado, error, monto_usd FROM notificaciones_whatsapp WHERE estudiante_id = $1`, [mor.estId]);
  assert.deepEqual([f.estado, f.error, f.monto_usd], ['FALLIDA', 'Meta 131047', 30]);

  const gen = await svc.notif.generarAlerta({ tipo: 'MOROSIDAD', estudianteId: mor.estId }, { bcvSvc: fresca, waSvc: wa() });
  assert.equal(gen.estado, 'GENERADA');
  assert.match(gen.mensaje, /vencida desde hace 6 días/);
  await assert.rejects(svc.notif.generarAlerta({ tipo: 'PREVENTIVA', estudianteId: mor.estId }, { bcvSvc: fresca, waSvc: wa() }), (e) => e.codigo === 'ESTADO_NO_APLICA');
  await assert.rejects(svc.notif.generarAlerta({ tipo: 'PREVENTIVA', estudianteId: (await sembrar({ vence: sumarDias(svc.hoy(), 9) })).estId }, { bcvSvc: fresca, waSvc: wa() }), (e) => e.codigo === 'FUERA_DE_VENTANA_PREVENTIVA');
  const h = await svc.notif.historial({ estudianteId: mor.estId, offset: 0, limite: 10 });
  assert.deepEqual([h.total, h.items.length], [2, 2]);
  assert.equal((await svc.notif.historial({ offset: 0, limite: 100 })).total, 3);
});

// ── Contabilidad ────────────────────────────────────────────────────────────────────────────────
const personalBase = { nombres: 'Carlos', apellidos: 'Ruiz', cedula: 'v-5555555', email: null, telefono: null, cargo: 'Docente de Matemática', tipo: 'Docente', modalidad_pago: 'Fijo', salario_fijo_usd: 400, tarifa_hora_usd: 0, fecha_ingreso: '2024-09-01' };

t('personal: CRUD, cédula en mayúsculas única, coherencia de modalidad y filtro de activos', async () => {
  const fijo = await svc.conta.crearPersonal(personalBase);
  assert.equal((await svc.conta.obtenerPersonal(fijo.id)).cedula, 'V-5555555');
  assert.equal((await svc.conta.obtenerPersonal(fijo.id)).fecha_ingreso, '2024-09-01');
  const dup = await svc.conta.crearPersonal({ ...personalBase, cedula: 'V-5555555' }).catch((e) => e);
  assert.deepEqual([svc.normalizar(dup).status, svc.normalizar(dup).codigo], [409, 'CEDULA_DUPLICADA']);
  await assert.rejects(svc.conta.crearPersonal({ ...personalBase, cedula: 'V-1', modalidad_pago: 'Mixto' }), (e) => e.codigo === 'MODALIDAD_INCOHERENTE');
  const hon = await svc.conta.crearPersonal({ ...personalBase, nombres: 'Elena', apellidos: 'Díaz', cedula: 'V-6666666', modalidad_pago: 'Honorarios', salario_fijo_usd: 0, tarifa_hora_usd: 12.5, fecha_ingreso: null });
  await svc.conta.crearPersonal({ ...personalBase, nombres: 'Mario', apellidos: 'Soto', cedula: 'V-7777777', modalidad_pago: 'Mixto', salario_fijo_usd: 100, tarifa_hora_usd: 10 });
  await svc.conta.actualizarPersonal(fijo.id, { ...personalBase, salario_fijo_usd: 450 });
  assert.equal((await svc.conta.obtenerPersonal(fijo.id)).salario_fijo_usd, 450);
  await assert.rejects(svc.conta.actualizarPersonal(987654, personalBase), (e) => e.status === 404);
  await svc.conta.cambiarActivo(hon.id, false);
  assert.equal((await svc.conta.listarPersonal({ soloActivos: true, offset: 0, limite: 50 })).total, 2);
  assert.equal((await svc.conta.listarPersonal({ soloActivos: false, offset: 0, limite: 50 })).total, 3);
  await assert.rejects(svc.conta.registrarHoras({ personal_id: hon.id, fecha: svc.hoy(), horas: 2, descripcion: null }), (e) => e.codigo === 'PERSONAL_INACTIVO');
  await svc.conta.cambiarActivo(hon.id, true);
});

t('horas, nómina (upsert atómico), pago con egreso en una transacción y balance', async () => {
  const periodo = svc.periodo();
  const pers = await filas('SELECT id, modalidad_pago FROM personal ORDER BY id');
  const id = Object.fromEntries(pers.map((p) => [p.modalidad_pago, p.id]));
  await svc.conta.registrarHoras({ personal_id: id.Honorarios, fecha: `${periodo}-01`, horas: 3.5, descripcion: 'Álgebra' });
  await svc.conta.registrarHoras({ personal_id: id.Honorarios, fecha: `${periodo}-02`, horas: 4, descripcion: null });
  await svc.conta.registrarHoras({ personal_id: id.Mixto, fecha: `${periodo}-02`, horas: 10, descripcion: null });
  await svc.conta.registrarHoras({ personal_id: id.Honorarios, fecha: '2020-01-15', horas: 8, descripcion: 'fuera del período' });
  const lh = await svc.conta.listarHoras({ personalId: id.Honorarios, periodo, offset: 0, limite: 10 });
  assert.equal(lh.total, 2);
  assert.equal(lh.items[0].personal, 'Elena Díaz');
  assert.equal((await svc.conta.listarHoras({ offset: 0, limite: 50 })).total, 4);

  const c1 = await svc.conta.calcularNominaPeriodo(periodo);
  assert.deepEqual(c1, { periodo, calculadas: 3, ya_pagadas_sin_cambios: 0 });
  const c2 = await svc.conta.calcularNominaPeriodo(periodo); // idempotente: recalcula sin duplicar
  assert.deepEqual(c2, { periodo, calculadas: 3, ya_pagadas_sin_cambios: 0 });
  const nomina = await svc.conta.listarNomina({ periodo, offset: 0, limite: 10 });
  assert.equal(nomina.total, 3);
  const por = Object.fromEntries(nomina.items.map((n) => [n.modalidad_pago, n]));
  assert.deepEqual([por.Fijo.total_usd, por.Honorarios.total_usd, por.Honorarios.horas_totales, por.Mixto.total_usd], [450, 93.75, 7.5, 200]);
  assert.equal(nomina.total_usd, 743.75);

  const pagado = await svc.conta.pagarNomina({ id: por.Fijo.id });
  assert.deepEqual([pagado.estado, pagado.total_usd], ['Pagada', 450]);
  const eg = await uno('SELECT categoria, descripcion, monto_usd, nomina_pago_id, fecha FROM egresos WHERE nomina_pago_id = $1', [por.Fijo.id]);
  assert.deepEqual([eg.categoria, eg.monto_usd, eg.fecha, eg.descripcion], ['Nómina', 450, svc.hoy(), `Nómina ${periodo} · Carlos Ruiz`]);
  await assert.rejects(svc.conta.pagarNomina({ id: por.Fijo.id }), (e) => e.codigo === 'NOMINA_YA_PAGADA');
  await assert.rejects(svc.conta.pagarNomina({ id: 987654 }), (e) => e.status === 404);
  // recalcular con una nómina ya pagada: no se toca
  await svc.conta.actualizarPersonal(por.Fijo.personal_id, { ...personalBase, salario_fijo_usd: 999 });
  const c3 = await svc.conta.calcularNominaPeriodo(periodo);
  assert.deepEqual(c3, { periodo, calculadas: 2, ya_pagadas_sin_cambios: 1 });
  assert.equal((await uno('SELECT total_usd FROM nomina_pagos WHERE id = $1', [por.Fijo.id])).total_usd, 450);

  // honorarios sin horas → total 0 → la transacción se revierte y la nómina sigue "Calculada"
  await db.ejecutar(`DELETE FROM horas_clase WHERE personal_id = $1`, [id.Honorarios]);
  await svc.conta.calcularNominaPeriodo(periodo);
  const cero = await uno('SELECT id, total_usd FROM nomina_pagos WHERE personal_id = $1 AND periodo = $2', [id.Honorarios, periodo]);
  assert.equal(cero.total_usd, 0);
  await assert.rejects(svc.conta.pagarNomina({ id: cero.id }), (e) => e.codigo === 'NOMINA_EN_CERO');
  assert.equal((await uno('SELECT estado FROM nomina_pagos WHERE id = $1', [cero.id])).estado, 'Calculada', 'rollback del UPDATE');

  // un mismo egreso por nómina: el índice único lo impide a nivel de base de datos
  const dupEg = await db.ejecutar(`INSERT INTO egresos (fecha, categoria, descripcion, monto_usd, nomina_pago_id) VALUES ($1, 'Nómina', 'x', 1, $2)`, [svc.hoy(), por.Fijo.id]).catch((e) => e);
  assert.equal(svc.normalizar(dupEg).codigo, 'EGRESO_NOMINA_DUPLICADO');
});

t('egresos y balance del período: ingresos (aprobados en hora de Caracas) − egresos, con filtros de fecha opcionales', async () => {
  const periodo = svc.periodo();
  await svc.conta.crearEgreso({ fecha: svc.hoy(), categoria: 'Servicios', descripcion: 'Internet', monto_usd: 35.25, referencia: null });
  const lista = await svc.conta.listarEgresos({ periodo, offset: 0, limite: 10 });
  assert.equal(lista.total, 2);
  assert.equal(lista.total_usd, 485.25);
  assert.equal(lista.items[0].fecha, svc.hoy());
  assert.equal((await svc.conta.listarEgresos({ offset: 0, limite: 10 })).total, 2);
  assert.equal((await svc.conta.listarEgresos({ periodo: '2019-01', offset: 0, limite: 10 })).total, 0);
  const b = await svc.conta.balance(periodo);
  const ingresos = (await uno(`SELECT COALESCE(SUM(monto_usd), 0) AS s FROM pagos_referencias WHERE estado = 'Aprobada'`)).s;
  assert.deepEqual([b.ingresos_usd, b.egresos_usd, b.neto_usd], [ingresos, 485.25, Math.round((ingresos - 485.25) * 100) / 100]);
  assert.equal((await svc.conta.balance('2019-01')).neto_usd, 0);
});

// ── Exportación a Excel (streaming con paginación keyset) ───────────────────────────────────────
t('exportación: cada hoja se lee por lotes con LIMIT/keyset sin perder ni duplicar filas (2 100 filas = 3 lotes)', async () => {
  const p = await uno('SELECT id FROM personal ORDER BY id LIMIT 1');
  await db.ejecutar(`INSERT INTO horas_clase (personal_id, fecha, horas) SELECT $1, DATE '2026-01-01' + (g % 300), 1 FROM generate_series(1, 2100) g`, [p.id]);
  const total = (await uno('SELECT COUNT(*)::int AS n FROM horas_clase')).n;
  const res = { cabeceras: {}, set(h) { Object.assign(this.cabeceras, h); return this; } };

  libros.length = 0;
  const conta = svc.exportacion.hojasContabilidad();
  await svc.exportacion.exportarLibro(res, conta.nombre, conta.hojas);
  const hojas = Object.fromEntries(libros[0].hojas.map((h) => [h.nombre, h.filas]));
  assert.deepEqual(Object.keys(hojas), ['Personal', 'Horas de clase', 'Nómina', 'Egresos', 'Balance mensual']);
  assert.equal(hojas['Horas de clase'].length, total);
  assert.equal(new Set(hojas['Horas de clase'].map((f) => f.id)).size, total, 'sin duplicados entre lotes');
  assert.equal(hojas.Personal.length, 3);
  assert.equal(hojas.Personal[0].activo === 'Sí' || hojas.Personal[0].activo === 'No', true);
  assert.equal(hojas['Nómina'].length, 3);
  assert.ok(hojas.Egresos.length === 2 && /^\d{4}-\d{2}-\d{2}$/.test(hojas.Egresos[0].fecha));
  const bal = hojas['Balance mensual'];
  assert.ok(bal.length >= 1 && /^\d{4}-\d{2}$/.test(bal[0].periodo));
  assert.ok(bal.every((f) => Math.abs(f.neto_usd - (f.ingresos_usd - f.egresos_usd)) < 0.005));
  assert.equal(res.cabeceras['Content-Type'], svc.exportacion.MIME_XLSX);

  libros.length = 0;
  const fact = svc.exportacion.hojasFacturacion();
  await svc.exportacion.exportarLibro(res, fact.nombre, fact.hojas);
  const hf = Object.fromEntries(libros[0].hojas.map((h) => [h.nombre, h.filas]));
  assert.equal(hf.Cuotas.length, (await uno('SELECT COUNT(*)::int AS n FROM cuotas')).n);
  assert.equal(hf['Pagos y referencias'].length, (await uno('SELECT COUNT(*)::int AS n FROM pagos_referencias')).n);
  assert.ok(hf['Pagos y referencias'][0].declarado_en instanceof Date);
});

// ── Candados premium ────────────────────────────────────────────────────────────────────────────
t('premium: 7 módulos sembrados y deshabilitados; el guard bloquea con 403 y se abre al habilitar', async () => {
  const todos = await svc.guard.guard.repo.leerTodos();
  assert.deepEqual(todos.map((m) => [m.codigo, m.precio_usd, m.habilitado]), [
    ['FACTURACION_MASIVA', 20, false], ['MULTI_SEDE_PREMIUM', 50, false], ['WHATSAPP_AUTOMATICO', 150, false], ['IA_ATENCION', 200, false],
    ['BANCAMIGA', 300, false], ['APP_MOVIL', 450, false], ['FACHADA_WEB', 550, false]]);
  let resultado;
  const g = svc.guard.crearGuard({ ttlMs: 0 });
  await g.requireModulo('BANCAMIGA')({}, {}, (e) => { resultado = e; });
  assert.deepEqual([resultado.status, resultado.codigo, resultado.detalles.precio_usd], [403, 'MODULO_PREMIUM_DESHABILITADO', 300]);
  await db.ejecutar(`UPDATE modulos_premium SET habilitado = TRUE, habilitado_en = NOW(), actualizado_en = NOW() WHERE codigo = 'BANCAMIGA'`);
  await g.requireModulo('BANCAMIGA')({}, {}, (e) => { resultado = e; });
  assert.equal(resultado, undefined);
  await db.ejecutar(`UPDATE modulos_premium SET habilitado = FALSE WHERE codigo = 'BANCAMIGA'`);
});

// ── Límite de sedes del Core Base (migración 008) ──────────────────────────────────────────────
// Se ejecuta ANTES del resto de pruebas multi-sede, cuando aún no hay sedes: crea y borra sus propias filas (prefijo T008-).
const limpiarT008 = async () => {
  await db.ejecutar(`DELETE FROM sedes WHERE nombre LIKE 'T008-%'`);
  await db.ejecutar(`UPDATE modulos_premium SET habilitado = FALSE, habilitado_en = NULL, prueba_iniciada_en = NULL, expira_prueba_en = NULL, actualizado_en = NOW() WHERE codigo = 'MULTI_SEDE_PREMIUM'`);
};

t('008: los módulos MULTI_SEDE_PREMIUM (US$ 50) y FACTURACION_MASIVA (US$ 20) existen deshabilitados y la migración no pisa su estado', async () => {
  const m = await filas(`SELECT codigo, nombre, precio_usd, habilitado FROM modulos_premium WHERE codigo IN ('MULTI_SEDE_PREMIUM', 'FACTURACION_MASIVA') ORDER BY codigo`);
  assert.deepEqual(m.map((x) => [x.codigo, x.nombre, x.precio_usd, x.habilitado]), [
    ['FACTURACION_MASIVA', 'Módulo de Facturación Masiva Automatizada', 20, false],
    ['MULTI_SEDE_PREMIUM', 'Expansión Multi-Sede Avanzada (3+ Sedes)', 50, false]]);
  // re-ejecutar 008 con el módulo ya contratado y un precio negociado: DO NOTHING no toca nada
  await db.ejecutar(`UPDATE modulos_premium SET habilitado = TRUE, precio_usd = 45 WHERE codigo = 'FACTURACION_MASIVA'`);
  await db.ejecutarScript(fs.readFileSync(path.join(RAIZ, 'database', 'migrations', '008_nuevos_premium.sql'), 'utf8'));
  const f = await uno(`SELECT habilitado, precio_usd FROM modulos_premium WHERE codigo = 'FACTURACION_MASIVA'`);
  assert.deepEqual([f.habilitado, f.precio_usd], [true, 45]);
  await db.ejecutar(`UPDATE modulos_premium SET habilitado = FALSE, precio_usd = 20 WHERE codigo = 'FACTURACION_MASIVA'`);
});

t('008: la 3ª sede se bloquea con 403 MODULO_PREMIUM_DESHABILITADO (servicio y trigger) y se permite con el módulo habilitado o en prueba vigente', async () => {
  assert.equal((await uno('SELECT COUNT(*)::int AS n FROM sedes')).n, 0, 'precondición: sin sedes todavía');
  try {
    await svc.sedes.crear({ nombre: 'T008-A' });
    await svc.sedes.crear({ nombre: 'T008-B' });
    // 3ª por el servicio → 403 con el precio del módulo
    await assert.rejects(svc.sedes.crear({ nombre: 'T008-C' }), (e) => e.status === 403 && e.codigo === 'MODULO_PREMIUM_DESHABILITADO'
      && e.detalles.modulo === 'MULTI_SEDE_PREMIUM' && e.detalles.precio_usd === 50 && e.detalles.limite_sedes_base === 2);
    // 3ª por SQL directo (cualquier camino que no pase por el servicio): SQLSTATE propio, traducido a 403 por el manejador de errores
    const directo = await db.ejecutar(`INSERT INTO sedes (nombre) VALUES ($1)`, ['T008-C']).catch((e) => e);
    assert.equal(directo.code, 'BM403');
    const http = svc.normalizar(directo);
    assert.deepEqual([http.status, http.codigo, http.detalles.modulo, http.detalles.precio_usd], [403, 'MODULO_PREMIUM_DESHABILITADO', 'MULTI_SEDE_PREMIUM', 50]);
    // INSERT multi-fila: cada fila ve a las anteriores de su propia sentencia (nada se inserta si alguna excede el cupo)
    const multi = await db.ejecutar(`INSERT INTO sedes (nombre) VALUES ($1), ($2)`, ['T008-M1', 'T008-M2']).catch((e) => e);
    assert.equal(multi.code, 'BM403');
    assert.equal((await uno('SELECT COUNT(*)::int AS n FROM sedes')).n, 2);
    // un nombre repetido sigue siendo 409 SEDE_DUPLICADA (no se disfraza de módulo deshabilitado), también con ON CONFLICT DO NOTHING a pelo
    await assert.rejects(svc.sedes.crear({ nombre: 'T008-A' }), (e) => e.status === 409 && e.codigo === 'SEDE_DUPLICADA');
    assert.equal((await db.ejecutar(`INSERT INTO sedes (nombre) VALUES ($1) ON CONFLICT (nombre) DO NOTHING`, ['T008-A'])).rowCount, 0);
    // la tabla sigue admitiendo UPDATE (activar/desactivar) con el cupo lleno
    assert.equal((await svc.sedes.cambiarActiva((await uno(`SELECT id FROM sedes WHERE nombre = 'T008-A'`)).id, false)).activa, false);

    // módulo contratado → la 3ª y la 4ª sí
    await db.ejecutar(`UPDATE modulos_premium SET habilitado = TRUE, habilitado_en = NOW(), actualizado_en = NOW() WHERE codigo = 'MULTI_SEDE_PREMIUM'`);
    await svc.sedes.crear({ nombre: 'T008-C' });
    await db.ejecutar(`INSERT INTO sedes (nombre) VALUES ($1)`, ['T008-D']);

    // prueba vigente → permite; prueba vencida (aunque habilitado siga en TRUE) → bloquea con el reloj de la base
    await db.ejecutar(`UPDATE modulos_premium SET expira_prueba_en = NOW() + INTERVAL '3 days' WHERE codigo = 'MULTI_SEDE_PREMIUM'`);
    await svc.sedes.crear({ nombre: 'T008-E' });
    await db.ejecutar(`UPDATE modulos_premium SET expira_prueba_en = NOW() - INTERVAL '1 minute' WHERE codigo = 'MULTI_SEDE_PREMIUM'`);
    await assert.rejects(svc.sedes.crear({ nombre: 'T008-F' }), (e) => e.status === 403 && e.codigo === 'MODULO_PREMIUM_DESHABILITADO');
    assert.equal((await db.ejecutar(`INSERT INTO sedes (nombre) VALUES ($1)`, ['T008-F']).catch((e) => e)).code, 'BM403');
  } finally {
    await limpiarT008();
  }
});

t('008: altas concurrentes de sedes — el trigger serializa y solo 2 caben en el Core Base', async () => {
  try {
    assert.equal((await uno('SELECT COUNT(*)::int AS n FROM sedes')).n, 0);
    const r = await Promise.allSettled(['T008-X', 'T008-Y', 'T008-Z', 'T008-W'].map((nombre) => svc.sedes.crear({ nombre })));
    assert.equal(r.filter((x) => x.status === 'fulfilled').length, 2);
    const rechazos = r.filter((x) => x.status === 'rejected').map((x) => svc.normalizar(x.reason));
    assert.equal(rechazos.length, 2);
    assert.ok(rechazos.every((x) => x.status === 403 && x.codigo === 'MODULO_PREMIUM_DESHABILITADO'), JSON.stringify(rechazos));
    assert.equal((await uno('SELECT COUNT(*)::int AS n FROM sedes')).n, 2);
  } finally {
    await limpiarT008();
  }
});

t('008: FACTURACION_MASIVA protege la generación masiva — 403 sin módulo, pasa con módulo habilitado', async () => {
  const g = svc.guard.crearGuard({ ttlMs: 0 });
  let resultado;
  await g.requireModulo('FACTURACION_MASIVA')({}, {}, (e) => { resultado = e; });
  assert.deepEqual([resultado.status, resultado.codigo, resultado.detalles.precio_usd], [403, 'MODULO_PREMIUM_DESHABILITADO', 20]);
  await db.ejecutar(`UPDATE modulos_premium SET habilitado = TRUE, habilitado_en = NOW(), actualizado_en = NOW() WHERE codigo = 'FACTURACION_MASIVA'`);
  try {
    resultado = 'sin-next';
    await g.requireModulo('FACTURACION_MASIVA')({}, {}, (e) => { resultado = e; });
    assert.equal(resultado, undefined);
  } finally {
    await db.ejecutar(`UPDATE modulos_premium SET habilitado = FALSE, habilitado_en = NULL, actualizado_en = NOW() WHERE codigo = 'FACTURACION_MASIVA'`);
  }
});

// ── Multi-sede ──────────────────────────────────────────────────────────────────────────────────
let sedeA; let sedeB;
const usuarioAdminId = async () => (await uno('SELECT id FROM usuarios_admin ORDER BY id LIMIT 1')).id;

t('multi-sede: alcanceDe es FAIL-CLOSED (secretaria sin sede ≠ global) y solo el admin sin sede es consolidado', () => {
  const { alcanceDe } = svc.alcance;
  assert.equal(alcanceDe({ rol: 'admin', sede_id: null }), null);
  assert.equal(alcanceDe({ rol: 'admin', sede_id: 3 }), 3);
  assert.equal(alcanceDe({ rol: 'secretaria', sede_id: 7 }), 7);
  for (const u of [{ rol: 'secretaria', sede_id: null }, { rol: 'secretaria' }]) {
    assert.throws(() => alcanceDe(u), (e) => e.status === 403 && e.codigo === 'SEDE_NO_ASIGNADA');
  }
  assert.throws(() => alcanceDe({ rol: 'admin', sede_id: 'x' }), (e) => e.status === 403);
  assert.throws(() => alcanceDe(undefined), (e) => e.status === 401);
  const out = {};
  svc.alcance.requireConsolidado({ usuario: { rol: 'admin', sede_id: 2 } }, {}, (e) => { out.sede = e; });
  svc.alcance.requireConsolidado({ usuario: { rol: 'admin', sede_id: null } }, {}, (e) => { out.global = e; });
  assert.equal(out.sede.status, 403);
  assert.equal(out.global, undefined);
});

t('multi-sede: sedes (nombre único → 409) y el trigger hace que cuotas y pagos HEREDEN la sede del estudiante', async () => {
  sedeA = (await svc.sedes.crear({ nombre: 'Sede Norte' })).id;
  sedeB = (await svc.sedes.crear({ nombre: 'Sede Sur' })).id;
  await assert.rejects(svc.sedes.crear({ nombre: 'Sede Norte' }), (e) => e.status === 409 && e.codigo === 'SEDE_DUPLICADA');
  assert.deepEqual((await svc.sedes.listar(sedeA)).map((s) => s.nombre), ['Sede Norte']);
  assert.ok((await svc.sedes.listar(null)).length >= 2);

  const a = await sembrar({ sedeId: sedeA, nombres: 'AlumnoA' });
  assert.equal((await uno('SELECT sede_id FROM cuotas WHERE id = $1', [a.cuotaId])).sede_id, sedeA);
  const p = await svc.pagos.declararReferencia({ estudianteId: a.estId, cuotaId: a.cuotaId, referencia: 'HER-1', metodo: 'ZELLE', tasa: 36.5 });
  assert.equal((await uno('SELECT sede_id FROM pagos_referencias WHERE id = $1', [p.pagoId])).sede_id, sedeA);
  // una sede explícita no la pisa el trigger
  const e2 = await uno(`INSERT INTO cuotas (estudiante_id, tipo, concepto, monto_usd, fecha_vencimiento, sede_id) VALUES ($1, 'OTRO', 'Explícita', 5, $2, $3) RETURNING sede_id`, [a.estId, svc.hoy(), sedeB]);
  assert.equal(e2.sede_id, sedeB);
  // estudiante sin sede → cuota sin sede (dato "global")
  const g = await sembrar({ nombres: 'SinSede' });
  assert.equal((await uno('SELECT sede_id FROM cuotas WHERE id = $1', [g.cuotaId])).sede_id, null);
});

t('multi-sede: CRM, tablero, cuotas y mensualidades se filtran por sede; sede NULL (SuperAdmin) ve todo; fuera de sede = 404', async () => {
  const hoy = svc.hoy();
  const a = await sembrar({ sedeId: sedeA, nombres: 'IsoA', apellidos: 'Norte', vence: sumarDias(hoy, -5) });
  const b = await sembrar({ sedeId: sedeB, nombres: 'IsoB', apellidos: 'Sur', vence: sumarDias(hoy, -5) });
  const g = await sembrar({ nombres: 'IsoG', apellidos: 'Global', vence: sumarDias(hoy, -5) });
  const c = await sembrar({ sedeId: sedeB, nombres: 'IsoC', apellidos: 'Sur' });

  const nombresDe = async (sedeId) => (await svc.crm.listar({ q: 'Iso', offset: 0, limite: 50, sedeId })).items.map((x) => x.nombres).sort();
  assert.deepEqual(await nombresDe(sedeA), ['IsoA']);
  assert.deepEqual(await nombresDe(sedeB), ['IsoB', 'IsoC']);
  assert.deepEqual(await nombresDe(null), ['IsoA', 'IsoB', 'IsoC', 'IsoG']);
  assert.equal((await svc.crm.listar({ q: 'Iso', offset: 0, limite: 50, sedeId: sedeA })).total, 1, 'el conteo respeta la sede');

  assert.equal((await svc.crm.resumen(sedeA)).morosos, 1);
  assert.equal((await svc.crm.resumen(sedeB)).morosos, 1);
  assert.ok((await svc.crm.resumen(null)).morosos >= 3);

  await assert.rejects(svc.crm.detalle(b.estId, sedeA), (e) => e.status === 404);
  await assert.rejects(svc.crm.detalle(g.estId, sedeA), (e) => e.status === 404, 'un dato sin sede NO lo ve un usuario de sede');
  assert.equal((await svc.crm.detalle(b.estId, sedeB)).nombres, 'IsoB');
  assert.equal((await svc.crm.detalle(g.estId, null)).nombres, 'IsoG');

  await assert.rejects(svc.crm.retirar({ id: c.estId, sedeId: sedeA }), (e) => e.status === 404);
  assert.equal((await uno('SELECT estatus_academico FROM estudiantes WHERE id = $1', [c.estId])).estatus_academico, 'Activo');
  assert.equal((await svc.crm.retirar({ id: c.estId, sedeId: sedeB })).estatus_academico, 'Fuera de la Academia');
  await assert.rejects(svc.crm.reactivar({ id: c.estId, sedeId: sedeA }), (e) => e.status === 409);
  assert.equal((await svc.crm.reactivar({ id: c.estId, sedeId: sedeB })).estatus_academico, 'Activo');

  const periodo = svc.periodo();
  assert.equal((await svc.facturacion.tablero(periodo, sedeA)).saldos_vencidos.cantidad, 1);
  assert.equal((await svc.facturacion.tablero(periodo, sedeB)).saldos_vencidos.cantidad, 1);
  assert.ok((await svc.facturacion.tablero(periodo, null)).saldos_vencidos.cantidad >= 3);

  const cuotasA = await svc.facturacion.listarCuotas({ sedeId: sedeA, offset: 0, limite: 100 });
  assert.ok(cuotasA.items.length >= 2 && cuotasA.items.every((x) => ['AlumnoA', 'IsoA'].includes(x.estudiante.split(' ')[0])));

  await assert.rejects(svc.facturacion.crearCuota({ estudiante_id: b.estId, tipo: 'OTRO', concepto: 'x', monto_usd: 5, fecha_vencimiento: hoy }, sedeA), (e) => e.status === 404);
  const nueva = await svc.facturacion.crearCuota({ estudiante_id: b.estId, tipo: 'OTRO', concepto: 'Cuota B', monto_usd: 5, fecha_vencimiento: hoy }, sedeB);
  assert.equal((await uno('SELECT sede_id FROM cuotas WHERE id = $1', [nueva.id])).sede_id, sedeB);

  const activosA = (await uno(`SELECT COUNT(*)::int AS n FROM estudiantes WHERE sede_id = $1 AND estatus_academico = 'Activo'`, [sedeA])).n;
  const gen = await svc.facturacion.generarMensualidades({ concepto: 'Mens-ISO', monto_usd: 10, fecha_vencimiento: hoy }, sedeA);
  assert.equal(gen.creadas, activosA);
  assert.deepEqual((await filas(`SELECT DISTINCT sede_id FROM cuotas WHERE concepto = 'Mens-ISO'`)), [{ sede_id: sedeA }]);

  // notificaciones: un estudiante de otra sede es inexistente (404, antes de consultar tasa BCV ni enviar nada)
  await assert.rejects(svc.notif.generarAlerta({ tipo: 'MOROSIDAD', estudianteId: b.estId, sedeId: sedeA }, { bcvSvc: bcvFalso, waSvc: { enviarTexto: async () => { throw new Error('no debía enviar'); } } }), (e) => e.status === 404);
});

t('multi-sede: auditoría de pagos (bandeja, aprobar, rechazar) y egresos/balance respetan la sede', async () => {
  const usuarioId = await usuarioAdminId();
  const b = await sembrar({ sedeId: sedeB, nombres: 'PagoB', apellidos: 'Sur' });
  const pago = await svc.pagos.declararReferencia({ estudianteId: b.estId, cuotaId: b.cuotaId, referencia: 'ISO-B-1', metodo: 'ZELLE', tasa: 36.5 });
  const ids = async (sedeId) => (await svc.pagos.bandeja({ estado: 'Por Validar', offset: 0, limite: 100, sedeId })).items.map((x) => x.id);
  assert.ok(!(await ids(sedeA)).includes(pago.pagoId));
  assert.ok((await ids(sedeB)).includes(pago.pagoId));
  assert.ok((await ids(null)).includes(pago.pagoId));
  await assert.rejects(svc.pagos.aprobar({ pagoId: pago.pagoId, usuarioId, sedeId: sedeA }), (e) => e.status === 404);
  await assert.rejects(svc.pagos.rechazar({ pagoId: pago.pagoId, usuarioId, nota: 'x', sedeId: sedeA }), (e) => e.status === 404);
  assert.equal((await uno('SELECT estado FROM pagos_referencias WHERE id = $1', [pago.pagoId])).estado, 'Por Validar');
  assert.equal((await svc.pagos.aprobar({ pagoId: pago.pagoId, usuarioId, sedeId: sedeB })).pagoId, pago.pagoId);

  // el cobro aprobado cuenta en la sede B y no en la A
  const periodo = svc.periodo();
  assert.ok((await svc.facturacion.tablero(periodo, sedeB)).cobrado.monto_usd >= 25);
  assert.equal((await svc.facturacion.tablero(periodo, sedeA)).cobrado.monto_usd, 0);

  // egresos: un usuario de sede siempre registra en la suya (aunque mande otra); el consolidado elige la sede
  const hoy = svc.hoy();
  await svc.conta.crearEgreso({ fecha: hoy, categoria: 'IsoCat', descripcion: 'A', monto_usd: 12.5, referencia: null, sede_id: sedeB }, sedeA);
  await svc.conta.crearEgreso({ fecha: hoy, categoria: 'IsoCat', descripcion: 'B', monto_usd: 7.25, referencia: null, sede_id: sedeB }, null);
  assert.deepEqual((await filas(`SELECT descripcion, sede_id FROM egresos WHERE categoria = 'IsoCat' ORDER BY id`)), [{ descripcion: 'A', sede_id: sedeA }, { descripcion: 'B', sede_id: sedeB }]);
  assert.equal((await svc.conta.listarEgresos({ periodo, offset: 0, limite: 50, sedeId: sedeA })).total_usd, 12.5);
  assert.equal((await svc.conta.balance(periodo, sedeA)).egresos_usd, 12.5);
  assert.equal((await svc.conta.balance(periodo, sedeB)).egresos_usd, 7.25);
  assert.ok((await svc.conta.balance(periodo, null)).egresos_usd >= 19.75);
});

t('multi-sede: cuentas de cobro = comunes + las de la propia sede; sin sede solo las comunes (nunca las de otra sede)', async () => {
  await db.ejecutar(
    `INSERT INTO cuentas_pago (metodo, titular, detalle, sede_id) VALUES ('ZELLE', 'Común', 'comun@bma.example', NULL),
       ('PAYPAL', 'Norte', 'norte@bma.example', $1), ('BINANCE', 'Sur', 'sur@bma.example', $2)`, [sedeA, sedeB]);
  const titulares = async (sedeId) => (await svc.parametros.cuentasActivas(undefined, sedeId)).map((c) => c.titular);
  const a = await titulares(sedeA);
  assert.ok(a.includes('Común') && a.includes('Norte') && !a.includes('Sur'));
  const sin = await titulares(null);
  assert.ok(sin.includes('Común') && !sin.includes('Norte') && !sin.includes('Sur'));
});

// ── Invitaciones de inscripción ─────────────────────────────────────────────────────────────────
t('invitaciones: token hasheado y de un solo uso; el SERVIDOR impone nivel y sede (el grado del cliente se descarta)', async () => {
  await svc.parametros.guardar('MATRICULA_USD', '100.00');
  const inv = await svc.invitaciones.crear({ sedeId: sedeA, nivel: '5to grado', creadoPor: await usuarioAdminId() });
  assert.match(inv.token, /^[a-f0-9]{48}$/);
  assert.match(inv.enlace, /\/admisiones\/\?invitacion=[a-f0-9]{48}$/);
  const fila = await uno('SELECT token_hash, estado FROM invitaciones_inscripcion WHERE id = $1', [inv.id]);
  assert.match(fila.token_hash, /^[a-f0-9]{64}$/);
  assert.notEqual(fila.token_hash, inv.token);
  assert.equal(fila.estado, 'Pendiente');

  const cfgInv = await svc.admisiones.configInvitacion(inv.token, { bcvSvc: bcvFalso });
  assert.deepEqual(cfgInv.sede, { id: sedeA, nombre: 'Sede Norte' });
  assert.equal(cfgInv.nivel_asignado, '5to grado');
  assert.equal(cfgInv.matricula_usd, 100);
  const titulares = cfgInv.cuentas.map((c) => c.titular);
  assert.ok(titulares.includes('Norte') && titulares.includes('Común') && !titulares.includes('Sur'));

  const resuelta = await svc.invitaciones.resolver(inv.token);
  const drive = driveFalso();
  const r = await svc.admisiones.registrarInscripcion(
    { datos: inscripcion({ alumno_nombres: 'Invitado', referencia_bancaria: 'INV-0001', representante_cedula: 'V-INV1', grado_solicitado: '1er grado (manipulado)' }), archivos, invitacion: resuelta },
    { bcvSvc: bcvFalso, driveSvc: drive });
  assert.equal(r.grado_solicitado, '5to grado');
  assert.equal(r.sede_id, sedeA);
  assert.deepEqual(await uno('SELECT grado_solicitado, sede_id FROM estudiantes WHERE id = $1', [r.estudiante_id]), { grado_solicitado: '5to grado', sede_id: sedeA });
  assert.deepEqual(await uno('SELECT sede_id FROM cuotas WHERE estudiante_id = $1', [r.estudiante_id]), { sede_id: sedeA });
  assert.deepEqual(await uno('SELECT sede_id FROM pagos_referencias WHERE estudiante_id = $1', [r.estudiante_id]), { sede_id: sedeA });
  const usada = await uno('SELECT estado, estudiante_id, usada_en IS NOT NULL AS tiene_fecha FROM invitaciones_inscripcion WHERE id = $1', [inv.id]);
  assert.deepEqual(usada, { estado: 'Usada', estudiante_id: r.estudiante_id, tiene_fecha: true });

  // reutilizar el enlace: 410 (tanto al resolverlo como con el objeto ya resuelto) y sin tocar Drive
  await assert.rejects(svc.invitaciones.resolver(inv.token), (e) => e.status === 410 && e.codigo === 'INVITACION_NO_VALIDA');
  const drive2 = driveFalso();
  await assert.rejects(
    svc.admisiones.registrarInscripcion({ datos: inscripcion({ alumno_nombres: 'Otro', referencia_bancaria: 'INV-0002', representante_cedula: 'V-INV2' }), archivos, invitacion: resuelta }, { bcvSvc: bcvFalso, driveSvc: drive2 }),
    (e) => e.status === 410);
  assert.equal(drive2.subidas.length, 0);
  assert.equal((await filas(`SELECT 1 FROM estudiantes WHERE nombres = 'Otro'`)).length, 0);
});

t('invitaciones: si la inscripción falla (Drive) se revierte y el enlace sigue Pendiente; dos envíos simultáneos → una sola inscripción', async () => {
  const inv = await svc.invitaciones.crear({ sedeId: sedeA, nivel: '2do grado' });
  const resuelta = await svc.invitaciones.resolver(inv.token);
  await assert.rejects(
    svc.admisiones.registrarInscripcion({ datos: inscripcion({ alumno_nombres: 'Caido', referencia_bancaria: 'INV-CAIDO', representante_cedula: 'V-CAIDO' }), archivos, invitacion: resuelta }, { bcvSvc: bcvFalso, driveSvc: driveFalso('falla') }),
    (e) => e.status === 502);
  assert.equal((await uno('SELECT estado FROM invitaciones_inscripcion WHERE id = $1', [inv.id])).estado, 'Pendiente');

  const intento = (n) => svc.admisiones.registrarInscripcion(
    { datos: inscripcion({ alumno_nombres: `Carrera${n}`, referencia_bancaria: `CAR-000${n}`, representante_cedula: `V-CAR${n}` }), archivos, invitacion: resuelta },
    { bcvSvc: bcvFalso, driveSvc: driveFalso() }).then(() => 'ok', (e) => e.codigo);
  const resultados = (await Promise.all([intento(1), intento(2)])).sort();
  assert.deepEqual(resultados, ['INVITACION_NO_VALIDA', 'ok']);
  assert.equal((await uno(`SELECT COUNT(*)::int AS n FROM estudiantes WHERE nombres LIKE 'Carrera%'`)).n, 1);
});

t('invitaciones: revocada, vencida o de sede inactiva → 410; listado con estado efectivo; revocar fuera de sede → 404', async () => {
  const i1 = await svc.invitaciones.crear({ sedeId: sedeA, nivel: '1er grado' });
  assert.equal((await svc.invitaciones.revocar(i1.id, sedeA)).estado, 'Revocada');
  await assert.rejects(svc.invitaciones.resolver(i1.token), (e) => e.status === 410);
  await assert.rejects(svc.invitaciones.revocar(i1.id, sedeA), (e) => e.status === 409 && e.codigo === 'INVITACION_NO_REVOCABLE');

  const i2 = await svc.invitaciones.crear({ sedeId: sedeA, nivel: '1er grado' });
  await db.ejecutar(`UPDATE invitaciones_inscripcion SET expira_en = NOW() - INTERVAL '1 minute' WHERE id = $1`, [i2.id]);
  await assert.rejects(svc.invitaciones.resolver(i2.token), (e) => e.status === 410);
  const vencidas = await svc.invitaciones.listar({ sedeId: sedeA, estado: 'Vencida', offset: 0, limite: 50 });
  assert.ok(vencidas.items.some((x) => x.id === i2.id && x.estado === 'Vencida'));

  const i3 = await svc.invitaciones.crear({ sedeId: sedeB, nivel: '3er grado', dias: 3 });
  await assert.rejects(svc.invitaciones.revocar(i3.id, sedeA), (e) => e.status === 404);
  assert.ok(!(await svc.invitaciones.listar({ sedeId: sedeA, offset: 0, limite: 200 })).items.some((x) => x.id === i3.id));
  await svc.sedes.cambiarActiva(sedeB, false);
  await assert.rejects(svc.invitaciones.crear({ sedeId: sedeB, nivel: 'x' }), (e) => e.status === 422 && e.codigo === 'SEDE_INACTIVA');
  await assert.rejects(svc.invitaciones.resolver(i3.token), (e) => e.status === 410);
  await svc.sedes.cambiarActiva(sedeB, true);
  assert.equal((await svc.invitaciones.resolver(i3.token)).sede_id, sedeB);

  for (const malo of ['', 'xyz', 'A'.repeat(48), 'a'.repeat(47)]) await assert.rejects(svc.invitaciones.resolver(malo), (e) => e.status === 410);
});

// ── Supabase: RLS ───────────────────────────────────────────────────────────────────────────────
t('Supabase: con los privilegios por defecto de anon/authenticated, la migración 004 les cierra el acceso (RLS + REVOKE)', async () => {
  await db.ejecutar('GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated');
  await db.ejecutar('GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated');
  // 004 (Core Base) + 006/007 (sedes e invitaciones: su propio bloque RLS/REVOKE; además prueban que re-ejecutarlas es inocuo).
  for (const m of ['004_seguridad_supabase.sql', '006_multisede.sql', '007_invitaciones_inscripcion.sql', '008_nuevos_premium.sql']) {
    await db.ejecutarScript(fs.readFileSync(path.join(RAIZ, 'database', 'migrations', m), 'utf8'));
  }
  for (const rol of ['anon', 'authenticated']) {
    for (const objeto of ['estudiantes', 'pagos_referencias', 'usuarios_admin', 'vw_estudiantes_estado', 'sedes', 'invitaciones_inscripcion']) {
      const err = await db.conTransaccion(async (tx) => {
        await db.ejecutar(`SET LOCAL ROLE ${rol}`, [], tx);
        await db.ejecutar(`SELECT * FROM ${objeto}`, [], tx);
      }).catch((e) => e);
      assert.equal(err.code, '42501', `${rol} no debe leer ${objeto}`);
    }
  }
  // el rol de la aplicación (dueño) sigue leyendo normalmente
  assert.ok((await uno('SELECT COUNT(*)::int AS n FROM estudiantes')).n > 0);
});

// ── Prueba premium de 15 días ───────────────────────────────────────────────────────────────────
t('005: modulos_premium gana prueba_iniciada_en y expira_prueba_en (TIMESTAMPTZ NULL) sin tocar el estado existente', async () => {
  const cols = await filas(`SELECT column_name, data_type, is_nullable FROM information_schema.columns
                             WHERE table_name = 'modulos_premium' AND column_name IN ('prueba_iniciada_en', 'expira_prueba_en') ORDER BY 1`);
  assert.deepEqual(cols.map((c) => [c.column_name, c.data_type, c.is_nullable]),
    [['expira_prueba_en', 'timestamp with time zone', 'YES'], ['prueba_iniciada_en', 'timestamp with time zone', 'YES']]);
  assert.equal((await uno(`SELECT COUNT(*)::int AS n FROM modulos_premium WHERE expira_prueba_en IS NOT NULL`)).n, 0);
});

t('activar-prueba: UPDATE atómico (habilitado + expira = NOW() + 15 días) y solo UNA activación gana aunque lleguen 5 a la vez', async () => {
  const { activarPrueba } = require('../modules/premium/prueba.service');
  const resultados = await Promise.allSettled(Array.from({ length: 5 }, () => activarPrueba({ codigo: 'APP_MOVIL' })));
  const ok = resultados.filter((r) => r.status === 'fulfilled');
  const mal = resultados.filter((r) => r.status === 'rejected');
  assert.equal(ok.length, 1, 'exactamente una activación');
  assert.ok(mal.every((r) => r.reason.status === 409 && r.reason.codigo === 'MODULO_YA_HABILITADO'));
  const f = await uno(`SELECT habilitado, EXTRACT(EPOCH FROM (expira_prueba_en - prueba_iniciada_en))::int AS seg, habilitado_en = prueba_iniciada_en AS mismo_instante
                         FROM modulos_premium WHERE codigo = 'APP_MOVIL'`);
  assert.deepEqual([f.habilitado, f.seg, f.mismo_instante], [true, 15 * 86400, true]);
  await assert.rejects(activarPrueba({ codigo: 'NO_EXISTE' }), (e) => e.status === 404);
});

t('guard: la prueba vigente pasa; al vencer se BLOQUEA en la base (habilitado = FALSE, expira = NULL), responde 403 y no se puede reactivar sola', async () => {
  const { activarPrueba } = require('../modules/premium/prueba.service');
  const g = svc.guard.crearGuard({ ttlMs: 60_000 });
  const pedir = async () => { let r; await g.requireModulo('IA_ATENCION')({}, {}, (e) => { r = e; }); return r; };

  assert.equal((await pedir())?.codigo, 'MODULO_PREMIUM_DESHABILITADO');
  await activarPrueba({ codigo: 'IA_ATENCION' });
  g.invalidar();
  assert.equal(await pedir(), undefined, 'prueba vigente → pasa');

  await db.ejecutar(`UPDATE modulos_premium SET expira_prueba_en = NOW() - INTERVAL '1 minute' WHERE codigo = $1`, ['IA_ATENCION']);
  g.invalidar();
  const bloqueo = await pedir();
  assert.deepEqual([bloqueo.status, bloqueo.codigo, bloqueo.detalles.motivo], [403, 'MODULO_PREMIUM_DESHABILITADO', 'PRUEBA_EXPIRADA']);
  const f = await uno(`SELECT habilitado, expira_prueba_en, prueba_iniciada_en IS NOT NULL AS usada FROM modulos_premium WHERE codigo = 'IA_ATENCION'`);
  assert.deepEqual([f.habilitado, f.expira_prueba_en, f.usada], [false, null, true]);

  await assert.rejects(activarPrueba({ codigo: 'IA_ATENCION' }), (e) => e.status === 409 && e.codigo === 'PRUEBA_YA_UTILIZADA');

  // Contratación permanente posterior (el UPDATE documentado en la migración 005): vuelve a pasar y ya no caduca.
  await db.ejecutar(`UPDATE modulos_premium SET habilitado = TRUE, habilitado_en = NOW(), expira_prueba_en = NULL, actualizado_en = NOW() WHERE codigo = 'IA_ATENCION'`);
  g.invalidar();
  assert.equal(await pedir(), undefined);
  await assert.rejects(activarPrueba({ codigo: 'IA_ATENCION' }), (e) => e.codigo === 'MODULO_YA_HABILITADO');
});

t('bloquearVencidas() (catálogo del panel) converge la base y deja intactos los módulos permanentes y las pruebas vigentes', async () => {
  const repo = svc.guard.guard.repo;
  await db.ejecutar(`UPDATE modulos_premium SET habilitado = TRUE, prueba_iniciada_en = NOW() - INTERVAL '20 days', expira_prueba_en = NOW() - INTERVAL '5 days' WHERE codigo = 'FACHADA_WEB'`);
  assert.equal(await repo.bloquearVencidas(), 1);
  assert.equal(await repo.bloquearVencidas(), 0, 'idempotente');
  const est = Object.fromEntries((await filas('SELECT codigo, habilitado FROM modulos_premium')).map((x) => [x.codigo, x.habilitado]));
  assert.deepEqual([est.FACHADA_WEB, est.IA_ATENCION, est.APP_MOVIL], [false, true, true]);
  const todos = await repo.leerTodos();
  assert.ok(todos.every((m) => 'expira_prueba_en' in m && 'prueba_iniciada_en' in m));
});

// ── Bot de WhatsApp automático (ciclo completo contra la base real) ─────────────────────────────
t('cron WhatsApp: selección masiva (ventana 3–5 días, morosos sin pago en revisión), envío secuencial con pausa, ENVIADA/FALLIDA reales, idempotencia y arrendamiento', async () => {
  const { crearCronWhatsapp, candidatosPreventiva, candidatosMorosidad } = require('../cron/whatsappCron');
  const { activarPrueba } = require('../modules/premium/prueba.service');
  const hoy = svc.hoy();
  const extraCuota = (estId, concepto, vence, estado) => db.ejecutar(
    `INSERT INTO cuotas (estudiante_id, tipo, concepto, monto_usd, fecha_vencimiento, estado) VALUES ($1, 'OTRO', $2, 10, $3, $4)`, [estId, concepto, vence, estado]);

  const d3 = await sembrar({ vence: sumarDias(hoy, 3), nombres: 'CronD3', apellidos: 'Borde' });
  const d5 = await sembrar({ vence: sumarDias(hoy, 5), nombres: 'CronD5', apellidos: 'Borde' });
  const d2 = await sembrar({ vence: sumarDias(hoy, 2), nombres: 'CronD2', apellidos: 'Cerca' });
  const d6 = await sembrar({ vence: sumarDias(hoy, 6), nombres: 'CronD6', apellidos: 'Lejos' });
  const proxima = await sembrar({ vence: sumarDias(hoy, 1), nombres: 'CronProxima', apellidos: 'Uno' }); // su próxima cuota vence mañana…
  await extraCuota(proxima.estId, 'Otra cuota +4', sumarDias(hoy, 4), 'Pendiente'); // …así que la de +4 NO cuenta (misma regla que el envío manual)
  const pendVal = await sembrar({ estatus: 'Pendiente por Validación Administrativa', vence: sumarDias(hoy, 4), nombres: 'CronPendVal', apellidos: 'X' });
  const fuera = await sembrar({ estatus: 'Fuera de la Academia', vence: sumarDias(hoy, 4), nombres: 'CronFuera', apellidos: 'X' });
  const moroso = await sembrar({ vence: sumarDias(hoy, -6), monto: 30, nombres: 'CronMoroso', apellidos: 'Normal' });
  const fallida = await sembrar({ vence: sumarDias(hoy, -2), monto: 12, nombres: 'CronFallona', apellidos: 'Meta' });
  const soloRevision = await sembrar({ vence: sumarDias(hoy, -9), estadoCuota: 'En Revisión', nombres: 'CronRevision', apellidos: 'Total' });
  const mixto = await sembrar({ vence: sumarDias(hoy, -9), monto: 20, nombres: 'CronMixto', apellidos: 'Parcial' });
  await extraCuota(mixto.estId, 'Vencida en revisión', sumarDias(hoy, -3), 'En Revisión');

  const lim = 1000;
  const ids = (rows) => rows.map((r) => r.estudiante_id);
  const ventana = svc.notif.VENTANA_PREVENTIVA;
  const prev = ids(await candidatosPreventiva({ hoy, ventana, limite: lim }));
  for (const incluido of [d3, d5]) assert.ok(prev.includes(incluido.estId), 'bordes 3 y 5 días incluidos');
  for (const excluido of [d2, d6, proxima, pendVal, fuera, moroso, soloRevision]) assert.ok(!prev.includes(excluido.estId));
  assert.ok(prev.indexOf(d3.estId) < prev.indexOf(d5.estId), 'orden por vencimiento');

  const mor = ids(await candidatosMorosidad({ hoy, cadaDias: 7, limite: lim }));
  for (const incluido of [moroso, fallida, mixto]) assert.ok(mor.includes(incluido.estId));
  for (const excluido of [soloRevision, d3, pendVal, fuera]) assert.ok(!mor.includes(excluido.estId), 'con todo en revisión / no moroso no se cobra');
  assert.equal((await candidatosPreventiva({ hoy, ventana, limite: 1 })).length, 1, 'LIMIT respetado');

  // El módulo se habilita con la prueba de 15 días (extremo a extremo con el candado real).
  await db.ejecutar(`UPDATE modulos_premium SET habilitado = FALSE, prueba_iniciada_en = NULL, expira_prueba_en = NULL WHERE codigo = 'WHATSAPP_AUTOMATICO'`);
  const guardReal = svc.guard.crearGuard({ ttlMs: 0 });
  const enviados = []; const pausas = [];
  const waFalso = { configurado: () => true, enviarTexto: async (to, txt) => {
    if (/CronFallona/.test(txt)) throw svc.AppError(502, 'WHATSAPP_ENVIO_FALLIDO', 'Meta rechazó', { motivo: 'Meta 131047: fuera de la ventana de 24 h' });
    enviados.push(txt);
  } };
  const bcvFresco = { obtenerTasa: async () => ({ tasa: 36.5, desactualizada: false, capturadaEn: new Date() }) };
  const notificaciones = {
    VENTANA_PREVENTIVA: ventana,
    generarAlerta: (a, deps) => svc.notif.generarAlerta(a, { bcvSvc: deps.bcvSvc, waSvc: waFalso }),
  };
  const config = { activo: true, hora: '08:00', delayMs: 1500, maxEnviosPorCiclo: lim, morosidadCadaDias: 7, maxFallosSeguidos: 50, arrendamientoMin: 120 };
  const armar = () => crearCronWhatsapp({ db, guard: guardReal, notificaciones, bcv: bcvFresco, whatsapp: waFalso, config,
    esperar: async (ms) => { pausas.push(ms); }, log: () => {}, logError: () => {} });

  // 1) Módulo bloqueado → no envía nada
  let r = await armar().ejecutarCiclo();
  assert.deepEqual([r.estado, r.motivo, enviados.length], ['OMITIDO', 'DESHABILITADO', 0]);

  // 2) Se activa la prueba de 15 días → el ciclo corre
  await activarPrueba({ codigo: 'WHATSAPP_AUTOMATICO' });
  r = await armar().ejecutarCiclo();
  assert.equal(r.estado, 'COMPLETADO');
  assert.ok(pausas.length > 0 && pausas.every((ms) => ms === 1500));
  assert.equal(pausas.length, r.preventiva.enviadas + r.morosidad.enviadas + r.morosidad.fallidas + r.preventiva.fallidas - 1, 'una pausa entre cada par de envíos consecutivos');
  const estado = async (est) => filas(`SELECT tipo, estado, error, creado_por FROM notificaciones_whatsapp WHERE estudiante_id = $1 ORDER BY id`, [est.estId]);
  for (const e of [d3, d5]) assert.deepEqual((await estado(e)).map((x) => [x.tipo, x.estado, x.creado_por]), [['PREVENTIVA', 'ENVIADA', null]]);
  for (const e of [moroso, mixto]) assert.deepEqual((await estado(e)).map((x) => [x.tipo, x.estado]), [['MOROSIDAD', 'ENVIADA']]);
  const filaFallida = await estado(fallida);
  assert.deepEqual(filaFallida.map((x) => [x.tipo, x.estado]), [['MOROSIDAD', 'FALLIDA']]);
  assert.match(filaFallida[0].error, /131047/);
  for (const e of [d2, d6, proxima, pendVal, fuera, soloRevision]) assert.equal((await estado(e)).length, 0, 'no candidatos → ninguna notificación');
  assert.match(enviados.find((x) => /CronMixto/.test(x)), /US\$ 20\.00/, 'solo se cobra la cuota Pendiente, no la que está en revisión');

  // 3) Idempotencia: relanzar el mismo día no duplica (la FALLIDA sí se reintenta)
  const antes = enviados.length;
  r = await armar().ejecutarCiclo();
  assert.equal(enviados.length, antes, 'nadie recibe dos mensajes el mismo día');
  assert.equal((await estado(d3)).length, 1);
  assert.deepEqual((await estado(fallida)).map((x) => x.estado), ['FALLIDA', 'FALLIDA'], 'el fallido se reintenta (y vuelve a quedar registrado)');
  assert.equal((await estado(moroso)).length, 1);

  // 4) Morosidad: pasados 7 días se vuelve a cobrar
  await db.ejecutar(`UPDATE notificaciones_whatsapp SET creado_en = NOW() - INTERVAL '8 days' WHERE estudiante_id = $1`, [moroso.estId]);
  assert.ok(ids(await candidatosMorosidad({ hoy, cadaDias: 7, limite: lim })).includes(moroso.estId));

  // 5) Arrendamiento: uno vigente bloquea el ciclo; uno caducado se retoma; el propio se libera al terminar
  await db.ejecutar(`INSERT INTO parametros (clave, valor) VALUES ('WHATSAPP_CRON_LEASE', 'otra-instancia') ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor, actualizado_en = NOW()`);
  r = await armar().ejecutarCiclo();
  assert.deepEqual([r.estado, r.motivo], ['OMITIDO', 'OTRA_INSTANCIA_EN_CURSO']);
  await db.ejecutar(`UPDATE parametros SET actualizado_en = NOW() - INTERVAL '3 hours' WHERE clave = 'WHATSAPP_CRON_LEASE'`);
  r = await armar().ejecutarCiclo();
  assert.equal(r.estado, 'COMPLETADO');
  assert.equal((await uno(`SELECT COUNT(*)::int AS n FROM parametros WHERE clave = 'WHATSAPP_CRON_LEASE'`)).n, 0, 'lease liberado');

  // 6) Prueba vencida a mitad de vida del módulo → el bot deja de enviar y el módulo queda bloqueado en la base
  await db.ejecutar(`UPDATE modulos_premium SET expira_prueba_en = NOW() - INTERVAL '1 second' WHERE codigo = 'WHATSAPP_AUTOMATICO'`);
  r = await armar().ejecutarCiclo();
  assert.deepEqual([r.estado, r.motivo], ['OMITIDO', 'PRUEBA_EXPIRADA']);
  assert.equal((await uno(`SELECT habilitado FROM modulos_premium WHERE codigo = 'WHATSAPP_AUTOMATICO'`)).habilitado, false);
});

t('cron WhatsApp por sede: cada sede activa se despacha por separado (Preventiva → Morosidad), después los estudiantes sin sede; una sede desactivada no recibe nada', async () => {
  const { crearCronWhatsapp, candidatosPreventiva, candidatosMorosidad } = require('../cron/whatsappCron');
  const hoy = svc.hoy();
  const ventana = svc.notif.VENTANA_PREVENTIVA;
  const pA = await sembrar({ sedeId: sedeA, nombres: 'SdPrevA', vence: sumarDias(hoy, 4) });
  const mA = await sembrar({ sedeId: sedeA, nombres: 'SdMorA', vence: sumarDias(hoy, -3) });
  const pB = await sembrar({ sedeId: sedeB, nombres: 'SdPrevB', vence: sumarDias(hoy, 5) });
  const mB = await sembrar({ sedeId: sedeB, nombres: 'SdMorB', vence: sumarDias(hoy, -1) });
  const lejos = await sembrar({ sedeId: sedeA, nombres: 'SdLejos', vence: sumarDias(hoy, 20) });
  const libre = await sembrar({ nombres: 'SdSinSede', vence: sumarDias(hoy, 4) });
  // Esta es una sede más allá de las 2 del Core Base: la migración 008 exige MULTI_SEDE_PREMIUM (se restablece justo después).
  await db.ejecutar(`UPDATE modulos_premium SET habilitado = TRUE, habilitado_en = NOW(), actualizado_en = NOW() WHERE codigo = 'MULTI_SEDE_PREMIUM'`);
  const cerrada = (await svc.sedes.crear({ nombre: 'Sede Cerrada Cron' })).id;
  await db.ejecutar(`UPDATE modulos_premium SET habilitado = FALSE, habilitado_en = NULL, actualizado_en = NOW() WHERE codigo = 'MULTI_SEDE_PREMIUM'`);
  const enCerrada = await sembrar({ sedeId: cerrada, nombres: 'SdCerrada', vence: sumarDias(hoy, 4) });
  await svc.sedes.cambiarActiva(cerrada, false);

  // Consultas masivas: el ámbito es exacto (sede entera, o solo "sin sede" con NULL).
  const ids = (rows) => rows.map((r) => r.estudiante_id);
  const lim = 10000;
  const prevA = ids(await candidatosPreventiva({ hoy, ventana, limite: lim, sedeId: sedeA }));
  assert.ok(prevA.includes(pA.estId) && !prevA.includes(pB.estId) && !prevA.includes(lejos.estId) && !prevA.includes(libre.estId));
  assert.ok(ids(await candidatosMorosidad({ hoy, cadaDias: 7, limite: lim, sedeId: sedeB })).includes(mB.estId));
  assert.ok(!ids(await candidatosMorosidad({ hoy, cadaDias: 7, limite: lim, sedeId: sedeB })).includes(mA.estId));
  const sinSede = ids(await candidatosPreventiva({ hoy, ventana, limite: lim, sedeId: null }));
  assert.ok(sinSede.includes(libre.estId) && !sinSede.includes(pA.estId));

  // Ciclo completo con el candado real (módulo contratado) y servicios dobles que registran el orden.
  await db.ejecutar(`UPDATE modulos_premium SET habilitado = TRUE, habilitado_en = NOW(), prueba_iniciada_en = NULL, expira_prueba_en = NULL WHERE codigo = 'WHATSAPP_AUTOMATICO'`);
  const llamadas = []; const pausas = [];
  const notificaciones = { VENTANA_PREVENTIVA: ventana, generarAlerta: async (a) => { llamadas.push([a.tipo, a.estudianteId]); return { notificacion_id: 0 }; } };
  const config = { activo: true, hora: '08:00', delayMs: 1500, maxEnviosPorCiclo: lim, morosidadCadaDias: 7, maxFallosSeguidos: 50, arrendamientoMin: 120 };
  const cron = crearCronWhatsapp({ db, guard: svc.guard.crearGuard({ ttlMs: 0 }), notificaciones, whatsapp: { configurado: () => true }, bcv: { obtenerTasa: async () => ({}) },
    config, esperar: async (ms) => { pausas.push(ms); }, log: () => {}, logError: () => {} });
  const r = await cron.ejecutarCiclo();
  assert.equal(r.estado, 'COMPLETADO');
  const mios = new Map([[pA.estId, 'pA'], [mA.estId, 'mA'], [pB.estId, 'pB'], [mB.estId, 'mB'], [lejos.estId, 'lejos'], [libre.estId, 'libre'], [enCerrada.estId, 'cerrada']]);
  assert.deepEqual(llamadas.filter(([, id]) => mios.has(id)).map(([tipo, id]) => [mios.get(id), tipo]),
    [['pA', 'PREVENTIVA'], ['mA', 'MOROSIDAD'], ['pB', 'PREVENTIVA'], ['mB', 'MOROSIDAD'], ['libre', 'PREVENTIVA']]);
  assert.ok(pausas.every((ms) => ms === 1500));
  const ambitos = r.por_sede.map((x) => x.sede_id);
  assert.ok(ambitos.includes(sedeA) && ambitos.includes(sedeB) && !ambitos.includes(cerrada), 'la sede desactivada no entra en el ciclo');
  assert.equal(ambitos[ambitos.length - 1], null, 'los estudiantes sin sede van al final');

  await db.ejecutar(`UPDATE modulos_premium SET habilitado = FALSE, habilitado_en = NULL, prueba_iniciada_en = NULL, expira_prueba_en = NULL WHERE codigo = 'WHATSAPP_AUTOMATICO'`);
});


t('salud: SELECT 1 responde y una segunda llamada a closePool es inocua', async () => {
  assert.equal((await uno('SELECT 1 AS ok')).ok, 1);
});
