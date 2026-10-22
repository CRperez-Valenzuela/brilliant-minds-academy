'use strict';
const { db } = require('./helpers/entorno');
const test = require('node:test');
const assert = require('node:assert/strict');
const { generarAlerta } = require('../services/notificaciones.service');
const { AppError } = require('../errors/AppError');

const AHORA = () => Date.parse('2026-10-21T20:00:00-04:00'); // hoy en Caracas = 2026-10-21
const rs = (...filas) => ({ recordset: filas, rowsAffected: [filas.length] });

function programar({ estado = 'Activo', cuotaProxima, vencidas = [] }) {
  db.reiniciar();
  db.handler = async (texto) => {
    if (/FROM dbo\.vw_estudiantes_estado v JOIN dbo\.representantes/.test(texto)) {
      return rs({ id: 1, nombres: 'Luis', apellidos: 'Pérez', estado_dinamico: estado, rep_nombres: 'Ana', rep_apellidos: 'Pérez', telefono: '584141234567' });
    }
    if (/SELECT TOP 1 id, concepto/.test(texto)) return cuotaProxima ? rs(cuotaProxima) : rs();
    if (/fecha_vencimiento < @hoy ORDER BY/.test(texto)) return rs(...vencidas);
    if (/FROM dbo\.cuentas_pago/.test(texto)) return rs({ id: 1, metodo: 'ZELLE', titular: 'BMA LLC', detalle: 'pagos@bma.example' });
    if (/INSERT INTO dbo\.notificaciones_whatsapp/.test(texto)) return rs({ id: 99 });
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
  assert.ok(!sqlUsado(/INSERT INTO dbo\.notificaciones_whatsapp/));
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
  assert.ok(sqlUsado(/INSERT INTO dbo\.portal_tokens/));
});

test('envío real: éxito marca ENVIADA; si Meta rechaza queda FALLIDA y el error JSON se propaga', async () => {
  programar({ cuotaProxima: { id: 7, concepto: 'M', monto_usd: '50.00', fecha_vencimiento: '2026-10-25' } });
  const w = wa();
  const r = await generarAlerta({ tipo: 'PREVENTIVA', estudianteId: 1, enviar: true }, { bcvSvc: bcvFresca(), waSvc: w, ahora: AHORA });
  assert.equal(r.estado, 'ENVIADA');
  assert.equal(w.enviados[0].to, '584141234567');
  assert.ok(sqlUsado(/estado = N'ENVIADA'/));

  programar({ cuotaProxima: { id: 7, concepto: 'M', monto_usd: '50.00', fecha_vencimiento: '2026-10-25' } });
  const meta = new AppError(502, 'WHATSAPP_ENVIO_FALLIDO', 'Meta rechazó', { motivo: 'Meta 131047: ventana de 24 h' });
  await assert.rejects(generarAlerta({ tipo: 'PREVENTIVA', estudianteId: 1, enviar: true }, { bcvSvc: bcvFresca(), waSvc: wa(meta), ahora: AHORA }), (e) => e.status === 502);
  const fallida = db.llamadas.find((l) => /estado = N'FALLIDA'/.test(l.texto));
  assert.ok(fallida, 'debe registrar la notificación como FALLIDA');
  assert.match(fallida.params.er[1], /131047/);
});

test('tasa desactualizada → 503 TASA_BCV_DESACTUALIZADA: no se cobra con una tasa vieja', async () => {
  programar({ cuotaProxima: { id: 7, concepto: 'M', monto_usd: '50.00', fecha_vencimiento: '2026-10-25' } });
  await assert.rejects(
    generarAlerta({ tipo: 'PREVENTIVA', estudianteId: 1 }, { bcvSvc: bcvFresca({ desactualizada: true }), waSvc: wa(), ahora: AHORA }),
    (e) => e.status === 503 && e.codigo === 'TASA_BCV_DESACTUALIZADA',
  );
  assert.ok(!sqlUsado(/INSERT INTO dbo\.notificaciones_whatsapp/));
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
