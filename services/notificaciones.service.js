'use strict';
const { ejecutar } = require('../config/db');
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

async function cargarEstudiante(id, sedeId = null) {
  const r = await ejecutar(
    `SELECT v.id, v.sede_id, v.nombres, v.apellidos, v.estado_dinamico, r.nombres AS rep_nombres, r.apellidos AS rep_apellidos, r.telefono
     FROM vw_estudiantes_estado v JOIN representantes r ON r.id = v.representante_id
     WHERE v.id = $1 AND ($2::int IS NULL OR v.sede_id = $2::int)`, [id, sedeId]);
  if (!r.rowCount) throw e.noEncontrado('El estudiante');
  return r.rows[0];
}

/** Alerta preventiva: solo si el próximo vencimiento cae entre 3 y 5 días (hora de Caracas). */
async function prepararPreventiva(est, hoy) {
  if (est.estado_dinamico !== 'Activo') {
    throw e.reglaNegocio('ESTADO_NO_APLICA', `La alerta preventiva solo aplica a estudiantes Activos (estado actual: ${est.estado_dinamico}).`);
  }
  const r = await ejecutar(
    `SELECT id, concepto, monto_usd, fecha_vencimiento
     FROM cuotas WHERE estudiante_id = $1 AND estado = 'Pendiente' AND fecha_vencimiento >= $2
     ORDER BY fecha_vencimiento, id LIMIT 1`,
    [est.id, aFechaSql(hoy)]);
  if (!r.rowCount) throw e.reglaNegocio('SIN_CUOTA_PROXIMA', 'El estudiante no tiene cuotas pendientes por vencer.');
  const c = r.rows[0];
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
    `SELECT id, monto_usd, fecha_vencimiento
     FROM cuotas WHERE estudiante_id = $1 AND estado = 'Pendiente' AND fecha_vencimiento < $2 ORDER BY fecha_vencimiento, id`,
    [est.id, aFechaSql(hoy)]);
  if (!r.rowCount) {
    throw e.reglaNegocio('PAGO_EN_REVISION', 'Todas las cuotas vencidas ya tienen una referencia en revisión; no corresponde cobrar de nuevo.');
  }
  const total = sumar(...r.rows.map((c) => c.monto_usd));
  return { cuotaId: r.rows[0].id, montoUsd: total, diasMora: diasEntre(r.rows[0].fecha_vencimiento, hoy) };
}

/**
 * Genera (y opcionalmente envía) una alerta MANUAL-INDIVIDUAL. La tasa BCV se consulta en ese instante
 * (`fresca: true`); si no se logra obtener, NO se genera nada (503) para no cobrar con una tasa vieja.
 */
async function generarAlerta({ tipo, estudianteId, enviar = false, usuarioId, sedeId = null }, { bcvSvc = bcv, waSvc = whatsapp, ahora = Date.now } = {}) {
  const hoy = hoyCaracas(ahora());
  const est = await cargarEstudiante(estudianteId, sedeId);
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
        cuentas: await parametros.cuentasActivas(undefined, est.sede_id), diasMora: datos.diasMora, enlacePortal });

  const ins = await ejecutar(
    `INSERT INTO notificaciones_whatsapp (estudiante_id, cuota_id, tipo, telefono, mensaje, monto_usd, tasa_bcv, monto_bs, estado, creado_por)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'GENERADA', $9)
     RETURNING id`,
    [est.id, datos.cuotaId, tipo, est.telefono, mensaje, datos.montoUsd, tasa.tasa, montoBs, usuarioId || null]);
  const notificacionId = ins.rows[0].id;

  let estado = 'GENERADA';
  if (enviar) {
    try {
      await waSvc.enviarTexto(est.telefono, mensaje);
      estado = 'ENVIADA';
    } catch (err) {
      await ejecutar(`UPDATE notificaciones_whatsapp SET estado = 'FALLIDA', error = $2 WHERE id = $1`,
        [notificacionId, String(err.detalles?.motivo || err.message).slice(0, 500)]);
      throw err;
    }
    await ejecutar(`UPDATE notificaciones_whatsapp SET estado = 'ENVIADA' WHERE id = $1`, [notificacionId]);
  }

  return {
    notificacion_id: notificacionId, tipo, estado, telefono: est.telefono, mensaje,
    enlace_whatsapp: `https://wa.me/${est.telefono}?text=${encodeURIComponent(mensaje)}`,
    monto_usd: datos.montoUsd, monto_bs: montoBs, tasa_bcv: tasa.tasa, tasa_capturada_en: tasa.capturadaEn,
  };
}

async function historial({ estudianteId, offset, limite, sedeId = null }) {
  const filtro = '($1::int IS NULL OR n.estudiante_id = $1::int) AND ($2::int IS NULL OR s.sede_id = $2::int)';
  const [items, total] = await Promise.all([
    ejecutar(`SELECT n.id, n.estudiante_id, s.nombres || ' ' || s.apellidos AS estudiante, n.tipo, n.estado, n.monto_usd, n.monto_bs, n.tasa_bcv, n.error, n.creado_en
              FROM notificaciones_whatsapp n JOIN estudiantes s ON s.id = n.estudiante_id
              WHERE ${filtro} ORDER BY n.creado_en DESC, n.id DESC LIMIT $3 OFFSET $4`, [estudianteId || null, sedeId, limite, offset]),
    ejecutar(`SELECT COUNT(*)::int AS n FROM notificaciones_whatsapp n JOIN estudiantes s ON s.id = n.estudiante_id WHERE ${filtro}`, [estudianteId || null, sedeId]),
  ]);
  return { items: items.rows, total: total.rows[0].n };
}

module.exports = { generarAlerta, historial, VENTANA_PREVENTIVA };
