/**
 * Firma de autoría de Astra Digital Solutions: pie del login, base del sidebar, cabecera dual y pie de la planilla pública y del portal.
 *
 * ÚNICO punto del frontend que conoce la marca Astra. Usa el isotipo oficial en metal cepillado (`src/assets/astra-logo.png`, 631×624 con
 * canal alfa); Vite lo emite con hash en /assets. El metal va siempre sobre una pastilla slate-900 (el mismo recurso de contraste que usaba
 * el marcador «A» cian anterior), de modo que las luces del cepillado no se pierdan sobre superficies blancas.
 *
 * Las clases las pasa quien llama, escritas literalmente en su propio archivo: Tailwind solo genera las utilidades que ve escritas tal
 * cual en el código fuente (componerlas con `${…}` impediría que se generaran en producción).
 */
import { html, type HtmlSeguro } from './html';
import { logoCompletoHtml } from './marca';
import isotipoMetalico from '../assets/astra-logo.png';

export const NOMBRE_ASTRA = 'Astra Digital Solutions';
export const TEXTO_AUTORIA = 'Diseñado y desarrollado por Astra Digital Solutions';
export const TEXTO_AUTORIA_PUBLICA = 'Desarrollado por Astra Digital Solutions';
export const TEXTO_SUITE = 'Astra Academy Suite v1.0';

/** Dimensiones intrínsecas del PNG: reservan el espacio antes de cargar (sin saltos de maquetación). */
const DIM_ASTRA = { ancho: 631, alto: 624 } as const;

/**
 * Isotipo metálico de Astra. `object-contain` conserva la proporción (casi cuadrada) sea cual sea la caja que defina quien llama.
 * - `decorativo`: junto a un texto que ya nombra la marca (pies de página) → `alt=""` para que el lector de pantalla no lo repita.
 * - `perezoso`: carga diferida para las instancias fuera del primer pantallazo (pies de página).
 */
function isotipoAstra(clases: string, decorativo: boolean, perezoso: boolean): HtmlSeguro {
  const alt = decorativo ? '' : NOMBRE_ASTRA;
  return html`<img src="${isotipoMetalico}" alt="${alt}" width="${DIM_ASTRA.ancho}" height="${DIM_ASTRA.alto}" decoding="async" loading="${perezoso ? 'lazy' : 'eager'}" class="${clases}">`;
}

/** Pie de la tarjeta del login. El metal va sobre una pastilla slate-900; el texto va en slate-700. */
export function firmaLogin(): HtmlSeguro {
  return html`<footer class="mt-8 flex items-center justify-center gap-2 border-t border-slate-200 pt-4 text-center font-display text-xs font-medium tracking-wide text-slate-700">
    ${isotipoAstra('h-8 w-8 shrink-0 rounded bg-slate-900 object-contain p-1', true, true)}<span>${TEXTO_AUTORIA}</span>
  </footer>`;
}

/**
 * Base del sidebar: «Astra Academy Suite v1.0». Colapsado (`data-collapsed=true` en el ancestro `group/sb`): el texto pasa a `sr-only`,
 * la fila se centra y la pastilla crece de 32 a 40 px para que el isotipo sea el protagonista del rail de 80 px.
 */
export function firmaSidebar(): HtmlSeguro {
  return html`<div class="flex items-center gap-2 border-t border-slate-200 px-4 py-3 font-display text-xs font-medium tracking-wide text-slate-700 group-data-[collapsed=true]/sb:justify-center group-data-[collapsed=true]/sb:px-0" title="${TEXTO_SUITE}">
    ${isotipoAstra('h-8 w-8 shrink-0 rounded bg-slate-900 object-contain p-1 transition-[width,height] duration-200 motion-reduce:transition-none group-data-[collapsed=true]/sb:h-10 group-data-[collapsed=true]/sb:w-10', true, true)}<span class="min-w-0 truncate group-data-[collapsed=true]/sb:sr-only">${TEXTO_SUITE}</span>
  </div>`;
}

/**
 * Cabecera dual de las vistas públicas (planilla de admisión y portal del representante): logotipo oficial multicolor de BMA a la
 * izquierda e isotipo metálico de Astra en la esquina derecha, como sello sutil de autoría tecnológica.
 */
export function cabeceraDualHtml(): HtmlSeguro {
  return html`<div class="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    ${logoCompletoHtml('h-auto w-24 shrink-0 sm:w-28', true)}
    <span class="flex shrink-0 items-center rounded-lg bg-slate-900 p-1.5" title="${TEXTO_AUTORIA_PUBLICA}">${isotipoAstra('h-10 w-10 object-contain sm:h-12 sm:w-12', false, false)}</span>
  </div>`;
}

/** Pie de la planilla pública y del portal: «Desarrollado por Astra Digital Solutions» con el isotipo integrado. */
export function firmaPublica(): HtmlSeguro {
  return html`<footer class="flex items-center justify-center gap-2 border-t border-slate-200 pt-4 text-center text-xs font-medium text-slate-700">
    ${isotipoAstra('h-8 w-8 shrink-0 rounded bg-slate-900 object-contain p-1', true, true)}<span>${TEXTO_AUTORIA_PUBLICA}</span>
  </footer>`;
}
