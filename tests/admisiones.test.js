'use strict';
const { db } = require('./helpers/entorno');
const test = require('node:test');
const assert = require('node:assert/strict');
const { registrarInscripcion } = require('../services/admisiones.service');
const { prepararInscripcion } = require('../controllers/admisiones.controller');
const { AppError } = require('../errors/AppError');

const rs = (...filas) => ({ rows: filas, rowCount: filas.length });
const bcvOk = { obtenerTasa: async () => ({ tasa: 36.5, desactualizada: false }) };

function programar({ matricula = '100.00', fallaEn } = {}) {
  db.reiniciar();
  db.handler = async (texto) => {
    if (fallaEn && fallaEn.test(texto)) throw Object.assign(new Error('duplicate key value violates unique constraint "ux_pagos_referencia_activa"'), { name: 'error', severity: 'ERROR', code: '23505', constraint: 'ux_pagos_referencia_activa' });
    if (/FROM parametros/.test(texto)) return rs({ valor: matricula });
    if (/INSERT INTO representantes[\s\S]*ON CONFLICT \(cedula\)/.test(texto)) return rs({ id: 5 });
    if (/INSERT INTO estudiantes/.test(texto)) return rs({ id: 10 });
    if (/INSERT INTO cuotas/.test(texto)) return rs({ id: 20 });
    if (/UPDATE cuotas SET estado = 'En Revisión'/.test(texto)) return rs({ monto_usd: 100 });
    if (/INSERT INTO pagos_referencias/.test(texto)) return rs({ id: 30 });
    return rs();
  };
}

const archivos = [
  { tipo: 'FOTO_CARNET', buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1]), mime: 'image/jpeg', ext: 'jpg' },
  { tipo: 'CEDULA_IDENTIDAD', buffer: Buffer.from('%PDF-1.7 x'), mime: 'application/pdf', ext: 'pdf' },
  { tipo: 'ACTA_NACIMIENTO', buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 1]), mime: 'image/png', ext: 'png' },
];
const datos = {
  alumno_nombres: 'Luis', alumno_apellidos: 'Pérez', alumno_cedula: null, alumno_fecha_nacimiento: '2015-03-02', grado_solicitado: '3er grado',
  colegio_procedencia: null, ultimo_grado_aprobado: null, tipo_sangre: 'O+', alergias: null, condiciones_medicas: null, medicamentos: null,
  emergencia_nombre: null, emergencia_telefono: null, representante_nombres: 'Ana', representante_apellidos: 'Pérez', representante_cedula: 'V-12345678',
  representante_email: null, telefono: '584141234567', referencia_bancaria: 'REF-998877', metodo_pago: 'PAGO_MOVIL',
};
const driveFalso = (modo = 'ok') => {
  const f = { subidas: [], eliminadas: [] };
  f.subirExpediente = async (args) => {
    f.subidas.push(args);
    if (modo === 'falla') throw new AppError(502, 'DRIVE_ERROR', 'Drive caído');
    return {
      carpetaId: 'carpeta-1', carpetaUrl: 'https://drive.test/carpeta-1',
      documentos: args.archivos.map((a) => ({ tipo: a.tipo, fileId: `f-${a.tipo}`, url: null, nombre: `${a.tipo.toLowerCase()}.${a.ext}`, mime: a.mime, bytes: a.buffer.length })),
    };
  };
  f.eliminarCarpeta = async (id) => { f.eliminadas.push(id); };
  return f;
};

test('inscripción OK: estatus "Pendiente por Validación Administrativa", monto en Bs. a la tasa BCV y carpeta Drive del estudiante', async () => {
  programar();
  const drive = driveFalso();
  const r = await registrarInscripcion({ datos, archivos }, { bcvSvc: bcvOk, driveSvc: drive });
  assert.equal(r.estudiante_id, 10);
  assert.equal(r.estatus, 'Pendiente por Validación Administrativa');
  assert.equal(r.monto_usd, 100);
  assert.equal(r.monto_bs, 3650);
  assert.equal(r.referencia, 'REF-998877');
  assert.equal(db.commits, 1);
  assert.equal(db.rollbacks, 0);
  assert.equal(drive.subidas[0].estudianteId, 10); // el ID real alimenta 'Nombre_Apellido_ID'
  assert.equal(drive.subidas[0].archivos.length, 3);
  assert.equal(db.llamadas.filter((l) => /INSERT INTO documentos_estudiante/.test(l.texto)).length, 3);
  // la referencia se persiste ANTES de tocar Drive: un duplicado nunca deja archivos huérfanos
  const orden = db.llamadas.findIndex((l) => /INSERT INTO pagos_referencias/.test(l.texto));
  assert.ok(orden > -1 && orden < db.llamadas.findIndex((l) => /UPDATE estudiantes SET drive_folder_id/.test(l.texto)));
});

test('si Drive falla, TODO se revierte (rollback) y el error JSON 502 se propaga; no hay carpeta que limpiar', async () => {
  programar();
  const drive = driveFalso('falla');
  await assert.rejects(registrarInscripcion({ datos, archivos }, { bcvSvc: bcvOk, driveSvc: drive }), (e) => e.status === 502 && e.codigo === 'DRIVE_ERROR');
  assert.equal(db.rollbacks, 1);
  assert.equal(db.commits, 0);
  assert.deepEqual(drive.eliminadas, []);
});

test('si la base falla DESPUÉS de crear la carpeta, se revierte y la carpeta se envía a la papelera (compensación)', async () => {
  programar({ fallaEn: /INSERT INTO documentos_estudiante/ });
  const drive = driveFalso();
  await assert.rejects(registrarInscripcion({ datos, archivos }, { bcvSvc: bcvOk, driveSvc: drive }), (e) => e.code === '23505');
  assert.equal(db.rollbacks, 1);
  assert.deepEqual(drive.eliminadas, ['carpeta-1']);
});

test('referencia bancaria duplicada: falla antes de Drive (no se sube nada)', async () => {
  programar({ fallaEn: /INSERT INTO pagos_referencias/ });
  const drive = driveFalso();
  await assert.rejects(registrarInscripcion({ datos, archivos }, { bcvSvc: bcvOk, driveSvc: drive }), (e) => e.code === '23505');
  assert.equal(drive.subidas.length, 0);
  assert.equal(db.rollbacks, 1);
});

test('matrícula sin configurar (0) → 503 CONFIG_INCOMPLETA sin abrir transacción', async () => {
  programar({ matricula: '0.00' });
  await assert.rejects(registrarInscripcion({ datos, archivos }, { bcvSvc: bcvOk, driveSvc: driveFalso() }), (e) => e.status === 503 && e.codigo === 'CONFIG_INCOMPLETA');
  assert.equal(db.commits + db.rollbacks, 0);
});

// ── Validación del formulario (controlador) ─────────────────────────────────────────────────────
const JPG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
const PDF = Buffer.from('%PDF-1.4 contenido');
const body = {
  alumno_nombres: 'Luis', alumno_apellidos: 'Pérez', alumno_fecha_nacimiento: '2015-03-02', grado_solicitado: '3er grado',
  representante_nombres: 'Ana', representante_apellidos: 'Pérez', representante_cedula: 'V-12345678',
  telefono_codigo: '+58', telefono_numero: '414 123 4567', emergencia_telefono: '0412 765 4321',
  referencia_bancaria: 'REF-998877', metodo_pago: 'ZELLE', campo_malicioso: 'DROP TABLE',
};
const files = (ov = {}) => ({
  foto_carnet: [{ buffer: JPG }], cedula_identidad: [{ buffer: PDF }], acta_nacimiento: [{ buffer: JPG }], ...ov,
});

test('formulario: teléfonos unificados en una cadena sin espacios, tipo real por magic bytes y campos extra descartados', () => {
  const { datos: d, archivos: a } = prepararInscripcion(body, files());
  assert.equal(d.telefono, '584141234567');
  assert.equal(d.emergencia_telefono, '584127654321');
  assert.ok(!('campo_malicioso' in d));
  assert.deepEqual(a.map((x) => [x.tipo, x.mime, x.ext]), [['FOTO_CARNET', 'image/jpeg', 'jpg'], ['CEDULA_IDENTIDAD', 'application/pdf', 'pdf'], ['ACTA_NACIMIENTO', 'image/jpeg', 'jpg']]);
});

test('formulario: acumula TODOS los errores (faltantes, formato falso, foto en PDF, fecha futura, teléfono corto) en un solo 422', () => {
  const mal = { ...body, alumno_fecha_nacimiento: '2999-01-01', referencia_bancaria: 'a b', telefono_numero: '123', telefono_codigo: '' };
  try {
    prepararInscripcion(mal, { foto_carnet: [{ buffer: PDF }], cedula_identidad: [{ buffer: Buffer.from('MZ ejecutable disfrazado') }] });
    assert.fail('debía lanzar');
  } catch (err) {
    assert.equal(err.status, 422);
    const campos = err.detalles.map((d) => d.campo).sort();
    assert.deepEqual(campos, ['acta_nacimiento', 'alumno_fecha_nacimiento', 'cedula_identidad', 'foto_carnet', 'referencia_bancaria', 'telefono']);
  }
});

test('formulario: el teléfono es obligatorio y la referencia bancaria no admite espacios', () => {
  const sinTel = { ...body }; delete sinTel.telefono_numero; delete sinTel.telefono_codigo;
  assert.throws(() => prepararInscripcion(sinTel, files()), (e) => e.detalles.some((d) => d.campo === 'telefono'));
  assert.throws(() => prepararInscripcion({ ...body, referencia_bancaria: '' }, files()), (e) => e.detalles.some((d) => d.campo === 'referencia_bancaria'));
});
