'use strict';
const cfg = require('../config/env');

/** Cabeceras de seguridad básicas (sin dependencias) y CORS opcional por lista blanca (CORS_ORIGIN, separados por coma). */
function seguridad(req, res, next) {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Cross-Origin-Resource-Policy': 'same-site',
  });
  if (cfg.esProduccion) res.set('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');

  const permitidos = cfg.corsOrigen.split(',').map((o) => o.trim()).filter(Boolean);
  const origen = req.get('origin');
  if (origen && permitidos.includes(origen)) {
    res.set({
      'Access-Control-Allow-Origin': origen,
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      Vary: 'Origin',
    });
    if (req.method === 'OPTIONS') return res.sendStatus(204);
  }
  next();
}

module.exports = { seguridad };
