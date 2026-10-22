'use strict';
const portal = require('../services/portal.service');
const { validar } = require('../utils/validar');
const { asyncHandler, ok } = require('../utils/http');

const ver = asyncHandler(async (req, res) => ok(res, await portal.vista(req.params.token)));

const declarar = asyncHandler(async (req, res) => {
  const datos = validar(req.body, {
    cuota_id: { tipo: 'entero', requerido: true, min: 1 },
    referencia: { requerido: true, patron: /^[A-Za-z0-9-]{4,40}$/, mensajePatron: 'La referencia debe tener de 4 a 40 caracteres (letras, números o guiones, sin espacios).' },
    metodo_pago: { tipo: 'enum', valores: ['ZELLE', 'BINANCE', 'PAYPAL', 'PAGO_MOVIL'], requerido: true },
  });
  ok(res, await portal.declarar(req.params.token, datos), 201);
});

module.exports = { ver, declarar };
