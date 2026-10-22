'use strict';
const crm = require('../services/crm.service');
const { validar, paginacion, idParam } = require('../utils/validar');
const { asyncHandler, ok } = require('../utils/http');

const resumen = asyncHandler(async (_req, res) => ok(res, await crm.resumen()));

const listar = asyncHandler(async (req, res) => {
  const { estado, q } = validar(req.query, { estado: { tipo: 'enum', valores: crm.ESTADOS }, q: { max: 100 } });
  const pag = paginacion(req.query);
  const r = await crm.listar({ estado, q, offset: pag.offset, limite: pag.limite });
  ok(res, r.items, 200, { paginacion: { pagina: pag.pagina, limite: pag.limite, total: r.total } });
});

const detalle = asyncHandler(async (req, res) => ok(res, await crm.detalle(idParam(req.params.id))));

const retirar = asyncHandler(async (req, res) => {
  const d = validar(req.body, { motivo: { max: 300 }, fecha_retiro: { tipo: 'fechaPasada' } });
  ok(res, await crm.retirar({ id: idParam(req.params.id), motivo: d.motivo, fecha: d.fecha_retiro }));
});

const reactivar = asyncHandler(async (req, res) => ok(res, await crm.reactivar({ id: idParam(req.params.id) })));

module.exports = { resumen, listar, detalle, retirar, reactivar };
