'use strict';
const { exportarLibro, hojasContabilidad, hojasFacturacion } = require('../services/exportacion.service');
const { asyncHandler } = require('../utils/http');

const contabilidad = asyncHandler(async (_req, res) => {
  const { nombre, hojas } = hojasContabilidad();
  await exportarLibro(res, nombre, hojas);
});

const facturacion = asyncHandler(async (_req, res) => {
  const { nombre, hojas } = hojasFacturacion();
  await exportarLibro(res, nombre, hojas);
});

module.exports = { contabilidad, facturacion };
