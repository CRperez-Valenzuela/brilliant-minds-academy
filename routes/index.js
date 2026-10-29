'use strict';
const express = require('express');
const { requireAuth, requireRol } = require('../middlewares/auth');
const { requireConsolidado } = require('../utils/alcance');
const { crearLimitador } = require('../middlewares/limitador');
const { ejecutar } = require('../config/db');
const { asyncHandler, ok } = require('../utils/http');

const auth = require('../controllers/auth.controller');
const admisiones = require('../controllers/admisiones.controller');
const portal = require('../controllers/portal.controller');
const crm = require('../controllers/crm.controller');
const facturacion = require('../controllers/facturacion.controller');
const conta = require('../controllers/contabilidad.controller');
const notif = require('../controllers/notificaciones.controller');
const cfg = require('../controllers/configuracion.controller');
const sedes = require('../controllers/sedes.controller');
const exportaciones = require('../controllers/exportaciones.controller');
const premium = require('../modules/premium/premium.routes');
const { guard } = require('../modules/premium/guard');

const soloAdmin = requireRol('admin');
// Datos SIN sede (personal, horas, nómina) o ajustes globales: solo admin con acceso consolidado (sede_id NULL).
const soloConsolidado = [requireRol('admin'), requireConsolidado];
const api = express.Router();

// ── Salud ───────────────────────────────────────────────────────────────────────────────────────
api.get('/health', (_req, res) => ok(res, { estado: 'activo', uptime_s: Math.round(process.uptime()) }));
api.get('/health/db', asyncHandler(async (_req, res) => {
  await ejecutar('SELECT 1 AS ok');
  ok(res, { base_de_datos: 'conectada' });
}));

// ── Autenticación ───────────────────────────────────────────────────────────────────────────────
api.post('/auth/login', crearLimitador({ ventanaMs: 15 * 60_000, max: 10, soloFallos: true, codigo: 'DEMASIADOS_INTENTOS', mensaje: 'Demasiados intentos de inicio de sesión. Espera unos minutos.' }), auth.login);
api.get('/auth/me', requireAuth, auth.me);

// ── PÚBLICO: Admisiones (formulario de inscripción) ─────────────────────────────────────────────
const limiteAdmision = crearLimitador({ ventanaMs: 60 * 60_000, max: 15, codigo: 'DEMASIADAS_INSCRIPCIONES', mensaje: 'Demasiados envíos desde esta red. Intenta más tarde.' });
api.get('/public/admisiones/config', crearLimitador({ ventanaMs: 60_000, max: 60 }), admisiones.config);
// Enlace de invitación: devuelve sede, cuentas de cobro de la sede y el nivel asignado (bloqueado). El nivel lo vuelve a imponer el POST.
api.get('/public/admisiones/invitacion/:token', crearLimitador({ ventanaMs: 60_000, max: 60 }), admisiones.invitacion);
api.post('/public/admisiones', limiteAdmision, admisiones.limitarConcurrencia, admisiones.cargaArchivos, admisiones.inscribir);

// ── PÚBLICO: Portal privado del representante (acceso por enlace único) ─────────────────────────
const limitePortal = crearLimitador({ ventanaMs: 15 * 60_000, max: 60 });
api.get('/portal/:token', limitePortal, portal.ver);
api.post('/portal/:token/referencias', limitePortal, portal.declarar);

// ── PANEL (JWT) ─────────────────────────────────────────────────────────────────────────────────
api.use(requireAuth);

// Gestor académico y CRM
api.get('/estudiantes/resumen', crm.resumen);
api.get('/estudiantes', crm.listar);
api.get('/estudiantes/:id', crm.detalle);
api.post('/estudiantes/:id/retirar', crm.retirar);
api.post('/estudiantes/:id/reactivar', crm.reactivar);

// Facturación y bandeja de auditoría
api.get('/facturacion/tablero', facturacion.tablero);
api.get('/facturacion/cuotas', facturacion.listarCuotas);
api.post('/facturacion/cuotas', facturacion.crearCuota);
// Módulo premium FACTURACION_MASIVA (US$ 20): sin el módulo habilitado (o en prueba vigente) responde 403 MODULO_PREMIUM_DESHABILITADO.
api.post('/facturacion/cuotas/generar-mensualidades', soloAdmin, guard.requireModulo('FACTURACION_MASIVA'), facturacion.generarMensualidades);
api.get('/facturacion/auditoria', facturacion.auditoria);
api.post('/facturacion/auditoria/:id/aprobar', facturacion.aprobar);
api.post('/facturacion/auditoria/:id/rechazar', facturacion.rechazar);

// Contabilidad interna (solo admin). Personal/horas/nómina no tienen sede → solo acceso consolidado; egresos y balance respetan la sede.
api.get('/contabilidad/personal', ...soloConsolidado, conta.listarPersonal);
api.post('/contabilidad/personal', ...soloConsolidado, conta.crearPersonal);
api.get('/contabilidad/personal/:id', ...soloConsolidado, conta.obtenerPersonal);
api.put('/contabilidad/personal/:id', ...soloConsolidado, conta.actualizarPersonal);
api.post('/contabilidad/personal/:id/desactivar', ...soloConsolidado, conta.desactivarPersonal);
api.post('/contabilidad/personal/:id/reactivar', ...soloConsolidado, conta.reactivarPersonal);
api.get('/contabilidad/horas', ...soloConsolidado, conta.listarHoras);
api.post('/contabilidad/horas', ...soloConsolidado, conta.registrarHoras);
api.post('/contabilidad/nomina/calcular', ...soloConsolidado, conta.calcularNomina);
api.get('/contabilidad/nomina', ...soloConsolidado, conta.listarNomina);
api.post('/contabilidad/nomina/:id/pagar', ...soloConsolidado, conta.pagarNomina);
api.get('/contabilidad/egresos', soloAdmin, conta.listarEgresos);
api.post('/contabilidad/egresos', soloAdmin, conta.crearEgreso);
api.get('/contabilidad/balance', soloAdmin, conta.balance);

// Exportación a Excel (.xlsx)
api.get('/exportaciones/contabilidad.xlsx', ...soloConsolidado, exportaciones.contabilidad);
api.get('/exportaciones/facturacion.xlsx', soloAdmin, exportaciones.facturacion);

// Sedes e invitaciones de inscripción (nivel y sede blindados)
api.get('/sedes', sedes.listar);
api.post('/sedes', ...soloConsolidado, sedes.crear);
api.post('/sedes/:id/activar', ...soloConsolidado, sedes.activar);
api.post('/sedes/:id/desactivar', ...soloConsolidado, sedes.desactivar);
api.get('/invitaciones', sedes.listarInvitaciones);
api.post('/invitaciones', sedes.crearInvitacion);
api.post('/invitaciones/:id/revocar', sedes.revocarInvitacion);

// Notificaciones por WhatsApp (manuales, una por una)
api.post('/notificaciones/whatsapp/preventiva/:estudianteId', notif.preventiva);
api.post('/notificaciones/whatsapp/morosidad/:estudianteId', notif.morosidad);
api.get('/notificaciones/whatsapp', notif.historial);

// Configuración de la academia
api.get('/configuracion', ...soloConsolidado, cfg.obtener);
api.put('/configuracion/matricula', ...soloConsolidado, cfg.fijarMatricula);
api.post('/configuracion/cuentas', ...soloConsolidado, cfg.crearCuenta);
api.put('/configuracion/cuentas/:id', ...soloConsolidado, cfg.actualizarCuenta);

// Fase 2 — módulos premium (candados): el catálogo alimenta los candados/tooltips del panel
api.use('/premium', premium.catalogoRouter);
api.use('/premium/ia-atencion', premium.ia);
api.use('/premium/whatsapp-automatico', premium.wa);
api.use('/premium/bancamiga', premium.bancamiga);
api.use('/movil/v1', premium.movil);

module.exports = { api, fachada: premium.fachada };
