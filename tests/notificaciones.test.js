'use strict';
const { db } = require('./helpers/entorno');
const test = require('node:test');
const assert = require('node:assert/strict');
const { generarAlerta, MODO_PREVENTIVA } = require('../services/notificaciones.service');
const { AppError } = require('../errors/AppError');

const AHORA = () => Date.parse('2026-10-21T20:00:00-04:00'); // hoy en Caracas = 2026-10-21
const rs = (...filas) => ({ rows: filas, rowCount: filas.length });

function programar({ estado = 'Activo', cuotaProxima, vencidas = [] }) {
  db.reiniciar();
  db.handler = async (texto) => {
    if (/FROM vw_estudiantes_estado v JOIN representantes/.test(texto)) {
      return rs({ id: 1, nombres: 'Luis', apellidos: 'Pérez', estado_dinamico: estado, rep_nombres: 'Ana', rep_apellidos: 'Pérez', telefono: '584141234567' });
    }
    if (/fecha_vencimiento BETWEEN \$2::date AND \$3::date/.test(texto)) return cuotaProxima ? rs(cuotaProxima) : rs(); // modo MES_ENTRANTE (ventana de pago)
    if (/FROM cuotas WHERE estudiante_id = \$1 AND estado = 'Pendiente' AND fecha_vencimiento >= \$2/.test(texto)) return cuotaProxima ? rs(cuotaProxima) : rs();
    if (/fecha_vencimiento < \$2 ORDER BY/.test(texto)) return rs(...vencidas);
    if (/FROM cuentas_pago/.test(texto)) return rs({ id: 1, metodo: 'ZELLE', titular: 'BMA LLC', detalle: 'pagos@bma.example' });
    if (/INSERT INTO notificaciones_whatsapp/.test(texto)) return rs({ id: 99 });
    return rs();
  };
}

const bcvFresca = (extra = {}) => {
  const llamadas = [];
  return { llamadas, obtenerTasa: async (opts) => { llamadas.push(opts); return { tasa: 36.5123, capturadaEn: new Date(AHORA()), desactualizada: false, ...extra }; } };
};
const wa = (falla) => {
  const enviados = [];
  return { enviados, enviarTexto: async (to, txt) => { if (falla) throw falla; enviados.push({ to, txt }); } };
};
const sqlUsado = (re) => db.llamadas.some((l) => re.test(l.texto));

test('preventiva: fuera de la ventana 3–5 días → 422 FUERA_DE_VENTANA_PREVENTIVA y no se crea nada', async () => {
  programar({ cuotaProxima: { id: 7, concepto: 'Mensualidad', monto_usd: '50.00', fecha_vencimiento: '2026-10-23' } }); // faltan 2
  await assert.rejects(
    generarAlerta({ tipo: 'PREVENTIVA', estudianteId: 1, usuarioId: 3 }, { bcvSvc: bcvFresca(), waSvc: wa(), ahora: AHORA }),
    (e) => e.status === 422 && e.codigo === 'FUERA_DE_VENTANA_PREVENTIVA' && e.detalles.dias_restantes === 2,
  );
  assert.ok(!sqlUsado(/INSERT INTO notificaciones_whatsapp/));
  programar({ cuotaProxima: { id: 7, concepto: 'Mensualidad', monto_usd: '50.00', fecha_vencimiento: '2026-10-27' } }); // faltan 6
  await assert.rejects(generarAlerta({ tipo: 'PREVENTIVA', estudianteId: 1 }, { bcvSvc: bcvFresca(), waSvc: wa(), ahora: AHORA }), (e) => e.codigo === 'FUERA_DE_VENTANA_PREVENTIVA');
});

test('preventiva (4 días): consulta la tasa FRESCA, convierte a Bs., genera link único y no envía por defecto', async () => {
  programar({ cuotaProxima: { id: 7, concepto: 'Mensualidad noviembre', monto_usd: '50.00', fecha_vencimiento: '2026-10-25' } });
  const bcv = bcvFresca(); const w = wa();
  const r = await generarAlerta({ tipo: 'PREVENTIVA', estudianteId: 1, usuarioId: 3 }, { bcvSvc: bcv, waSvc: w, ahora: AHORA });
  assert.deepEqual(bcv.llamadas, [{ fresca: true }]);
  assert.equal(r.estado, 'GENERADA');
  assert.equal(r.monto_usd, 50);
  assert.equal(r.monto_bs, 1825.62);
  assert.match(r.mensaje, /recordatorio amable/);
  assert.match(r.mensaje, /http:\/\/localhost:3000\/portal\/[a-f0-9]{48}/);
  assert.ok(r.enlace_whatsapp.startsWith('https://wa.me/584141234567?text='));
  assert.equal(w.enviados.length, 0);
  assert.ok(sqlUsado(/INSERT INTO portal_tokens/));
});

test('envío real: éxito marca ENVIADA; si Meta rechaza queda FALLIDA y el error JSON se propaga', async () => {
  programar({ cuotaProxima: { id: 7, concepto: 'M', monto_usd: '50.00', fecha_vencimiento: '2026-10-25' } });
  const w = wa();
  const r = await generarAlerta({ tipo: 'PREVENTIVA', estudianteId: 1, enviar: true }, { bcvSvc: bcvFresca(), waSvc: w, ahora: AHORA });
  assert.equal(r.estado, 'ENVIADA');
  assert.equal(w.enviados[0].to, '584141234567');
  assert.ok(sqlUsado(/estado = 'ENVIADA'/));

  programar({ cuotaProxima: { id: 7, concepto: 'M', monto_usd: '50.00', fecha_vencimiento: '2026-10-25' } });
  const meta = new AppError(502, 'WHATSAPP_ENVIO_FALLIDO', 'Meta rechazó', { motivo: 'Meta 131047: ventana de 24 h' });
  await assert.rejects(generarAlerta({ tipo: 'PREVENTIVA', estudianteId: 1, enviar: true }, { bcvSvc: bcvFresca(), waSvc: wa(meta), ahora: AHORA }), (e) => e.status === 502);
  const fallida = db.llamadas.find((l) => /estado = 'FALLIDA'/.test(l.texto));
  assert.ok(fallida, 'debe registrar la notificación como FALLIDA');
  assert.match(fallida.params[1], /131047/);
});

test('tasa desactualizada → 503 TASA_BCV_DESACTUALIZADA: no se cobra con una tasa vieja', async () => {
  programar({ cuotaProxima: { id: 7, concepto: 'M', monto_usd: '50.00', fecha_vencimiento: '2026-10-25' } });
  await assert.rejects(
    generarAlerta({ tipo: 'PREVENTIVA', estudianteId: 1 }, { bcvSvc: bcvFresca({ desactualizada: true }), waSvc: wa(), ahora: AHORA }),
    (e) => e.status === 503 && e.codigo === 'TASA_BCV_DESACTUALIZADA',
  );
  assert.ok(!sqlUsado(/INSERT INTO notificaciones_whatsapp/));
});

test('preventiva solo para estudiantes Activos', async () => {
  programar({ estado: 'Moroso', cuotaProxima: null });
  await assert.rejects(generarAlerta({ tipo: 'PREVENTIVA', estudianteId: 1 }, { bcvSvc: bcvFresca(), waSvc: wa(), ahora: AHORA }), (e) => e.codigo === 'ESTADO_NO_APLICA');
});

test('morosidad: solo para Morosos; suma las cuotas vencidas, incluye cuentas y exige registrar la referencia', async () => {
  programar({ estado: 'Activo' });
  await assert.rejects(generarAlerta({ tipo: 'MOROSIDAD', estudianteId: 1 }, { bcvSvc: bcvFresca(), waSvc: wa(), ahora: AHORA }), (e) => e.codigo === 'ESTUDIANTE_NO_MOROSO');

  programar({ estado: 'Moroso', vencidas: [
    { id: 4, monto_usd: '40.00', fecha_vencimiento: '2026-10-10' }, { id: 5, monto_usd: '10.10', fecha_vencimiento: '2026-10-18' },
  ] });
  const r = await generarAlerta({ tipo: 'MOROSIDAD', estudianteId: 1 }, { bcvSvc: bcvFresca(), waSvc: wa(), ahora: AHORA });
  assert.equal(r.monto_usd, 50.1);
  assert.equal(r.monto_bs, 1829.27); // 50.10 × 36.5123 = 1829.26623 → 1829.27
  assert.match(r.mensaje, /Estimado\(a\) Ana Pérez/);
  assert.match(r.mensaje, /Zelle: pagos@bma\.example/);
  assert.match(r.mensaje, /indispensable registrar la referencia/);
  assert.match(r.mensaje, /vencida desde hace 11 días/); // 2026-10-10 → 2026-10-21

  programar({ estado: 'Moroso', vencidas: [] }); // todas sus cuotas vencidas ya tienen referencia en revisión
  await assert.rejects(generarAlerta({ tipo: 'MOROSIDAD', estudianteId: 1 }, { bcvSvc: bcvFresca(), waSvc: wa(), ahora: AHORA }), (e) => e.codigo === 'PAGO_EN_REVISION');
});

// ───────────────────────── Modo MES_ENTRANTE (regla de los 10 días, bot de cobranza) ─────────────────────────

const AHORA_FIN_MES = () => Date.parse('2026-10-30T20:00:00-04:00'); // hoy en Caracas = 2026-10-30: faltan 2 días para noviembre
const CUOTA_VENTANA = { id: 8, concepto: 'Mensualidad noviembre', monto_usd: '50.00', fecha_vencimiento: '2026-11-10' };

test('MES_ENTRANTE: 2 días antes del mes entrante toma la cuota de la ventana de pago (días 1–10), con tasa fresca y enlace único del portal', async () => {
  programar({ cuotaProxima: CUOTA_VENTANA });
  const bcv = bcvFresca();
  const r = await generarAlerta({ tipo: 'PREVENTIVA', estudianteId: 1, enviar: false, usuarioId: null, modoPreventiva: MODO_PREVENTIVA.MES_ENTRANTE }, { bcvSvc: bcv, waSvc: wa(), ahora: AHORA_FIN_MES });
  assert.equal(r.estado, 'GENERADA');
  assert.equal(r.monto_usd, 50);
  assert.match(r.mensaje, /vence en 11 días/); // 2026-10-30 → 2026-11-10
  assert.match(r.mensaje, /Vence: 10\/11\/2026/);
  assert.match(r.mensaje, /http:\/\/localhost:3000\/portal\/[a-f0-9]{48}/, 'lleva el enlace seguro con token del portal');
  assert.deepEqual(bcv.llamadas, [{ fresca: true }]);
  const consulta = db.llamadas.find((l) => /fecha_vencimiento BETWEEN \$2::date AND \$3::date/.test(l.texto));
  assert.deepEqual(consulta.params, [1, '2026-11-01', '2026-11-10'], 'parámetros posicionales: estudiante y ventana de pago del mes entrante');
  assert.ok(!/\b(TOP|GETDATE|DATEADD|ISNULL|dbo\.|@\w+)\b/i.test(consulta.texto), 'sin residuos de T-SQL');
});

test('MES_ENTRANTE: el último día del mes también vale (1 día antes) y también cuando el mes entrante es del año siguiente', async () => {
  for (const [ahora, venc] of [['2026-10-31T09:00:00-04:00', '2026-11-10'], ['2026-12-31T09:00:00-04:00', '2027-01-10']]) {
    programar({ cuotaProxima: { ...CUOTA_VENTANA, fecha_vencimiento: venc } });
    const r = await generarAlerta({ tipo: 'PREVENTIVA', estudianteId: 1, modoPreventiva: MODO_PREVENTIVA.MES_ENTRANTE }, { bcvSvc: bcvFresca(), waSvc: wa(), ahora: () => Date.parse(ahora) });
    assert.equal(r.estado, 'GENERADA', ahora);
  }
});

test('MES_ENTRANTE: fuera de los 2 últimos días del mes → 422 FUERA_DE_VENTANA_PREVENTIVA, sin consultar cuotas ni crear nada (aunque la cuota esté a 3–5 días)', async () => {
  // 2026-10-21 y vencimiento 2026-10-25 = 4 días: en modo MANUAL sería válida; en MES_ENTRANTE no lo es.
  programar({ cuotaProxima: { id: 7, concepto: 'M', monto_usd: '50.00', fecha_vencimiento: '2026-10-25' } });
  await assert.rejects(
    generarAlerta({ tipo: 'PREVENTIVA', estudianteId: 1, modoPreventiva: MODO_PREVENTIVA.MES_ENTRANTE }, { bcvSvc: bcvFresca(), waSvc: wa(), ahora: AHORA }),
    (e) => e.status === 422 && e.codigo === 'FUERA_DE_VENTANA_PREVENTIVA' && e.detalles.dias_para_mes_entrante === 11,
  );
  assert.ok(!sqlUsado(/INSERT INTO notificaciones_whatsapp/));
  assert.ok(!sqlUsado(/fecha_vencimiento BETWEEN/), 'la fecha se rechaza antes de tocar las cuotas');
});

test('MES_ENTRANTE: sin cuota pendiente en la ventana → SIN_CUOTA_PROXIMA; estudiante no Activo → ESTADO_NO_APLICA (el bot los omite)', async () => {
  programar({ cuotaProxima: null });
  await assert.rejects(generarAlerta({ tipo: 'PREVENTIVA', estudianteId: 1, modoPreventiva: MODO_PREVENTIVA.MES_ENTRANTE }, { bcvSvc: bcvFresca(), waSvc: wa(), ahora: AHORA_FIN_MES }), (e) => e.codigo === 'SIN_CUOTA_PROXIMA');
  programar({ estado: 'Moroso', cuotaProxima: CUOTA_VENTANA });
  await assert.rejects(generarAlerta({ tipo: 'PREVENTIVA', estudianteId: 1, modoPreventiva: MODO_PREVENTIVA.MES_ENTRANTE }, { bcvSvc: bcvFresca(), waSvc: wa(), ahora: AHORA_FIN_MES }), (e) => e.codigo === 'ESTADO_NO_APLICA');
});

test('el modo por defecto sigue siendo MANUAL (3–5 días del panel) y un modo desconocido es un error de programación, no un modo silencioso', async () => {
  // 2026-10-30 con vencimiento 2026-11-10 = 11 días: el botón manual lo rechaza por la ventana de 3–5 días, como siempre.
  programar({ cuotaProxima: CUOTA_VENTANA });
  await assert.rejects(generarAlerta({ tipo: 'PREVENTIVA', estudianteId: 1 }, { bcvSvc: bcvFresca(), waSvc: wa(), ahora: AHORA_FIN_MES }), (e) => e.codigo === 'FUERA_DE_VENTANA_PREVENTIVA' && e.detalles.dias_restantes === 11);
  assert.equal(MODO_PREVENTIVA.MANUAL, 'MANUAL');
  await assert.rejects(generarAlerta({ tipo: 'PREVENTIVA', estudianteId: 1, modoPreventiva: 'CUALQUIERA' }, { bcvSvc: bcvFresca(), waSvc: wa(), ahora: AHORA_FIN_MES }), TypeError);
});

test('la morosidad no depende del modo preventivo: mismas reglas con el bot que desde el panel', async () => {
  programar({ estado: 'Moroso', vencidas: [{ id: 4, monto_usd: '40.00', fecha_vencimiento: '2026-11-10' }] });
  const ahora = () => Date.parse('2026-11-11T08:00:00-04:00'); // día 11: primer día de mora
  const r = await generarAlerta({ tipo: 'MOROSIDAD', estudianteId: 1, modoPreventiva: MODO_PREVENTIVA.MES_ENTRANTE }, { bcvSvc: bcvFresca(), waSvc: wa(), ahora });
  assert.equal(r.monto_usd, 40);
  assert.match(r.mensaje, /vencida desde hace 1 día\b/); // vencimiento el 10; el día 11 lleva 1 día de mora
});
