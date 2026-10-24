'use strict';
const conta = require('../services/contabilidad.service');
const { validar, paginacion, idParam } = require('../utils/validar');
const { sanitizarTelefono } = require('../utils/telefono');
const { periodoActual, esPeriodoValido } = require('../utils/fechas');
const { e } = require('../errors/AppError');
const { asyncHandler, ok } = require('../utils/http');
const { alcanceDe } = require('../utils/alcance');

const REGLAS_PERSONAL = {
  nombres: { requerido: true, max: 100 },
  apellidos: { requerido: true, max: 100 },
  cedula: { requerido: true, patron: /^[A-Za-z0-9.-]{4,20}$/, mensajePatron: 'Solo letras, números, puntos y guiones (4 a 20).' },
  email: { tipo: 'email', max: 160 },
  cargo: { requerido: true, max: 100 },
  tipo: { tipo: 'enum', valores: ['Docente', 'Administrativo'], requerido: true },
  modalidad_pago: { tipo: 'enum', valores: ['Fijo', 'Honorarios', 'Mixto'], requerido: true },
  salario_fijo_usd: { tipo: 'decimal', min: 0, max: 99999999, defecto: 0 },
  tarifa_hora_usd: { tipo: 'decimal', min: 0, max: 99999999, defecto: 0 },
  fecha_ingreso: { tipo: 'fechaPasada' },
};

function datosPersonal(body) {
  const d = validar(body, REGLAS_PERSONAL);
  d.telefono = body && body.telefono ? sanitizarTelefono(body.telefono_codigo || '', body.telefono) : null;
  return d;
}

function periodoDe(valor, requerido = false) {
  const p = valor || (requerido ? null : periodoActual());
  if (!p || !esPeriodoValido(p)) throw e.validacion([{ campo: 'periodo', mensaje: 'Formato AAAA-MM.' }]);
  return p;
}

const crearPersonal = asyncHandler(async (req, res) => ok(res, await conta.crearPersonal(datosPersonal(req.body)), 201));
const actualizarPersonal = asyncHandler(async (req, res) => ok(res, await conta.actualizarPersonal(idParam(req.params.id), datosPersonal(req.body))));
const desactivarPersonal = asyncHandler(async (req, res) => ok(res, await conta.cambiarActivo(idParam(req.params.id), false)));
const reactivarPersonal = asyncHandler(async (req, res) => ok(res, await conta.cambiarActivo(idParam(req.params.id), true)));
const obtenerPersonal = asyncHandler(async (req, res) => ok(res, await conta.obtenerPersonal(idParam(req.params.id))));

const listarPersonal = asyncHandler(async (req, res) => {
  const f = validar(req.query, { solo_activos: { tipo: 'booleano', defecto: false } });
  const pag = paginacion(req.query);
  const r = await conta.listarPersonal({ soloActivos: f.solo_activos, offset: pag.offset, limite: pag.limite });
  ok(res, r.items, 200, { paginacion: { pagina: pag.pagina, limite: pag.limite, total: r.total } });
});

const registrarHoras = asyncHandler(async (req, res) => {
  const d = validar(req.body, {
    personal_id: { tipo: 'entero', requerido: true, min: 1 },
    fecha: { tipo: 'fechaPasada', requerido: true },
    horas: { tipo: 'decimal', requerido: true, positivo: true, max: 24 },
    descripcion: { max: 200 },
  });
  ok(res, await conta.registrarHoras(d), 201);
});

const listarHoras = asyncHandler(async (req, res) => {
  const f = validar(req.query, { personal_id: { tipo: 'entero', min: 1 } });
  const pag = paginacion(req.query);
  const r = await conta.listarHoras({ personalId: f.personal_id, periodo: req.query.periodo ? periodoDe(req.query.periodo) : null, offset: pag.offset, limite: pag.limite });
  ok(res, r.items, 200, { paginacion: { pagina: pag.pagina, limite: pag.limite, total: r.total } });
});

const calcularNomina = asyncHandler(async (req, res) => ok(res, await conta.calcularNominaPeriodo(periodoDe(req.body && req.body.periodo, true))));

const listarNomina = asyncHandler(async (req, res) => {
  const pag = paginacion(req.query);
  const r = await conta.listarNomina({ periodo: periodoDe(req.query.periodo), offset: pag.offset, limite: pag.limite });
  ok(res, r.items, 200, { paginacion: { pagina: pag.pagina, limite: pag.limite, total: r.total }, total_usd: r.total_usd });
});

const pagarNomina = asyncHandler(async (req, res) => ok(res, await conta.pagarNomina({ id: idParam(req.params.id) })));

const crearEgreso = asyncHandler(async (req, res) => {
  const d = validar(req.body, {
    fecha: { tipo: 'fechaPasada', requerido: true },
    categoria: { requerido: true, max: 60 },
    descripcion: { requerido: true, max: 300 },
    monto_usd: { tipo: 'decimal', requerido: true, positivo: true, max: 999999999 },
    referencia: { max: 60 },
    sede_id: { tipo: 'entero', min: 1 }, // solo lo respeta el acceso consolidado; un usuario de sede siempre registra en la suya
  });
  ok(res, await conta.crearEgreso(d, alcanceDe(req.usuario)), 201);
});

const listarEgresos = asyncHandler(async (req, res) => {
  const pag = paginacion(req.query);
  const r = await conta.listarEgresos({ periodo: req.query.periodo ? periodoDe(req.query.periodo) : null, offset: pag.offset, limite: pag.limite, sedeId: alcanceDe(req.usuario) });
  ok(res, r.items, 200, { paginacion: { pagina: pag.pagina, limite: pag.limite, total: r.total }, total_usd: r.total_usd });
});

const balance = asyncHandler(async (req, res) => ok(res, await conta.balance(periodoDe(req.query.periodo), alcanceDe(req.usuario))));

module.exports = {
  crearPersonal, actualizarPersonal, desactivarPersonal, reactivarPersonal, obtenerPersonal, listarPersonal,
  registrarHoras, listarHoras, calcularNomina, listarNomina, pagarNomina, crearEgreso, listarEgresos, balance,
};
