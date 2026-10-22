'use strict';
const express = require('express');
const { requireAuth, requireRol } = require('../middlewares/auth');
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
const exportaciones = require('../controllers/exportaciones.controller');
const premium = require('../modules/premium/premium.routes');

const soloAdmin = requireRol('admin');
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
api.post('/facturacion/cuotas/generar-mensualidades', soloAdmin, facturacion.generarMensualidades);
api.get('/facturacion/auditoria', facturacion.auditoria);
api.post('/facturacion/auditoria/:id/aprobar', facturacion.aprobar);
api.post('/facturacion/auditoria/:id/rechazar', facturacion.rechazar);

// Contabilidad interna (solo admin)
api.get('/contabilidad/personal', soloAdmin, conta.listarPersonal);
api.post('/contabilidad/personal', soloAdmin, conta.crearPersonal);
api.get('/contabilidad/personal/:id', soloAdmin, conta.obtenerPersonal);
api.put('/contabilidad/personal/:id', soloAdmin, conta.actualizarPersonal);
api.post('/contabilidad/personal/:id/desactivar', soloAdmin, conta.desactivarPersonal);
api.post('/contabilidad/personal/:id/reactivar', soloAdmin, conta.reactivarPersonal);
api.get('/contabilidad/horas', soloAdmin, conta.listarHoras);
api.post('/contabilidad/horas', soloAdmin, conta.registrarHoras);
api.post('/contabilidad/nomina/calcular', soloAdmin, conta.calcularNomina);
api.get('/contabilidad/nomina', soloAdmin, conta.listarNomina);
api.post('/contabilidad/nomina/:id/pagar', soloAdmin, conta.pagarNomina);
api.get('/contabilidad/egresos', soloAdmin, conta.listarEgresos);
api.post('/contabilidad/egresos', soloAdmin, conta.crearEgreso);
api.get('/contabilidad/balance', soloAdmin, conta.balance);

// Exportación a Excel (.xlsx)
api.get('/exportaciones/contabilidad.xlsx', soloAdmin, exportaciones.contabilidad);
api.get('/exportaciones/facturacion.xlsx', soloAdmin, exportaciones.facturacion);

// Notificaciones por WhatsApp (manuales, una por una)
api.post('/notificaciones/whatsapp/preventiva/:estudianteId', notif.preventiva);
api.post('/notificaciones/whatsapp/morosidad/:estudianteId', notif.morosidad);
api.get('/notificaciones/whatsapp', notif.historial);

// Configuración de la academia
api.get('/configuracion', soloAdmin, cfg.obtener);
api.put('/configuracion/matricula', soloAdmin, cfg.fijarMatricula);
api.post('/configuracion/cuentas', soloAdmin, cfg.crearCuenta);
api.put('/configuracion/cuentas/:id', soloAdmin, cfg.actualizarCuenta);

// Fase 2 — módulos premium (candados): el catálogo alimenta los candados/tooltips del panel
api.use('/premium', premium.catalogoRouter);
api.use('/premium/ia-atencion', premium.ia);
api.use('/premium/whatsapp-automatico', premium.wa);
api.use('/premium/bancamiga', premium.bancamiga);
api.use('/movil/v1', premium.movil);

module.exports = { api, fachada: premium.fachada };
