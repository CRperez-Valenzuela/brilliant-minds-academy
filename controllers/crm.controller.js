'use strict';
const crm = require('../services/crm.service');
const { validar, paginacion, idParam } = require('../utils/validar');
const { asyncHandler, ok } = require('../utils/http');
const { alcanceDe } = require('../utils/alcance');

const resumen = asyncHandler(async (req, res) => ok(res, await crm.resumen(alcanceDe(req.usuario))));

const listar = asyncHandler(async (req, res) => {
  const { estado, q } = validar(req.query, { estado: { tipo: 'enum', valores: crm.ESTADOS }, q: { max: 100 } });
  const pag = paginacion(req.query);
  const r = await crm.listar({ estado, q, offset: pag.offset, limite: pag.limite, sedeId: alcanceDe(req.usuario) });
  ok(res, r.items, 200, { paginacion: { pagina: pag.pagina, limite: pag.limite, total: r.total } });
});

const detalle = asyncHandler(async (req, res) => ok(res, await crm.detalle(idParam(req.params.id), alcanceDe(req.usuario))));

const retirar = asyncHandler(async (req, res) => {
  const d = validar(req.body, { motivo: { max: 300 }, fecha_retiro: { tipo: 'fechaPasada' } });
  ok(res, await crm.retirar({ id: idParam(req.params.id), motivo: d.motivo, fecha: d.fecha_retiro, sedeId: alcanceDe(req.usuario) }));
});

const reactivar = asyncHandler(async (req, res) => ok(res, await crm.reactivar({ id: idParam(req.params.id), sedeId: alcanceDe(req.usuario) })));

module.exports = { resumen, listar, detalle, retirar, reactivar };
