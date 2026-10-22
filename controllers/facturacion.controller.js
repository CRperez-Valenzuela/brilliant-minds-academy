'use strict';
const pagos = require('../services/pagos.service');
const facturacion = require('../services/facturacion.service');
const { validar, paginacion, idParam } = require('../utils/validar');
const { periodoActual, esPeriodoValido } = require('../utils/fechas');
const { e } = require('../errors/AppError');
const { asyncHandler, ok } = require('../utils/http');

const ESTADOS_PAGO = ['Por Validar', 'Aprobada', 'Rechazada'];
const ESTADOS_CUOTA = ['Pendiente', 'En Revisión', 'Pagada', 'Anulada'];

function periodoDe(query) {
  const p = query.periodo || periodoActual();
  if (!esPeriodoValido(p)) throw e.validacion([{ campo: 'periodo', mensaje: 'Formato AAAA-MM.' }]);
  return p;
}

const tablero = asyncHandler(async (req, res) => ok(res, await facturacion.tablero(periodoDe(req.query))));

const auditoria = asyncHandler(async (req, res) => {
  const { estado } = validar(req.query, { estado: { tipo: 'enum', valores: ESTADOS_PAGO, defecto: 'Por Validar' } });
  const pag = paginacion(req.query);
  const r = await pagos.bandeja({ estado, offset: pag.offset, limite: pag.limite });
  ok(res, r.items, 200, { paginacion: { pagina: pag.pagina, limite: pag.limite, total: r.total } });
});

const aprobar = asyncHandler(async (req, res) => {
  const { nota } = validar(req.body, { nota: { max: 300 } });
  ok(res, await pagos.aprobar({ pagoId: idParam(req.params.id), usuarioId: req.usuario.id, nota }));
});

const rechazar = asyncHandler(async (req, res) => {
  const { nota } = validar(req.body, { nota: { requerido: true, max: 300 } });
  ok(res, await pagos.rechazar({ pagoId: idParam(req.params.id), usuarioId: req.usuario.id, nota }));
});

const listarCuotas = asyncHandler(async (req, res) => {
  const f = validar(req.query, { estudiante_id: { tipo: 'entero', min: 1 }, estado: { tipo: 'enum', valores: ESTADOS_CUOTA } });
  const pag = paginacion(req.query);
  const r = await facturacion.listarCuotas({ estudianteId: f.estudiante_id, estado: f.estado, offset: pag.offset, limite: pag.limite });
  ok(res, r.items, 200, { paginacion: { pagina: pag.pagina, limite: pag.limite, total: r.total } });
});

const crearCuota = asyncHandler(async (req, res) => {
  const d = validar(req.body, {
    estudiante_id: { tipo: 'entero', requerido: true, min: 1 },
    tipo: { tipo: 'enum', valores: ['MENSUALIDAD', 'OTRO'], requerido: true },
    concepto: { requerido: true, max: 150 },
    monto_usd: { tipo: 'decimal', requerido: true, positivo: true, max: 99999999 },
    fecha_vencimiento: { tipo: 'fecha', requerido: true },
  });
  ok(res, await facturacion.crearCuota(d), 201);
});

const generarMensualidades = asyncHandler(async (req, res) => {
  const d = validar(req.body, {
    concepto: { requerido: true, max: 150 },
    monto_usd: { tipo: 'decimal', requerido: true, positivo: true, max: 99999999 },
    fecha_vencimiento: { tipo: 'fecha', requerido: true },
  });
  ok(res, await facturacion.generarMensualidades(d), 201);
});

module.exports = { tablero, auditoria, aprobar, rechazar, listarCuotas, crearCuota, generarMensualidades };
