'use strict';

/**
 * Catálogo de la Fase 2. La fuente de verdad del estado (habilitado / no) es la tabla modulos_premium;
 * este archivo solo describe cada módulo para la interfaz (candado + tooltip) y sus rutas reservadas.
 */
const TOOLTIP_BLOQUEADO = 'Módulo Premium Deshabilitado';

const CATALOGO = Object.freeze([
  { codigo: 'IA_ATENCION', nombre: 'Atención al Cliente por IA', precioUsd: 200, vista: 'ia-atencion', rutas: ['/api/premium/ia-atencion'],
    etiquetas: ['Reclamos', 'Felicitaciones', 'Propuestas'] },
  { codigo: 'WHATSAPP_AUTOMATICO', nombre: 'Automatización vía WhatsApp', precioUsd: 150, vista: 'whatsapp-automatico', rutas: ['/api/premium/whatsapp-automatico'] },
  { codigo: 'BANCAMIGA', nombre: 'Integración Bancaria (API Bancamiga)', precioUsd: 300, vista: 'bancamiga', rutas: ['/api/premium/bancamiga'] },
  { codigo: 'APP_MOVIL', nombre: 'Aplicación Móvil Administrativa', precioUsd: 450, vista: 'app-movil', rutas: ['/api/movil/v1'] },
  { codigo: 'FACHADA_WEB', nombre: 'Fachada Web con Scroll-Tour Inmersivo', precioUsd: 550, vista: 'fachada-web', rutas: ['/ir/admisiones'] },
  // Migración 008. MULTI_SEDE_PREMIUM no tiene ruta propia: lo aplica el trigger trg_sedes_limite_base sobre POST /api/sedes
  // (el Core Base incluye 2 sedes; la 3ª exige el módulo habilitado o en prueba vigente).
  { codigo: 'MULTI_SEDE_PREMIUM', nombre: 'Expansión Multi-Sede Avanzada (3+ Sedes)', precioUsd: 50, vista: 'multi-sede', rutas: ['/api/sedes'] },
  { codigo: 'FACTURACION_MASIVA', nombre: 'Módulo de Facturación Masiva Automatizada', precioUsd: 20, vista: 'facturacion-masiva', rutas: ['/api/facturacion/cuotas/generar-mensualidades'] },
]);

/** Oferta base (Core Base, US$ 750): hasta dos sedes (Acarigua y Barquisimeto). Desde la tercera se exige MULTI_SEDE_PREMIUM. */
const LIMITE_SEDES_BASE = 2;
const MODULO_MULTI_SEDE = 'MULTI_SEDE_PREMIUM';

const porCodigo = (codigo) => CATALOGO.find((m) => m.codigo === codigo);

module.exports = { CATALOGO, TOOLTIP_BLOQUEADO, LIMITE_SEDES_BASE, MODULO_MULTI_SEDE, porCodigo };
