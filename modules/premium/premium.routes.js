'use strict';
const express = require('express');
const { guard, estadoEfectivo } = require('./guard');
const { CATALOGO, TOOLTIP_BLOQUEADO } = require('./catalogo');
const { activarPrueba, DIAS_PRUEBA } = require('./prueba.service');
const { requireAuth, requireRol } = require('../../middlewares/auth');
const { AppError } = require('../../errors/AppError');
const { asyncHandler, ok } = require('../../utils/http');
const { validar } = require('../../utils/validar');

/**
 * Ruta reservada: el candado ya protege la URL; si el módulo está habilitado pero su lógica aún no se publica,
 * se responde 501 explícito (no un 404 confuso). Al implementar el módulo se reemplaza este handler por el real.
 */
const reservado = (codigo, descripcion) => (_req, _res, next) =>
  next(new AppError(501, 'NO_IMPLEMENTADO', 'Ruta reservada: el módulo está habilitado pero su lógica aún no se publica.', { modulo: codigo, funcion: descripcion }));

// ── Catálogo para la interfaz: candados + tooltips ──────────────────────────────────────────────
const catalogoRouter = express.Router();
catalogoRouter.get('/modulos', requireAuth, asyncHandler(async (_req, res) => {
  // Housekeeping idempotente: las pruebas vencidas se bloquean en la base (habilitado = FALSE) al abrir el catálogo.
  await guard.repo.bloquearVencidas();
  const filas = await guard.repo.leerTodos();
  const porCod = new Map(filas.map((f) => [f.codigo, f]));
  const ahora = Date.now();
  ok(res, CATALOGO.map((m) => {
    const f = porCod.get(m.codigo);
    const e = estadoEfectivo(f || null, ahora, m.codigo);
    return {
      codigo: m.codigo, nombre: m.nombre, descripcion: f ? f.descripcion : '', precio_usd: f ? Number(f.precio_usd) : m.precioUsd,
      vista: m.vista, habilitado: e.habilitado, bloqueado: !e.habilitado, tooltip: e.habilitado ? null : TOOLTIP_BLOQUEADO,
      en_prueba: e.enPrueba, expira_prueba_en: e.expiraPruebaEn, dias_restantes_prueba: e.diasRestantes,
      prueba_utilizada: Boolean(f && f.prueba_iniciada_en),
    };
  }));
}));

// Prueba premium de 15 días (solo admin): habilita el módulo y fija expira_prueba_en = NOW() + 15 días.
catalogoRouter.post('/activar-prueba', requireAuth, requireRol('admin'), asyncHandler(async (req, res) => {
  const { modulo } = validar(req.body, { modulo: { tipo: 'enum', requerido: true, valores: CATALOGO.map((m) => m.codigo) } });
  const r = await activarPrueba({ codigo: modulo });
  guard.invalidar(); // el panel y los candados ven la activación de inmediato
  console.log(`[premium] Prueba de ${DIAS_PRUEBA} días activada: ${modulo} por usuario ${req.usuario.id}`);
  ok(res, r, 201);
}));

// ── Módulo: Atención al Cliente por IA y Clasificación Temática (US$ 200) ───────────────────────
const ia = express.Router();
ia.use(requireAuth, guard.requireModulo('IA_ATENCION'));
ia.get('/bandeja', reservado('IA_ATENCION', 'Bandeja de mensajes clasificados: Reclamos | Felicitaciones | Propuestas'));
ia.post('/mensajes', reservado('IA_ATENCION', 'Ingesta y clasificación de un mensaje entrante'));

// ── Módulo: Automatización vía WhatsApp (US$ 150) ───────────────────────────────────────────────
const wa = express.Router();
wa.use(requireAuth, guard.requireModulo('WHATSAPP_AUTOMATICO'));
wa.get('/config', reservado('WHATSAPP_AUTOMATICO', 'Configuración del cron de alertas masivas'));
wa.put('/config', reservado('WHATSAPP_AUTOMATICO', 'Actualizar el cron de alertas masivas'));
wa.post('/prueba', reservado('WHATSAPP_AUTOMATICO', 'Botón de prueba premium'));

// ── Módulo: Integración Bancaria — API Bancamiga (US$ 300) ──────────────────────────────────────
const bancamiga = express.Router();
bancamiga.use(requireAuth, guard.requireModulo('BANCAMIGA'));
bancamiga.post('/validar-referencia', reservado('BANCAMIGA', 'Validación cruzada e inmediata de la referencia con el banco'));

// ── Módulo: Aplicación Móvil Administrativa (US$ 450) — API REST unificada ───────────────────────
const movil = express.Router();
movil.use(requireAuth, guard.requireModulo('APP_MOVIL'));
movil.get('/dashboard', reservado('APP_MOVIL', 'Dashboard administrativo para la app móvil'));
movil.get('/referencias', reservado('APP_MOVIL', 'Bandeja de auditoría de referencias'));
movil.post('/referencias/:id/aprobar', reservado('APP_MOVIL', 'Aprobar referencia desde el móvil'));
movil.post('/referencias/:id/rechazar', reservado('APP_MOVIL', 'Rechazar referencia desde el móvil'));

// ── Módulo Ultra-Premium: Fachada Web con Scroll-Tour Inmersivo (US$ 550) ───────────────────────
// Ruteador PÚBLICO: enlaza el tráfico de marketing de la landing con el Portal de Admisiones conservando los UTM.
const fachada = express.Router();
fachada.get('/admisiones', guard.requireModulo('FACHADA_WEB'), (req, res) => {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(req.query)) {
    if (/^utm_[a-z_]{1,30}$/.test(k) && typeof v === 'string') qs.set(k, v.slice(0, 100));
  }
  res.redirect(302, `/admisiones${qs.size ? `?${qs}` : ''}`);
});

module.exports = { catalogoRouter, ia, wa, bancamiga, movil, fachada };
