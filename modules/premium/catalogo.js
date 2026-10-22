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
]);

const porCodigo = (codigo) => CATALOGO.find((m) => m.codigo === codigo);

module.exports = { CATALOGO, TOOLTIP_BLOQUEADO, porCodigo };
