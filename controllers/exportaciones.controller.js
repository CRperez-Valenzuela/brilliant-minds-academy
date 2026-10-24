'use strict';
const { exportarLibro, hojasContabilidad, hojasFacturacion } = require('../services/exportacion.service');
const { asyncHandler } = require('../utils/http');
const { alcanceDe } = require('../utils/alcance');

const contabilidad = asyncHandler(async (_req, res) => {
  const { nombre, hojas } = hojasContabilidad();
  await exportarLibro(res, nombre, hojas);
});

const facturacion = asyncHandler(async (req, res) => {
  const sedeId = alcanceDe(req.usuario); // se resuelve ANTES de abrir el stream: un 403 sigue siendo JSON
  const { nombre, hojas } = hojasFacturacion();
  await exportarLibro(res, nombre, hojas, sedeId);
});

module.exports = { contabilidad, facturacion };
