'use strict';
const notificaciones = require('../services/notificaciones.service');
const { validar, paginacion, idParam } = require('../utils/validar');
const { asyncHandler, ok } = require('../utils/http');
const { alcanceDe } = require('../utils/alcance');

/** Alertas MANUALES e individuales. `?enviar=true` envía por la API de Meta; sin él solo se genera el texto y el enlace wa.me. */
const generar = (tipo) => asyncHandler(async (req, res) => {
  const { enviar } = validar({ ...req.query, ...req.body }, { enviar: { tipo: 'booleano', defecto: false } });
  const r = await notificaciones.generarAlerta({ tipo, estudianteId: idParam(req.params.estudianteId, 'estudianteId'), enviar, usuarioId: req.usuario.id, sedeId: alcanceDe(req.usuario) });
  ok(res, r, 201);
});

const historial = asyncHandler(async (req, res) => {
  const f = validar(req.query, { estudiante_id: { tipo: 'entero', min: 1 } });
  const pag = paginacion(req.query);
  const r = await notificaciones.historial({ estudianteId: f.estudiante_id, offset: pag.offset, limite: pag.limite, sedeId: alcanceDe(req.usuario) });
  ok(res, r.items, 200, { paginacion: { pagina: pag.pagina, limite: pag.limite, total: r.total } });
});

module.exports = { preventiva: generar('PREVENTIVA'), morosidad: generar('MOROSIDAD'), historial };
