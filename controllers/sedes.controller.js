'use strict';
const sedes = require('../services/sedes.service');
const invitaciones = require('../services/invitaciones.service');
const { validar, paginacion, idParam } = require('../utils/validar');
const { e } = require('../errors/AppError');
const { asyncHandler, ok } = require('../utils/http');
const { alcanceDe } = require('../utils/alcance');

const listar = asyncHandler(async (req, res) => ok(res, await sedes.listar(alcanceDe(req.usuario))));

/** Solo acceso consolidado (la ruta ya exige requireConsolidado). */
const crear = asyncHandler(async (req, res) => {
  const d = validar(req.body, { nombre: { requerido: true, max: 120 } });
  ok(res, await sedes.crear(d), 201);
});

const cambiarActiva = (activa) => asyncHandler(async (req, res) => ok(res, await sedes.cambiarActiva(idParam(req.params.id), activa)));

// ── Invitaciones de inscripción (nivel y sede blindados) ────────────────────────────────────────
const ESTADOS_INVITACION = ['Pendiente', 'Usada', 'Revocada', 'Vencida'];

/**
 * POST /api/invitaciones — { nivel_asignado, dias?, sede_id? }. Un usuario de sede SIEMPRE invita a su sede (sede_id del cuerpo ignorado);
 * el acceso consolidado debe indicar la sede.
 */
const crearInvitacion = asyncHandler(async (req, res) => {
  const d = validar(req.body, {
    nivel_asignado: { requerido: true, max: 60 },
    dias: { tipo: 'entero', min: 1, max: 60, defecto: invitaciones.DIAS_VIGENCIA_DEFECTO },
    sede_id: { tipo: 'entero', min: 1 },
  });
  const alcance = alcanceDe(req.usuario);
  const sedeId = alcance ?? d.sede_id;
  if (!sedeId) throw e.validacion([{ campo: 'sede_id', mensaje: 'Es obligatorio para el acceso consolidado.' }]);
  ok(res, await invitaciones.crear({ sedeId, nivel: d.nivel_asignado, dias: d.dias, creadoPor: req.usuario.id }), 201);
});

const listarInvitaciones = asyncHandler(async (req, res) => {
  const { estado } = validar(req.query, { estado: { tipo: 'enum', valores: ESTADOS_INVITACION } });
  const pag = paginacion(req.query);
  const r = await invitaciones.listar({ sedeId: alcanceDe(req.usuario), estado, offset: pag.offset, limite: pag.limite });
  ok(res, r.items, 200, { paginacion: { pagina: pag.pagina, limite: pag.limite, total: r.total } });
});

const revocarInvitacion = asyncHandler(async (req, res) => ok(res, await invitaciones.revocar(idParam(req.params.id), alcanceDe(req.usuario))));

module.exports = { listar, crear, activar: cambiarActiva(true), desactivar: cambiarActiva(false), crearInvitacion, listarInvitaciones, revocarInvitacion };
