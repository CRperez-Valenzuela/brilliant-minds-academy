/**
 * Candado Premium compartido: pantalla de cristal (glassmorphism) sobre una sección fantasma + oferta de la prueba gratuita de 15 días.
 * Lo usan el panel (admin.ts) para todos los módulos de la Fase 2 y las vistas premium con lógica propia (facturacion-masiva.ts).
 *  - La capa usa `bg-white/80` + `backdrop-blur-md` (excepción deliberada del sistema de diseño, ver lib/ui.ts); el texto va en una tarjeta `bg-white/95`.
 *  - El servidor es la fuente de verdad: este candado es solo la cara visible del 403 MODULO_PREMIUM_DESHABILITADO.
 */
import { mensajeDeError } from '../api/bmaClient';
import { html, type HtmlSeguro } from './html';
import { icono } from './icons';
import { usd } from './format';
import { CLS, aviso, boton, buscar, conBotonOcupado, notificar } from './ui';

export const AVISO_PREMIUM = 'Módulo Premium Deshabilitado';

export interface DatosCandado {
  readonly nombre: string;
  readonly descripcion: string;
  readonly precio_usd: number;
}

/** Encabezado estándar de una sección del panel: título, subtítulo y acciones opcionales a la derecha. */
export function encabezadoVista(titulo: string, subtitulo: string, acciones: HtmlSeguro | null = null): HtmlSeguro {
  return html`<header class="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div><h1 class="${CLS.titulo}">${titulo}</h1><p class="${CLS.subtitulo}">${subtitulo}</p></div>
    ${acciones}
  </header>`;
}

export function vistaFantasma(): HtmlSeguro {
  const fila = html`<div class="flex items-center gap-4 border-b border-slate-100 py-4"><div class="h-8 w-8 rounded-full bg-slate-200"></div><div class="h-4 flex-1 rounded bg-slate-200"></div><div class="h-4 w-24 rounded bg-slate-200"></div></div>`;
  return html`<div aria-hidden="true" class="pointer-events-none select-none p-6">
    <div class="mb-4 h-6 w-1/3 rounded bg-slate-300"></div>${fila}${fila}${fila}${fila}${fila}
  </div>`;
}

/** Capa absoluta de cristal (`backdrop-blur-md bg-white/80`) sobre la sección bloqueada. */
export function capaCandado(d: DatosCandado): HtmlSeguro {
  return html`<div data-candado class="absolute inset-0 z-10 flex items-center justify-center bg-white/80 p-6 backdrop-blur-md">
    <div role="region" aria-label="${AVISO_PREMIUM}" class="${CLS.tarjetaCristal} w-full max-w-md p-8 text-center">
      <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white">${icono('lock', 'h-6 w-6')}</span>
      <h2 class="mt-4 text-lg font-bold text-slate-900">${AVISO_PREMIUM}</h2>
      <p class="mt-1 text-sm font-semibold text-slate-800">${d.nombre}</p>
      <p class="mt-2 text-sm text-slate-700">${d.descripcion}</p>
      <p class="mt-4 text-2xl font-bold text-slate-900">${usd(d.precio_usd)}</p>
      <p class="mt-1 text-xs text-slate-600">Pago único · solicítalo a Astra Digital Solutions</p>
    </div>
  </div>`;
}

export function seccionBloqueada(d: DatosCandado): HtmlSeguro {
  return html`${encabezadoVista(d.nombre, d.descripcion)}
    <div class="${CLS.tarjeta} relative min-h-96 overflow-hidden">${vistaFantasma()}${capaCandado(d)}</div>`;
}

/** Sección bloqueada + (si procede) el aviso con el botón «Activar prueba gratuita de 15 días». Enlázalo con `enlazarPrueba`. */
export function pantallaBloqueada(d: DatosCandado, ofrecerPrueba: boolean): HtmlSeguro {
  return html`${seccionBloqueada(d)}${ofrecerPrueba
    ? html`<div class="mt-6">${aviso('info', html`<p>Prueba este módulo sin costo durante 15 días. Al vencer se bloquea solo.</p>
        <button type="button" id="activar-prueba" class="${boton(CLS.btnPrimario, 'mt-3')}">${icono('check', 'h-4 w-4')}<span>Activar prueba gratuita de 15 días</span></button>`, 'Prueba gratuita disponible')}</div>`
    : null}`;
}

/** Conecta el botón de la prueba (si existe en `raiz`); un fallo se avisa con un toast y deja el botón disponible. */
export function enlazarPrueba(raiz: ParentNode, alActivar: () => Promise<void>): void {
  const activar = buscar('#activar-prueba', HTMLButtonElement, raiz);
  activar?.addEventListener('click', () => {
    void conBotonOcupado(activar, alActivar).catch((e: unknown) => notificar('bad', mensajeDeError(e)));
  });
}
