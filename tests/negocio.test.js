'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { calcularNomina } = require('../services/nomina.calc');
const { plantillaPreventiva, plantillaMorosidad } = require('../services/plantillas.whatsapp');

test('nómina mixta: Fijo, Honorarios y Mixto', () => {
  assert.deepEqual(calcularNomina({ modalidad: 'Fijo', salarioFijoUsd: 400, tarifaHoraUsd: 0, horas: 30 }),
    { montoFijoUsd: 400, horasTotales: 30, tarifaHoraUsd: 0, montoHorasUsd: 0, totalUsd: 400 });
  assert.deepEqual(calcularNomina({ modalidad: 'Honorarios', salarioFijoUsd: 0, tarifaHoraUsd: 8.5, horas: 20 }),
    { montoFijoUsd: 0, horasTotales: 20, tarifaHoraUsd: 8.5, montoHorasUsd: 170, totalUsd: 170 });
  const m = calcularNomina({ modalidad: 'Mixto', salarioFijoUsd: 250, tarifaHoraUsd: 7.25, horas: 12.5 });
  assert.equal(m.montoHorasUsd, 90.63); // 12.5 × 7.25 = 90.625 → redondeo mitad hacia arriba
  assert.equal(m.totalUsd, 340.63);
  assert.throws(() => calcularNomina({ modalidad: 'Otro' }));
});

const base = {
  academia: 'Brilliant Minds Academy', representante: 'Ana Pérez', estudiante: 'Luis Pérez', montoUsd: 50, montoBs: 1825.62, tasa: 36.5123,
  enlacePortal: 'https://bma.example/portal/abc',
};

test('plantilla preventiva: tono amable con montos USD/Bs, tasa BCV y link único', () => {
  const t = plantillaPreventiva({ ...base, concepto: 'Mensualidad noviembre', fechaVencimiento: '2026-11-05', diasRestantes: 4 });
  assert.match(t, /recordatorio amable/);
  assert.match(t, /vence en 4 días/);
  assert.match(t, /US\$ 50\.00/);
  assert.match(t, /Bs\./);
  assert.match(t, /tasa BCV de hoy/);
  assert.match(t, /05\/11\/2026/);
  assert.ok(t.includes(base.enlacePortal));
});

test('plantilla morosidad: tono formal, cuentas de pasarelas e indispensable registrar la referencia', () => {
  const t = plantillaMorosidad({ ...base, diasMora: 1, cuentas: [
    { metodo: 'ZELLE', titular: 'BMA LLC', detalle: 'pagos@bma.example' }, { metodo: 'PAGO_MOVIL', titular: 'BMA CA', detalle: '0102 · 0412… · J-000' },
  ] });
  assert.match(t, /Estimado\(a\) Ana Pérez/);
  assert.match(t, /vencida desde hace 1 día\b/);
  assert.match(t, /Zelle: pagos@bma\.example/);
  assert.match(t, /Pago Móvil/);
  assert.match(t, /indispensable registrar la referencia/);
  assert.match(t, /acceso a clases/);
  assert.ok(t.includes(base.enlacePortal));
});
