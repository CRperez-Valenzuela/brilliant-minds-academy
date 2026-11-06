/**
 * Firma de autoría de Astra Digital Solutions (pie del login y base del sidebar). Texto + isotipo «A» en Cyan Tecnológico (#22D3EE).
 * El isotipo es un SVG inline decorativo (`aria-hidden`); el texto visible es el nombre accesible.
 */
import { html, type HtmlSeguro } from './html';

export const TEXTO_AUTORIA = 'Diseñado y desarrollado por Astra Digital Solutions';
export const TEXTO_SUITE = 'Astra Academy Suite v1.0';
export const CYAN_TECNOLOGICO = '#22D3EE';

/** Isotipo «A»: dos diagonales y un travesaño, trazo redondeado. */
function isotipoAstra(clases: string): HtmlSeguro {
  return html`<svg viewBox="0 0 24 24" fill="none" stroke="${CYAN_TECNOLOGICO}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" class="${clases}"><path d="M4 20 12 4l8 16"/><path d="M7.6 14h8.8"/></svg>`;
}

/** Pie de la tarjeta del login. El cian va sobre una pastilla slate-900 (contraste ≈ 11:1); el texto va en slate-700. */
export function firmaLogin(): HtmlSeguro {
  return html`<footer class="mt-8 flex items-center justify-center gap-2 border-t border-slate-200 pt-4 text-center font-display text-xs font-medium tracking-wide text-slate-700">
    ${isotipoAstra('h-5 w-5 shrink-0 rounded bg-slate-900 p-0.5')}<span>${TEXTO_AUTORIA}</span>
  </footer>`;
}

/** Base del sidebar: «Astra Academy Suite v1.0» (colapsado: solo el isotipo). */
export function firmaSidebar(): HtmlSeguro {
  return html`<div class="flex items-center gap-2 border-t border-slate-200 px-4 py-3 font-display text-xs font-medium tracking-wide text-slate-700 group-data-[collapsed=true]/sb:justify-center group-data-[collapsed=true]/sb:px-0" title="${TEXTO_SUITE}">
    ${isotipoAstra('h-6 w-6 shrink-0 rounded bg-slate-900 p-1')}<span class="min-w-0 truncate group-data-[collapsed=true]/sb:sr-only">${TEXTO_SUITE}</span>
  </div>`;
}
