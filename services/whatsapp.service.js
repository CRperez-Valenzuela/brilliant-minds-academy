'use strict';
const axios = require('axios');
const cfg = require('../config/env');
const { AppError, e } = require('../errors/AppError');

/**
 * Clasificación de las fallas de Meta (hallazgo H1). Quien llama (el cron) decide qué hacer según la CLASE:
 *   DESTINATARIO — el problema es de ESTE destinatario/mensaje (no está en WhatsApp, pasaron 24 h desde su último mensaje, límite
 *                  por par, opt-out…). Reintentar con el SIGUIENTE estudiante funcionaría igual de bien: no debe cortar el ciclo.
 *   SISTEMICA    — token vencido, permisos, plantilla inexistente/pausada, cuenta restringida, límites de la cuenta…: cualquier otro
 *                  envío fallaría igual, así que se corta el ciclo de inmediato.
 *   DESCONOCIDA  — código no documentado como inequívoco, error de red o sin cuerpo de Meta: comportamiento conservador previo
 *                  (cuenta para el cortafuegos de fallos seguidos).
 * Fuente de los códigos: tabla oficial de errores de la Cloud API de WhatsApp (developers.facebook.com → WhatsApp → Error codes).
 * Los ambiguos (p. ej. 100/131009 «parámetro inválido», que puede ser el número o la plantilla) se dejan a propósito en DESCONOCIDA.
 */
const CLASE_FALLA = Object.freeze({ DESTINATARIO: 'DESTINATARIO', SISTEMICA: 'SISTEMICA', DESCONOCIDA: 'DESCONOCIDA' });

const META_DESTINATARIO = new Set([
  131021, // remitente y destinatario son el mismo número
  131026, // mensaje no entregable a este destinatario (no usa WhatsApp, no aceptó términos, cliente desactualizado)
  131047, // pasaron más de 24 h desde la última respuesta del destinatario (fuera de la ventana de servicio)
  131049, // Meta frenó el mensaje para proteger la calidad del ecosistema (límite por usuario)
  131050, // el destinatario se dio de baja de mensajes de marketing
  131056, // demasiados mensajes entre este par remitente–destinatario en poco tiempo
]);

const META_SISTEMICOS = new Set([
  0, 190, // token ausente, vencido, invalidado o revocado
  4, 80007, 130429, // límites de llamadas / de la cuenta / de throughput: seguir empeoraría el bloqueo
  10, // permiso no concedido (los 200–299 se evalúan como rango)
  368, 131031, // cuenta restringida o deshabilitada por incumplir políticas
  131005, // acceso denegado
  131037, 131042, 131045, 133010, // número sin nombre aprobado / problema de pago / registro del número / número no registrado
  131048, // envío restringido desde este número por spam o bloqueos (calidad)
  132000, 132001, 132005, 132007, 132015, 132016, // plantilla inexistente, mal parametrizada, rechazada, pausada o deshabilitada
]);

/** Entero estricto o null. `Number(null)` y `Number('')` valen 0, y el 0 de Meta significa «token inválido» (sistémico): no deben colarse. */
function codigoEntero(v) {
  if (typeof v === 'number') return Number.isInteger(v) ? v : null;
  if (typeof v === 'string' && /^\d{1,9}$/.test(v.trim())) return Number(v.trim());
  return null;
}

/** @returns {'DESTINATARIO'|'SISTEMICA'|'DESCONOCIDA'} */
function clasificarErrorMeta({ codigo, http } = {}) {
  const c = codigoEntero(codigo);
  if (c !== null) {
    if (META_DESTINATARIO.has(c)) return CLASE_FALLA.DESTINATARIO;
    if (META_SISTEMICOS.has(c) || (c >= 200 && c <= 299)) return CLASE_FALLA.SISTEMICA;
    return CLASE_FALLA.DESCONOCIDA;
  }
  // Sin cuerpo de Meta: solo un rechazo de credenciales es inequívocamente sistémico; timeouts y cortes de red no lo son.
  if (http === 401 || http === 403) return CLASE_FALLA.SISTEMICA;
  return CLASE_FALLA.DESCONOCIDA;
}

/**
 * Envío por la API oficial de WhatsApp Business (Meta Cloud API). LANZA AppError si Meta rechaza o no está configurada,
 * para que la notificación quede registrada como FALLIDA en lugar de darse por enviada.
 * Toda falla de Meta sale como `WHATSAPP_ENVIO_FALLIDO` (502) con `detalles = { motivo, meta_codigo, http_status, clase }`.
 */
function crearWhatsappService({ http = axios, token = cfg.whatsapp.token, phoneId = cfg.whatsapp.phoneNumberId, version = cfg.whatsapp.graphVersion } = {}) {
  const configurado = () => Boolean(token && phoneId);

  async function enviarTexto(to, texto) {
    if (!configurado()) {
      throw e.noDisponible('WHATSAPP_NO_CONFIGURADO', 'El envío por WhatsApp no está configurado (WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID).');
    }
    try {
      await http.post(
        `https://graph.facebook.com/${version}/${phoneId}/messages`,
        { messaging_product: 'whatsapp', to, type: 'text', text: { body: texto, preview_url: true } },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 10_000 },
      );
    } catch (err) {
      if (err instanceof AppError) throw err;
      const meta = err.response && err.response.data && err.response.data.error;
      const detalle = meta ? `Meta ${meta.code}: ${meta.message}` : err.message;
      const metaCodigo = meta ? codigoEntero(meta.code) : null;
      const httpStatus = (err.response && err.response.status) || null;
      throw new AppError(502, 'WHATSAPP_ENVIO_FALLIDO', 'Meta rechazó o no pudo entregar el mensaje.', {
        motivo: detalle, meta_codigo: metaCodigo, http_status: httpStatus, clase: clasificarErrorMeta({ codigo: metaCodigo, http: httpStatus }),
      });
    }
  }

  return { enviarTexto, configurado };
}

module.exports = { crearWhatsappService, whatsapp: crearWhatsappService(), clasificarErrorMeta, CLASE_FALLA };
