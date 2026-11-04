'use strict';
/**
 * Planilla oficial (MPPE): ficha médica, madre/padre con representante principal y personas autorizadas.
 * Sin base de datos: `normalizarPlanilla` es puro y `prepararInscripcion` solo valida. El SQL real se prueba en integracion.pg.test.js.
 */
require('./helpers/entorno'); // instala los dobles de multer/pg/googleapis antes de cargar el controlador
const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizarPlanilla } = require('../utils/planilla');
const { prepararInscripcion } = require('../controllers/admisiones.controller');

const HOY = '2026-11-03';
const campos = (r) => r.detalles.map((d) => d.campo).sort();

const madreCompleta = {
  madre_nombres: 'Ana', madre_apellidos: 'Pérez', madre_cedula: 'v-12345678', madre_fecha_nacimiento: '1988-04-02',
  madre_direccion: 'Av. Principal, Caracas', madre_telefono_fijo: '0212 123 4567', madre_telefono_movil: '0414 123 4567', madre_email: 'ANA@Example.com',
};

test('planilla: con la madre como principal, sus datos alimentan al representante y la edad se DEDUCE de la fecha (nunca de la edad enviada)', () => {
  const { valores, detalles } = normalizarPlanilla({ representante_principal: 'MADRE', ...madreCompleta, madre_edad: '99' }, { hoy: HOY });
  assert.deepEqual(detalles, []);
  assert.equal(valores.madre.edad, 38); // 1988-04-02 → 2026-11-03
  assert.equal(valores.madre.telefono_movil, '584141234567');
  assert.equal(valores.madre.telefono_fijo, '582121234567');
  assert.equal(valores.madre.email, 'ana@example.com');
  assert.deepEqual(valores.principal, { nombres: 'Ana', apellidos: 'Pérez', cedula: 'v-12345678', email: 'ana@example.com', telefono: '584141234567' });
  assert.equal(valores.padre.nombres, null);
});

test('planilla: el principal exige nombres, apellidos, cédula y móvil; el otro progenitor, nada si está vacío', () => {
  const r = normalizarPlanilla({ representante_principal: 'PADRE', padre_nombres: 'Luis' }, { hoy: HOY });
  assert.deepEqual(campos(r), ['padre_apellidos', 'padre_cedula', 'padre_telefono_movil']);
});

test('planilla: si se anota cualquier dato del otro progenitor, su nombre y apellido pasan a ser obligatorios', () => {
  const r = normalizarPlanilla({ representante_principal: 'MADRE', ...madreCompleta, padre_email: 'luis@example.com' }, { hoy: HOY });
  assert.deepEqual(campos(r), ['padre_apellidos', 'padre_nombres']);
});

test('planilla: edad fuera de rango, fecha futura o progenitor menor de 14 años y teléfonos inválidos se rechazan', () => {
  const r = normalizarPlanilla({
    representante_principal: 'MADRE', ...madreCompleta, madre_fecha_nacimiento: '2020-01-01', madre_telefono_fijo: '123',
    padre_nombres: 'Luis', padre_apellidos: 'Gómez', padre_edad: '5', padre_telefono_movil: 'abc',
  }, { hoy: HOY });
  assert.deepEqual(campos(r), ['madre_fecha_nacimiento', 'madre_telefono_fijo', 'padre_edad', 'padre_telefono_movil']);
});

test('planilla: «Sí» a alergia o tratamiento exige explicación; «No» limpia el texto y el booleano queda en false', () => {
  assert.deepEqual(campos(normalizarPlanilla({ es_alergico: 'SI', bajo_tratamiento: 'SI' }, { hoy: HOY })), ['alergias', 'tratamiento_explicacion']);
  const no = normalizarPlanilla({ es_alergico: 'NO', bajo_tratamiento: 'NO', tratamiento_explicacion: 'texto residual' }, { hoy: HOY });
  assert.deepEqual(no.detalles, []);
  assert.equal(no.valores.bajo_tratamiento, false);
  assert.equal(no.valores.tratamiento_explicacion, null);
  const si = normalizarPlanilla({ bajo_tratamiento: 'SI', tratamiento_explicacion: 'Asma' }, { hoy: HOY });
  assert.deepEqual([si.valores.bajo_tratamiento, si.valores.tratamiento_explicacion], [true, 'Asma']);
  assert.deepEqual(campos(normalizarPlanilla({ es_alergico: 'TAL VEZ' }, { hoy: HOY })), ['es_alergico']);
});

test('planilla: personas autorizadas — filas vacías no cuentan, una a medias falla campo por campo y la tercera se rechaza', () => {
  const ok = normalizarPlanilla({ autorizada_1_nombre: 'Rosa Pérez', autorizada_1_telefono: '0412 111 2222', autorizada_1_parentesco: 'Tía' }, { hoy: HOY });
  assert.deepEqual(ok.detalles, []);
  assert.deepEqual(ok.valores.personas_autorizadas, [{ nombre: 'Rosa Pérez', telefono: '584121112222', parentesco: 'Tía' }]);
  assert.deepEqual(normalizarPlanilla({}, { hoy: HOY }).valores.personas_autorizadas, []);

  const medias = normalizarPlanilla({ autorizada_2_nombre: 'Pedro', autorizada_3_nombre: 'Intruso' }, { hoy: HOY });
  assert.deepEqual(campos(medias), ['autorizada_2_parentesco', 'autorizada_2_telefono', 'autorizada_3_nombre']);
});

// ── Integración con el controlador ──────────────────────────────────────────────────────────────
const JPG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
const PDF = Buffer.from('%PDF-1.4 contenido');
const files = () => ({ foto_carnet: [{ buffer: JPG }], cedula_identidad: [{ buffer: PDF }], acta_nacimiento: [{ buffer: JPG }] });
const base = {
  alumno_nombres: 'Luis', alumno_apellidos: 'Pérez', alumno_fecha_nacimiento: '2015-03-02', grado_solicitado: '3er grado',
  referencia_bancaria: 'REF-998877', metodo_pago: 'ZELLE', es_alergico: 'NO', bajo_tratamiento: 'NO',
};

test('controlador: SIN teléfono ni representante «clásico», el principal sale de la planilla y todo llega normalizado al servicio', () => {
  const { datos } = prepararInscripcion({
    ...base, representante_principal: 'MADRE', ...madreCompleta, alergias: 'residuo', alumno_lugar_nacimiento: 'Caracas', horario_preferido: 'Sábados',
    autorizada_1_nombre: 'Rosa', autorizada_1_telefono: '0412 111 2222', autorizada_1_parentesco: 'Tía',
  }, files());
  assert.equal(datos.representante_nombres, 'Ana');
  assert.equal(datos.representante_cedula, 'v-12345678');
  assert.equal(datos.telefono, '584141234567');
  assert.equal(datos.alergias, null, '«No» a ¿Es alérgico? vacía el texto');
  assert.equal(datos.lugar_nacimiento, 'Caracas');
  assert.equal(datos.bajo_tratamiento, false);
  assert.equal(datos.madre.nombres, 'Ana');
  assert.equal(typeof datos.madre.edad, 'number');
  assert.deepEqual(datos.personas_autorizadas, [{ nombre: 'Rosa', telefono: '584121112222', parentesco: 'Tía' }]);
});

test('controlador: sin principal ni representante clásico se exigen sus campos; con errores de la planilla se devuelven todos en UN 422', () => {
  try {
    prepararInscripcion({ ...base, es_alergico: 'SI', autorizada_1_nombre: 'Rosa' }, files());
    assert.fail('debía lanzar');
  } catch (err) {
    assert.equal(err.status, 422);
    assert.deepEqual(campos({ detalles: err.detalles }), [
      'alergias', 'autorizada_1_parentesco', 'autorizada_1_telefono', 'representante_apellidos', 'representante_cedula', 'representante_nombres', 'telefono',
    ]);
  }
});

test('controlador: el formulario clásico (representante único + teléfono) sigue funcionando sin cambios', () => {
  const { datos } = prepararInscripcion({
    ...base, representante_nombres: 'Ana', representante_apellidos: 'Pérez', representante_cedula: 'V-12345678', telefono_codigo: '+58', telefono_numero: '414 123 4567',
  }, files());
  assert.equal(datos.telefono, '584141234567');
  assert.deepEqual(datos.personas_autorizadas, []);
  assert.equal(datos.madre.nombres, null);
});
