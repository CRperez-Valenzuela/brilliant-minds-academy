'use strict';
const crypto = require('node:crypto');

/** Asigna un id de correlación por petición (se devuelve en X-Request-Id y en todo error JSON). */
function requestId(req, res, next) {
  const entrante = req.get('x-request-id');
  req.id = entrante && /^[\w-]{8,64}$/.test(entrante) ? entrante : crypto.randomUUID();
  res.set('X-Request-Id', req.id);
  next();
}

module.exports = { requestId };
