'use strict';
const axios = require('axios');
const cfg = require('../config/env');
const { AppError, e } = require('../errors/AppError');

/**
 * Envío por la API oficial de WhatsApp Business (Meta Cloud API). LANZA AppError si Meta rechaza o no está configurada,
 * para que la notificación quede registrada como FALLIDA en lugar de darse por enviada.
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
      throw new AppError(502, 'WHATSAPP_ENVIO_FALLIDO', 'Meta rechazó o no pudo entregar el mensaje.', { motivo: detalle });
    }
  }

  return { enviarTexto, configurado };
}

module.exports = { crearWhatsappService, whatsapp: crearWhatsappService() };
