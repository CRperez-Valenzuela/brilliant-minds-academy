'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { sanitizarTelefono } = require('../utils/telefono');
const { usdABs, sumar, horasPorTarifa } = require('../utils/dinero');
const { hoyCaracas, diasEntre, esFechaValida, limitesPeriodo, esPeriodoValido } = require('../utils/fechas');
const { validar, paginacion } = require('../utils/validar');
const { detectarTipo, nombreCarpeta, segmentoSeguro } = require('../utils/archivos');
const { Semaforo } = require('../utils/semaforo');

test('teléfono: una sola cadena sin espacios ni separadores', () => {
  assert.equal(sanitizarTelefono('+58', '414 123-4567'), '584141234567');
  assert.equal(sanitizarTelefono('0414 123 4567'), '584141234567');
  assert.equal(sanitizarTelefono('+58', '0414 1234567'), '584141234567');
  assert.equal(sanitizarTelefono('(0412) 765.43.21'), '584127654321');
  assert.equal(sanitizarTelefono('+1 (305) 555-0100'), '13055550100');
  assert.ok(!/\s/.test(sanitizarTelefono(' 58 ', ' 424 000 0000 ')));
});

test('teléfono: rechaza longitudes inválidas con AppError 422', () => {
  assert.throws(() => sanitizarTelefono('123'), (e) => e.status === 422 && e.codigo === 'VALIDACION');
  assert.throws(() => sanitizarTelefono('1'.repeat(16)), (e) => e.status === 422);
});

test('dinero: conversión USD→Bs exacta (sin errores de coma flotante)', () => {
  assert.equal(usdABs(10, 36.5123), 365.12);
  assert.equal(usdABs(0.1, 3), 0.3);
  assert.equal(usdABs(100.15, 40.2), 4026.03);
  assert.equal(sumar(0.1, 0.2), 0.3);
  assert.equal(horasPorTarifa(7.5, 12.4), 93);
});

test('fechas: "hoy" se evalúa en Caracas (UTC-4)', () => {
  assert.equal(hoyCaracas(Date.parse('2026-10-22T02:30:00Z')), '2026-10-21'); // 22:30 del 21 en Caracas
  assert.equal(hoyCaracas(Date.parse('2026-10-22T04:00:00Z')), '2026-10-22');
  assert.equal(diasEntre('2026-10-21', '2026-10-25'), 4);
  assert.ok(esFechaValida('2026-02-28') && !esFechaValida('2026-02-30') && !esFechaValida('2026-13-01'));
  assert.ok(esPeriodoValido('2026-10') && !esPeriodoValido('2026-13'));
  const l = limitesPeriodo('2026-02');
  assert.equal(l.hasta, '2026-02-28');
  assert.equal(l.inicioUtc.toISOString(), '2026-02-01T04:00:00.000Z');
});

test('validar: acumula todos los errores y descarta campos no declarados', () => {
  const reglas = { nombre: { requerido: true, max: 5 }, edad: { tipo: 'entero', min: 1 }, tipo: { tipo: 'enum', valores: ['a', 'b'] }, monto: { tipo: 'decimal', positivo: true } };
  assert.throws(() => validar({ nombre: 'demasiado', edad: 'x', tipo: 'z', monto: 0 }, reglas), (e) => e.status === 422 && e.detalles.length === 4);
  const limpio = validar({ nombre: ' Ana ', edad: '7', extra: 'hack', monto: '10,50' }, reglas);
  assert.deepEqual(limpio, { nombre: 'Ana', edad: 7, tipo: null, monto: 10.5 });
  assert.throws(() => validar({ monto: 1.005 }, { monto: { tipo: 'decimal' } }), (e) => e.detalles[0].campo === 'monto');
  assert.deepEqual(paginacion({ pagina: '0', limite: '9999' }), { pagina: 1, limite: 200, offset: 0 });
});

test('archivos: detecta el tipo REAL por magic bytes (no por el mimetype declarado)', () => {
  assert.equal(detectarTipo(Buffer.from([0xff, 0xd8, 0xff, 0xe0])).mime, 'image/jpeg');
  assert.equal(detectarTipo(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d])).mime, 'image/png');
  assert.equal(detectarTipo(Buffer.from('%PDF-1.7')).mime, 'application/pdf');
  assert.equal(detectarTipo(Buffer.from('MZ\x90\x00 ejecutable')), null);
  assert.equal(detectarTipo(Buffer.from('<?php echo 1;')), null);
});

test('archivos: carpeta de Drive "Nombre_Apellido_ID" sin caracteres peligrosos', () => {
  assert.equal(nombreCarpeta('María José', 'Pérez Gómez', 42), 'María_Pérez_42');
  assert.equal(nombreCarpeta('../../etc', 'pa/ss*wd', 7), 'etc_passwd_7');
  assert.ok(!/[\\/:*?"<>|.\s]/.test(nombreCarpeta('../../etc/passwd', 'x y', 1)));
  assert.equal(segmentoSeguro('A  B'), 'A_B');
});

test('semáforo: limita la concurrencia y libera una sola vez', () => {
  const s = new Semaforo(2);
  const a = s.intentar();
  const b = s.intentar();
  assert.equal(s.intentar(), null);
  a(); a(); // idempotente
  assert.ok(s.intentar());
  assert.equal(s.enUso, 2);
  b();
});
