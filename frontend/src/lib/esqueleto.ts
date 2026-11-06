/**
 * Esqueletos de carga («skeleton loaders»): estructura fantasma con pulsación sutil que se inyecta de inmediato al cambiar de pestaña,
 * antes de que llegue ningún dato. Todo es estático (sin datos dinámicos) y accesible: un único `role="status"` anuncia la carga.
 */
import { html, type HtmlSeguro } from './html';

/** Cabecera de vista (título + subtítulo) fantasma. */
function cabecera(): HtmlSeguro {
  return html`<div class="mb-6"><div class="h-8 w-56 rounded-lg bg-slate-200"></div><div class="mt-3 h-4 w-80 max-w-full rounded bg-slate-200"></div></div>`;
}

/** Esqueleto de una vista de tabla: cabecera, filtros y `filas` filas. */
export function esqueletoTabla(filas = 6): HtmlSeguro {
  const fila = html`<div class="flex gap-4 border-b border-slate-100 px-4 py-4"><div class="h-4 w-1/4 rounded bg-slate-200"></div><div class="h-4 w-1/6 rounded bg-slate-200"></div><div class="h-4 w-1/5 rounded bg-slate-200"></div><div class="h-4 w-1/6 rounded bg-slate-200"></div></div>`;
  return html`<div role="status" aria-label="Cargando" class="animate-pulse">
    ${cabecera()}
    <div class="mb-4 flex gap-2"><div class="h-8 w-20 rounded-lg bg-slate-200"></div><div class="h-8 w-24 rounded-lg bg-slate-200"></div><div class="h-8 w-28 rounded-lg bg-slate-200"></div></div>
    <div class="overflow-hidden rounded-xl border border-slate-200 bg-white"><div class="h-11 bg-slate-200"></div>${Array.from({ length: filas }, () => fila)}</div>
  </div>`;
}

/** Esqueleto de una vista de tarjetas (dashboard, sedes). */
export function esqueletoTarjetas(n = 4): HtmlSeguro {
  const tarjeta = html`<div class="rounded-xl border border-slate-200 bg-white p-6"><div class="h-4 w-1/2 rounded bg-slate-200"></div><div class="mt-4 h-7 w-2/3 rounded bg-slate-200"></div><div class="mt-3 h-3 w-1/3 rounded bg-slate-200"></div></div>`;
  return html`<div role="status" aria-label="Cargando" class="animate-pulse">
    ${cabecera()}
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">${Array.from({ length: n }, () => tarjeta)}</div>
    <div class="mt-6 h-48 rounded-xl bg-slate-200"></div>
  </div>`;
}

/** Esqueleto genérico para el resto de vistas. */
export function esqueletoGenerico(): HtmlSeguro {
  return html`<div role="status" aria-label="Cargando" class="animate-pulse">
    ${cabecera()}
    <div class="h-40 rounded-xl bg-slate-200"></div>
    <div class="mt-4 h-24 rounded-xl bg-slate-200"></div>
  </div>`;
}

/** Elige el esqueleto que mejor imita la vista de destino. */
export function esqueletoPara(vista: string): HtmlSeguro {
  if (vista === 'estudiantes' || vista === 'auditoria' || vista === 'invitaciones') return esqueletoTabla();
  if (vista === 'dashboard' || vista === 'sedes') return esqueletoTarjetas();
  return esqueletoGenerico();
}
