'use strict';
// Parseo de la ingesta de la Sede Este con datos SINTÉTICOS (ningún dato real de alumnos vive en el repositorio).
const test = require('node:test');
const assert = require('node:assert/strict');
const imp = require('../scripts/importar_este.js');

const ENC = ['Grupo / Día', 'Num', 'Apellido(s)', 'Nombre(s)', 'Edad', 'Fecha de Inscripción', 'Nombre del Representante', 'Teléfono de Contacto', 'Correo electronico'];
const alumno = (a, ap, no, ed, rep, tel, mail) => [a, 1, ap, no, ed, '2026-09-01 00:00:00', rep, tel, mail];

test('sanearTelefono: solo dígitos, 10–15, celular sin 0 inicial, +58 y varios números', () => {
  assert.equal(imp.sanearTelefono('0414 - 1234567'), '04141234567');
  assert.equal(imp.sanearTelefono('+58 414 1234567'), '04141234567');
  assert.equal(imp.sanearTelefono('4141234567'), '04141234567');
  assert.equal(imp.sanearTelefono('123 / 0412-7654321'), '04127654321');
  assert.equal(imp.sanearTelefono('sin teléfono'), null);
  assert.equal(imp.sanearTelefono(''), null);
});

test('sanearNombre y partirNombreCompleto: espacios, símbolos y mayúsculas', () => {
  assert.equal(imp.sanearNombre('  ANA   MARÍA  '), 'Ana María');
  assert.equal(imp.sanearNombre('Luis<script>1'), 'Luis script');
  assert.deepEqual(imp.partirNombreCompleto('Marta Gil'), { nombres: 'Marta', apellidos: 'Gil' });
  assert.deepEqual(imp.partirNombreCompleto('Rosa'), { nombres: 'Rosa', apellidos: '-' });
  assert.deepEqual(imp.partirNombreCompleto('Ana María Pérez Gil'), { nombres: 'Ana María', apellidos: 'Pérez Gil' });
  assert.equal(imp.partirNombreCompleto('   '), null);
});

test('correo, edad, fecha aproximada y cédula provisional determinista (≤ 20 caracteres)', () => {
  assert.equal(imp.sanearCorreo(' Padre@Ejemplo.COM  otro'), 'padre@ejemplo.com');
  assert.equal(imp.sanearCorreo('no tiene'), null);
  assert.equal(imp.leerEdad('7 años'), 7);
  assert.equal(imp.leerEdad('x'), null);
  assert.equal(imp.fechaNacimientoAproximada(2026, 7), '2019-07-01');
  const c = imp.cedulaProvisional('Marta Gil', '04141234567');
  assert.match(c, /^IMP-[0-9A-F]{12}$/);
  assert.equal(c, imp.cedulaProvisional('MARTA GIL', '04141234567'));
  assert.notEqual(c, imp.cedulaProvisional('Marta Gil', '04147654321'));
});

test('leerHoja: nivel por bloque, adulto es su propio representante y anomalías sin datos personales', () => {
  const m = [
    [], [],
    ENC,
    alumno('1.Miércoles y viernes', 'Prueba Uno', 'Niña', 6, 'Madre Uno', '0414-1111111', 'a@b.co'),
    alumno('(kids 1 B Sede', 'Prueba Dos', 'Niño', 7, 'Madre Dos', '0414-2222222', null),
    alumno('2:15 - 4:00', 'Prueba Tres', 'Otro', 8, 'Madre Tres', '0414-3333333', null),
    alumno('2.2 Miercoles y viernes', 'Prueba Cuatro', 'Peque', 9, 'Madre Cuatro', '0414-4444444', null),
    alumno('(Beginner B)', 'Prueba Cinco', 'Peque', 10, 'Madre Cinco', '', null),
    alumno('3.2 Teacher (adultos)', 'Adulto', 'Alguien', 30, '', '0412-5555555', null),
    alumno('4 Personalizado', 'Sin', 'Nivel', 9, 'Madre Siete', '0414-7777777', null),
  ];
  const r = imp.leerHoja(m, 'Hoja', 2026);
  assert.deepEqual(r.alumnos.map((a) => a.nivel), ['Kids 1 B', 'Kids 1 B', 'Kids 1 B', 'Beginner B', 'Adultos']);
  assert.equal(r.alumnos[0].telefono, '04141111111');
  const adulto = r.alumnos[4];
  assert.deepEqual([adulto.representante.nombres, adulto.representante.apellidos], ['Alguien', 'Adulto']);
  assert.deepEqual(r.anomalias.map((x) => x.fila), [8, 10]);
  for (const x of r.anomalias) assert.deepEqual(Object.keys(x).sort(), ['fila', 'hoja', 'motivo']);
});

test('leerHoja: sin encabezados informa la anomalía; leerArgumentos valida', () => {
  assert.equal(imp.leerHoja([[1, 2]], 'X', 2026).anomalias.length, 1);
  assert.throws(() => imp.leerArgumentos([], {}), /--archivo/);
  assert.throws(() => imp.leerArgumentos(['--archivo', 'a.xlsx', '--vence', '5/12'], {}), /AAAA-MM-DD/);
  assert.equal(imp.leerArgumentos(['--archivo', 'a.xlsx', '--dry-run'], {}).dryRun, true);
});
