'use strict';
const { sql, ejecutar } = require('../config/db');
const cfg = require('../config/env');
const { e } = require('../errors/AppError');
const { hoyCaracas, diasEntre, aFechaSql } = require('../utils/fechas');
const { usdABs, sumar } = require('../utils/dinero');
const { bcv } = require('./bcv.service');
const { whatsapp } = require('./whatsapp.service');
const parametros = require('./parametros.service');
const portal = require('./portal.service');
const { plantillaPreventiva, plantillaMorosidad } = require('./plantillas.whatsapp');

const ACADEMIA = process.env.ACADEMIA_NOMBRE || 'Brilliant Minds Academy';
const VENTANA_PREVENTIVA = { min: 3, max: 5 };

async function cargarEstudiante(id) {
  const r = await ejecutar(
    `SELECT v.id, v.nombres, v.apellidos, v.estado_dinamico, r.nombres AS rep_nombres, r.apellidos AS rep_apellidos, r.telefono
     FROM dbo.vw_estudiantes_estado v JOIN dbo.representantes r ON r.id = v.representante_id WHERE v.id = @id`, { id: [sql.Int, id] });
  if (!r.recordset.length) throw e.noEncontrado('El estudiante');
  return r.recordset[0];
}

/** Alerta preventiva: solo si el próximo vencimiento cae entre 3 y 5 días (hora de Caracas). */
async function prepararPreventiva(est, hoy) {
  if (est.estado_dinamico !== 'Activo') {
    throw e.reglaNegocio('ESTADO_NO_APLICA', `La alerta preventiva solo aplica a estudiantes Activos (estado actual: ${est.estado_dinamico}).`);
  }
  const r = await ejecutar(
    `SELECT TOP 1 id, concepto, monto_usd, CONVERT(char(10), fecha_vencimiento, 23) AS fecha_vencimiento
     FROM dbo.cuotas WHERE estudiante_id = @e AND estado = N'Pendiente' AND fecha_vencimiento >= @hoy ORDER BY fecha_vencimiento, id`,
    { e: [sql.Int, est.id], hoy: [sql.Date, aFechaSql(hoy)] });
  if (!r.recordset.length) throw e.reglaNegocio('SIN_CUOTA_PROXIMA', 'El estudiante no tiene cuotas pendientes por vencer.');
  const c = r.recordset[0];
  const dias = diasEntre(hoy, c.fecha_vencimiento);
  if (dias < VENTANA_PREVENTIVA.min || dias > VENTANA_PREVENTIVA.max) {
    throw e.reglaNegocio('FUERA_DE_VENTANA_PREVENTIVA',
      `La alerta preventiva se envía de ${VENTANA_PREVENTIVA.min} a ${VENTANA_PREVENTIVA.max} días antes del vencimiento (faltan ${dias}).`,
      { proximo_vencimiento: c.fecha_vencimiento, dias_restantes: dias });
  }
  return { cuotaId: c.id, concepto: c.concepto, montoUsd: Number(c.monto_usd), fechaVencimiento: c.fecha_vencimiento, diasRestantes: dias };
}

/** Alerta por morosidad: solo si el estudiante está Moroso y tiene deuda vencida sin referencia en revisión. */
async function prepararMorosidad(est, hoy) {
  if (est.estado_dinamico !== 'Moroso') {
    throw e.reglaNegocio('ESTUDIANTE_NO_MOROSO', `La alerta por morosidad solo aplica a estudiantes Morosos (estado actual: ${est.estado_dinamico}).`);
  }
  const r = await ejecutar(
    `SELECT id, monto_usd, CONVERT(char(10), fecha_vencimiento, 23) AS fecha_vencimiento
     FROM dbo.cuotas WHERE estudiante_id = @e AND estado = N'Pendiente' AND fecha_vencimiento < @hoy ORDER BY fecha_vencimiento, id`,
    { e: [sql.Int, est.id], hoy: [sql.Date, aFechaSql(hoy)] });
  if (!r.recordset.length) {
    throw e.reglaNegocio('PAGO_EN_REVISION', 'Todas las cuotas vencidas ya tienen una referencia en revisión; no corresponde cobrar de nuevo.');
  }
  const total = sumar(...r.recordset.map((c) => c.monto_usd));
  return { cuotaId: r.recordset[0].id, montoUsd: total, diasMora: diasEntre(r.recordset[0].fecha_vencimiento, hoy) };
}

/**
 * Genera (y opcionalmente envía) una alerta MANUAL-INDIVIDUAL. La tasa BCV se consulta en ese instante
 * (`fresca: true`); si no se logra obtener, NO se genera nada (503) para no cobrar con una tasa vieja.
 */
async function generarAlerta({ tipo, estudianteId, enviar = false, usuarioId }, { bcvSvc = bcv, waSvc = whatsapp, ahora = Date.now } = {}) {
  const hoy = hoyCaracas(ahora());
  const est = await cargarEstudiante(estudianteId);
  const datos = tipo === 'PREVENTIVA' ? await prepararPreventiva(est, hoy) : await prepararMorosidad(est, hoy);

  const tasa = await bcvSvc.obtenerTasa({ fresca: true });
  if (tasa.desactualizada) {
    throw e.noDisponible('TASA_BCV_DESACTUALIZADA', 'No se pudo consultar la tasa BCV en este momento. No se genera la alerta para evitar cobrar con una tasa desactualizada.');
  }
  const montoBs = usdABs(datos.montoUsd, tasa.tasa);
  const token = await portal.emitirToken(est.id);
  const enlacePortal = `${cfg.portalBaseUrl}/portal/${token}`;
  const representante = `${est.rep_nombres} ${est.rep_apellidos}`;
  const estudiante = `${est.nombres} ${est.apellidos}`;

  const mensaje = tipo === 'PREVENTIVA'
    ? plantillaPreventiva({ academia: ACADEMIA, representante, estudiante, concepto: datos.concepto, montoUsd: datos.montoUsd, montoBs, tasa: tasa.tasa,
        fechaVencimiento: datos.fechaVencimiento, diasRestantes: datos.diasRestantes, enlacePortal })
    : plantillaMorosidad({ academia: ACADEMIA, representante, estudiante, montoUsd: datos.montoUsd, montoBs, tasa: tasa.tasa,
        cuentas: await parametros.cuentasActivas(), diasMora: datos.diasMora, enlacePortal });

  const ins = await ejecutar(
    `INSERT INTO dbo.notificaciones_whatsapp (estudiante_id, cuota_id, tipo, telefono, mensaje, monto_usd, tasa_bcv, monto_bs, estado, creado_por)
     OUTPUT inserted.id VALUES (@e, @c, @t, @tel, @m, @usd, @tasa, @bs, N'GENERADA', @u)`,
    {
      e: [sql.Int, est.id], c: [sql.Int, datos.cuotaId], t: [sql.NVarChar(12), tipo], tel: [sql.NVarChar(20), est.telefono], m: [sql.NVarChar(sql.MAX), mensaje],
      usd: [sql.Decimal(10, 2), datos.montoUsd], tasa: [sql.Decimal(18, 4), tasa.tasa], bs: [sql.Decimal(18, 2), montoBs], u: [sql.Int, usuarioId || null],
    });
  const notificacionId = ins.recordset[0].id;

  let estado = 'GENERADA';
  if (enviar) {
    try {
      await waSvc.enviarTexto(est.telefono, mensaje);
      estado = 'ENVIADA';
    } catch (err) {
      await ejecutar(`UPDATE dbo.notificaciones_whatsapp SET estado = N'FALLIDA', error = @er WHERE id = @id`,
        { id: [sql.Int, notificacionId], er: [sql.NVarChar(500), String(err.detalles?.motivo || err.message).slice(0, 500)] });
      throw err;
    }
    await ejecutar(`UPDATE dbo.notificaciones_whatsapp SET estado = N'ENVIADA' WHERE id = @id`, { id: [sql.Int, notificacionId] });
  }

  return {
    notificacion_id: notificacionId, tipo, estado, telefono: est.telefono, mensaje,
    enlace_whatsapp: `https://wa.me/${est.telefono}?text=${encodeURIComponent(mensaje)}`,
    monto_usd: datos.montoUsd, monto_bs: montoBs, tasa_bcv: tasa.tasa, tasa_capturada_en: tasa.capturadaEn,
  };
}

async function historial({ estudianteId, offset, limite }) {
  const p = { e: [sql.Int, estudianteId || null], o: [sql.Int, offset], l: [sql.Int, limite] };
  const [items, total] = await Promise.all([
    ejecutar(`SELECT n.id, n.estudiante_id, s.nombres + N' ' + s.apellidos AS estudiante, n.tipo, n.estado, n.monto_usd, n.monto_bs, n.tasa_bcv, n.error, n.creado_en
              FROM dbo.notificaciones_whatsapp n JOIN dbo.estudiantes s ON s.id = n.estudiante_id
              WHERE (@e IS NULL OR n.estudiante_id = @e) ORDER BY n.creado_en DESC, n.id DESC OFFSET @o ROWS FETCH NEXT @l ROWS ONLY`, p),
    ejecutar('SELECT COUNT(*) AS n FROM dbo.notificaciones_whatsapp WHERE (@e IS NULL OR estudiante_id = @e)', { e: p.e }),
  ]);
  return { items: items.recordset, total: total.recordset[0].n };
}

module.exports = { generarAlerta, historial, VENTANA_PREVENTIVA };
