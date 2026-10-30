'use strict';
const { db } = require('./helpers/entorno');
const test = require('node:test');
const assert = require('node:assert/strict');
const { registrarInscripcion } = require('../services/admisiones.service');
const { prepararInscripcion } = require('../controllers/admisiones.controller');
const { AppError } = require('../errors/AppError');

const rs = (...filas) => ({ rows: filas, rowCount: filas.length });
const bcvOk = { obtenerTasa: async () => ({ tasa: 36.5, desactualizada: false }) };

/** `telefonoEnRevision` = el upsert reporta (RETURNING) que el teléfono del formulario difirió del verificado y quedó pendiente (H2). */
function programar({ matricula = '100.00', fallaEn, telefonoEnRevision = false } = {}) {
  db.reiniciar();
  db.handler = async (texto) => {
    if (fallaEn && fallaEn.test(texto)) throw Object.assign(new Error('duplicate key value violates unique constraint "ux_pagos_referencia_activa"'), { name: 'error', severity: 'ERROR', code: '23505', constraint: 'ux_pagos_referencia_activa' });
    if (/FROM parametros/.test(texto)) return rs({ valor: matricula });
    if (/INSERT INTO representantes[\s\S]*ON CONFLICT \(cedula\)/.test(texto)) return rs({ id: 5, telefono_en_revision: telefonoEnRevision });
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

// ── H2: blindaje contra suplantación (el formulario es público y anónimo) ───────────────────────
/** Ejecuta `fn` capturando console.warn; cada aviso guarda cuántos COMMIT llevaba la base en ese instante. */
async function conAvisos(fn) {
  const avisos = []; const original = console.warn;
  console.warn = (m) => avisos.push({ m: String(m), commits: db.commits });
  try { await fn(); } finally { console.warn = original; }
  return avisos;
}

test('H2: el upsert por cédula NO sobrescribe el contacto: el correo guardado manda y un teléfono distinto va a telefono_pendiente (nunca a telefono)', async () => {
  programar();
  await registrarInscripcion({ datos, archivos }, { bcvSvc: bcvOk, driveSvc: driveFalso() });
  const up = db.llamadas.find((l) => /INSERT INTO representantes/.test(l.texto));
  assert.match(up.texto, /email = COALESCE\(representantes\.email, EXCLUDED\.email\)/, 'el correo EXISTENTE gana; el del formulario solo rellena un hueco');
  assert.ok(!/COALESCE\(EXCLUDED\.email/.test(up.texto), 'el correo del formulario público ya no pisa al guardado');
  assert.ok(!/(?<![\w.])telefono\s*=\s*EXCLUDED\.telefono/.test(up.texto), 'el teléfono verificado jamás se reescribe desde el formulario');
  assert.match(up.texto, /telefono_pendiente = CASE WHEN representantes\.telefono IS DISTINCT FROM EXCLUDED\.telefono\s+THEN EXCLUDED\.telefono ELSE representantes\.telefono_pendiente END/);
  assert.match(up.texto, /telefono_pendiente_en = CASE WHEN representantes\.telefono IS DISTINCT FROM EXCLUDED\.telefono\s+THEN NOW\(\) ELSE representantes\.telefono_pendiente_en END/);
  assert.match(up.texto, /RETURNING id, \(telefono_pendiente IS NOT NULL\) AS telefono_en_revision/);
  assert.deepEqual(up.params, ['Ana', 'Pérez', 'V-12345678', null, '584141234567'], 'parámetros posicionales $1..$5, cédula en mayúsculas');
});

test('H2: con un teléfono retenido se avisa SOLO tras el COMMIT, en el log del servidor y sin teléfonos; la respuesta pública no revela que la cédula ya existía', async () => {
  programar({ telefonoEnRevision: true });
  let r;
  const avisos = await conAvisos(async () => { r = await registrarInscripcion({ datos, archivos }, { bcvSvc: bcvOk, driveSvc: driveFalso() }); });
  assert.equal(avisos.length, 1);
  assert.match(avisos[0].m, /Representante 5.*PENDIENTE de aprobación.*estudiante 10/);
  assert.equal(avisos[0].commits, 1, 'el aviso va después del COMMIT, no dentro de la transacción');
  assert.ok(!avisos[0].m.includes(datos.telefono), 'el log no lleva el teléfono (dato personal)');
  assert.ok(!/telefono/i.test(JSON.stringify(r)), 'la respuesta al cliente no menciona teléfonos ni revisión: sería una fuga de enumeración de cédulas');
  assert.equal(r.estudiante_id, 10, 'la inscripción del alumno prosigue con normalidad');
});

test('H2: sin teléfono retenido no hay aviso, y si la transacción se revierte tampoco (no se afirma algo que no quedó guardado)', async () => {
  programar();
  assert.deepEqual(await conAvisos(() => registrarInscripcion({ datos, archivos }, { bcvSvc: bcvOk, driveSvc: driveFalso() })), []);

  programar({ telefonoEnRevision: true, fallaEn: /INSERT INTO documentos_estudiante/ });
  const avisos = await conAvisos(() => silenciar(() => assert.rejects(registrarInscripcion({ datos, archivos }, { bcvSvc: bcvOk, driveSvc: driveFalso() }), (e) => e.code === '23505')));
  assert.deepEqual(avisos, []);
  assert.equal(db.rollbacks, 1);
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

// ── Compensación ante COMMIT fallido y errores de limpieza ─────────────────────────────────────
/** Simula un COMMIT que falla (conexión caída) DESPUÉS de ejecutar todo el callback. */
async function conCommitFallido(fn) {
  db.fallarCommit = true;
  try { return await fn(); } finally { db.fallarCommit = false; }
}
const conVerificacion = (respuesta) => {
  const base = db.handler;
  db.handler = async (texto, params) => {
    if (/SELECT 1 FROM estudiantes WHERE id = \$1 AND drive_folder_id = \$2/.test(texto)) return typeof respuesta === 'function' ? respuesta(params) : respuesta;
    return base(texto, params);
  };
};
const silenciar = async (fn) => { const o = console.error; console.error = () => {}; try { return await fn(); } finally { console.error = o; } };

test('COMMIT fallido y la inscripción NO quedó guardada: la carpeta se envía a la papelera y el error se propaga', async () => {
  programar();
  conVerificacion(rs());
  const drive = driveFalso();
  await silenciar(() => conCommitFallido(() => assert.rejects(registrarInscripcion({ datos, archivos }, { bcvSvc: bcvOk, driveSvc: drive }), /Connection terminated/)));
  assert.deepEqual(drive.eliminadas, ['carpeta-1']);
  const verif = db.llamadas.find((l) => /SELECT 1 FROM estudiantes/.test(l.texto));
  assert.deepEqual(verif.params, [10, 'carpeta-1']);
});

test('COMMIT fallido pero la base SÍ lo confirmó: no se destruye el expediente y se devuelve la inscripción', async () => {
  programar();
  conVerificacion(rs({ '?column?': 1 }));
  const drive = driveFalso();
  const r = await silenciar(() => conCommitFallido(() => registrarInscripcion({ datos, archivos }, { bcvSvc: bcvOk, driveSvc: drive })));
  assert.equal(r.estudiante_id, 10);
  assert.equal(r.carpeta_drive, 'https://drive.test/carpeta-1');
  assert.deepEqual(drive.eliminadas, []);
});

test('COMMIT fallido y la base no responde la verificación: estado desconocido → se conserva la carpeta y se propaga el error original', async () => {
  programar();
  conVerificacion(() => { throw new Error('base caída'); });
  const drive = driveFalso();
  await silenciar(() => conCommitFallido(() => assert.rejects(registrarInscripcion({ datos, archivos }, { bcvSvc: bcvOk, driveSvc: drive }), /Connection terminated/)));
  assert.deepEqual(drive.eliminadas, []);
});

test('si eliminarCarpeta lanza durante la compensación, el cliente recibe el error ORIGINAL (23505), no el de la limpieza', async () => {
  programar({ fallaEn: /INSERT INTO documentos_estudiante/ });
  const drive = driveFalso();
  drive.eliminarCarpeta = async () => { throw new Error('limpieza explotó'); };
  await silenciar(() => assert.rejects(registrarInscripcion({ datos, archivos }, { bcvSvc: bcvOk, driveSvc: drive }), (e) => e.code === '23505'));
  assert.equal(db.rollbacks, 1);
});

test('si eliminarCarpeta devuelve false (no se pudo limpiar) el error original igual se propaga', async () => {
  programar({ fallaEn: /INSERT INTO documentos_estudiante/ });
  const drive = driveFalso();
  drive.eliminarCarpeta = async (id) => { drive.eliminadas.push(id); return false; };
  await silenciar(() => assert.rejects(registrarInscripcion({ datos, archivos }, { bcvSvc: bcvOk, driveSvc: drive }), (e) => e.code === '23505'));
  assert.deepEqual(drive.eliminadas, ['carpeta-1']);
});
