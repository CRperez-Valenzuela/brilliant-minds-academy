'use strict';
// «Regla de los 10 días»: la mensualidad se paga solo del día 1 al 10; preventiva 1–2 días antes del mes entrante; mora desde el día 11.
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  DIA_FIN_VENTANA_PAGO, DIA_INICIO_MOROSIDAD, DIAS_ANTES_PREVENTIVA,
  inicioMesEntrante, diasParaMesEntrante, ventanaPagoMesEntrante, esDiaPreventivo, esDiaMorosidad, calendarioCobranza,
} = require('../utils/calendario-cobranza');

test('constantes de negocio: ventana de pago hasta el día 10, mora desde el 11, preventiva a 1–2 días del mes entrante', () => {
  assert.equal(DIA_FIN_VENTANA_PAGO, 10);
  assert.equal(DIA_INICIO_MOROSIDAD, 11);
  assert.deepEqual({ ...DIAS_ANTES_PREVENTIVA }, { min: 1, max: 2 });
  assert.ok(Object.isFrozen(DIAS_ANTES_PREVENTIVA));
});

test('inicioMesEntrante: primer día del mes siguiente, saltando de diciembre a enero del año siguiente', () => {
  assert.equal(inicioMesEntrante('2026-10-05'), '2026-11-01');
  assert.equal(inicioMesEntrante('2026-11-30'), '2026-12-01');
  assert.equal(inicioMesEntrante('2026-12-31'), '2027-01-01');
  assert.equal(inicioMesEntrante('2028-02-29'), '2028-03-01');
});

test('ventana de pago del mes entrante: del día 1 al día 10, ambos inclusive', () => {
  assert.deepEqual(ventanaPagoMesEntrante('2026-10-30'), { desde: '2026-11-01', hasta: '2026-11-10' });
  assert.deepEqual(ventanaPagoMesEntrante('2026-12-31'), { desde: '2027-01-01', hasta: '2027-01-10' });
});

test('preventiva: los DOS últimos días de cada mes, sea cual sea su longitud (28, 29, 30 o 31 días)', () => {
  const dias = (...lista) => lista.map((d) => [d, esDiaPreventivo(d)]);
  assert.deepEqual(dias('2026-11-28', '2026-11-29', '2026-11-30'), [['2026-11-28', false], ['2026-11-29', true], ['2026-11-30', true]]); // 30 días: 29 y 30
  assert.deepEqual(dias('2026-10-29', '2026-10-30', '2026-10-31'), [['2026-10-29', false], ['2026-10-30', true], ['2026-10-31', true]]); // 31 días: 30 y 31
  assert.deepEqual(dias('2027-02-26', '2027-02-27', '2027-02-28'), [['2027-02-26', false], ['2027-02-27', true], ['2027-02-28', true]]); // febrero común
  assert.deepEqual(dias('2028-02-27', '2028-02-28', '2028-02-29'), [['2028-02-27', false], ['2028-02-28', true], ['2028-02-29', true]]); // febrero bisiesto
  assert.equal(diasParaMesEntrante('2026-10-31'), 1);
  assert.equal(diasParaMesEntrante('2026-10-30'), 2);
});

test('preventiva: ningún día del mes que no sea de los dos últimos dispara el aviso (recorre un mes completo)', () => {
  const dispara = [];
  for (let d = 1; d <= 30; d += 1) if (esDiaPreventivo(`2026-11-${String(d).padStart(2, '0')}`)) dispara.push(d);
  assert.deepEqual(dispara, [29, 30]);
});

test('morosidad: nunca en la ventana de pago (días 1–10) y todos los días desde el 11 hasta fin de mes', () => {
  const con = [];
  for (let d = 1; d <= 31; d += 1) if (esDiaMorosidad(`2026-10-${String(d).padStart(2, '0')}`)) con.push(d);
  assert.deepEqual(con, Array.from({ length: 21 }, (_, i) => i + 11)); // 11 … 31
  assert.equal(esDiaMorosidad('2026-11-10'), false);
  assert.equal(esDiaMorosidad('2026-11-11'), true);
});

test('calendarioCobranza resume qué toca hoy: ventana de pago = nada; día 11–28 = solo mora; últimos 2 días = ambos', () => {
  assert.deepEqual(calendarioCobranza('2026-11-05'), { preventiva: false, morosidad: false, ventana: { desde: '2026-12-01', hasta: '2026-12-10' } });
  assert.deepEqual(calendarioCobranza('2026-11-20'), { preventiva: false, morosidad: true, ventana: { desde: '2026-12-01', hasta: '2026-12-10' } });
  assert.deepEqual(calendarioCobranza('2026-11-29'), { preventiva: true, morosidad: true, ventana: { desde: '2026-12-01', hasta: '2026-12-10' } });
});

test('una fecha inválida es un error de programación (TypeError), no un día «que no toca» silencioso', () => {
  for (const mala of ['2026-02-30', '2026-13-01', 'ayer', '', undefined, null]) {
    assert.throws(() => calendarioCobranza(mala), TypeError, String(mala));
  }
});
