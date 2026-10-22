/**
 * Sistema de diseño neutro (Slate). Reglas:
 *  - Glassmorphism sobrio: TODAS las superficies de contenido usan `bg-white/90` o `bg-white/95` (opacidad ≥ 86 %), borde slate-200 y blur suave.
 *    Excepciones deliberadas: (1) la capa del Candado Premium usa `bg-white/80` + `backdrop-blur-md`, tal como pide la especificación
 *    (el texto va dentro de una tarjeta `bg-white/95`); (2) el telón oscuro detrás de los diálogos (`backdrop:bg-slate-900/60`);
 *    (3) tintes `/30` de borde y anillo en etiquetas/avisos, que no son superficies.
 *  - Escala de espaciado rígida: solo 1·2·3·4·6·8·12 (4 · 8 · 12 · 16 · 24 · 32 · 48 px).
 *  - Foco visible global (ver styles/main.css) y estados `disabled`.
 */
import { HtmlSeguro, esc, html, montar } from './html';
import { icono } from './icons';

export const CLS = {
  tarjeta: 'rounded-xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur',
  tarjetaCristal: 'rounded-xl border border-slate-200 bg-white/95 shadow-lg backdrop-blur',
  input:
    'block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 aria-[invalid=true]:border-red-700 aria-[invalid=true]:bg-red-50',
  etiqueta: 'mb-1 block text-sm font-medium text-slate-700',
  ayuda: 'mt-1 text-xs text-slate-600',
  errorCampo: 'mt-1 text-xs font-medium text-red-800',
  btn: 'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60',
  btnPrimario: 'bg-slate-900 text-white hover:bg-slate-700',
  btnSecundario: 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50',
  btnPeligro: 'bg-red-700 text-white hover:bg-red-800',
  btnOk: 'bg-emerald-700 text-white hover:bg-emerald-800',
  btnPeq: '!px-3 !py-1 text-xs',
  titulo: 'text-2xl font-bold tracking-tight text-slate-900',
  subtitulo: 'mt-1 text-sm text-slate-600',
  tabla: 'w-full min-w-[40rem] text-left text-sm',
  th: 'whitespace-nowrap border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600',
  td: 'border-b border-slate-100 px-4 py-3 align-top text-slate-800',
} as const;

export const boton = (...extra: readonly string[]): string => [CLS.btn, ...extra].join(' ');

export type Tono = 'ok' | 'warn' | 'bad' | 'info' | 'neutral';

const CLASE_ETIQUETA: Readonly<Record<Tono, string>> = {
  ok: 'bg-emerald-50 text-emerald-900 ring-emerald-700/30',
  warn: 'bg-amber-50 text-amber-900 ring-amber-700/30',
  bad: 'bg-red-50 text-red-900 ring-red-700/30',
  info: 'bg-sky-50 text-sky-900 ring-sky-700/30',
  neutral: 'bg-slate-100 text-slate-800 ring-slate-500/30',
};

const CLASE_AVISO: Readonly<Record<Tono, string>> = {
  ok: 'border-emerald-700/30 bg-emerald-50 text-emerald-900',
  warn: 'border-amber-700/30 bg-amber-50 text-amber-900',
  bad: 'border-red-700/30 bg-red-50 text-red-900',
  info: 'border-sky-700/30 bg-sky-50 text-sky-900',
  neutral: 'border-slate-300 bg-slate-50 text-slate-800',
};

export function etiqueta(texto: string, tono: Tono): HtmlSeguro {
  return html`<span class="inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${CLASE_ETIQUETA[tono]}">${texto}</span>`;
}

export function tonoEstado(estado: string): Tono {
  switch (estado) {
    case 'Activo':
    case 'Al día':
    case 'Pagada':
    case 'Aprobada':
      return 'ok';
    case 'Moroso':
    case 'Fuera de la Academia':
    case 'Rechazada':
    case 'Anulada':
      return 'bad';
    case 'Pendiente por Validación Administrativa':
    case 'Pendiente de Validación':
    case 'En Revisión':
    case 'Por Validar':
      return 'warn';
    case 'Pendiente':
      return 'info';
    default:
      return 'neutral';
  }
}

export const etiquetaEstado = (estado: string): HtmlSeguro => etiqueta(estado, tonoEstado(estado));

/** Bloque de aviso accesible (`role="alert"` para errores, `status` para el resto). */
export function aviso(tono: Tono, contenido: HtmlSeguro | string, titulo?: string): HtmlSeguro {
  const rol = tono === 'bad' ? 'alert' : 'status';
  const ic = tono === 'ok' ? 'check' : tono === 'info' || tono === 'neutral' ? 'info' : 'alert';
  return html`<div role="${rol}" class="flex gap-3 rounded-lg border p-4 text-sm ${CLASE_AVISO[tono]}">${icono(ic, 'mt-1 h-4 w-4 shrink-0')}<div class="min-w-0 break-words">${titulo ? html`<p class="font-semibold">${titulo}</p>` : null}${contenido}</div></div>`;
}

// ───────────────────────── Acceso tipado al DOM ─────────────────────────

type Constructor<E extends Element> = abstract new (...args: never[]) => E;

/** `querySelector` con comprobación de tipo en ejecución; lanza si no existe (error de programación, no de usuario). */
export function obtener<E extends Element>(selector: string, tipo: Constructor<E>, raiz: ParentNode = document): E {
  const el = raiz.querySelector(selector);
  if (!(el instanceof tipo)) throw new Error(`Elemento no encontrado o de tipo inesperado: ${selector}`);
  return el;
}

export function buscar<E extends Element>(selector: string, tipo: Constructor<E>, raiz: ParentNode = document): E | null {
  const el = raiz.querySelector(selector);
  return el instanceof tipo ? el : null;
}

export function todos<E extends Element>(selector: string, tipo: Constructor<E>, raiz: ParentNode = document): readonly E[] {
  return Array.from(raiz.querySelectorAll(selector)).filter((el): el is E => el instanceof tipo);
}

// ───────────────────────── Avisos flotantes (toasts) ─────────────────────────

function contenedorAvisos(): HTMLElement {
  const existente = document.getElementById('avisos');
  if (existente) return existente;
  const c = document.createElement('div');
  c.id = 'avisos';
  c.className = 'pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-end gap-2 sm:left-auto sm:w-96';
  document.body.append(c);
  return c;
}

export function notificar(tono: Tono, mensaje: string, duracionMs = 6_000): void {
  const caja = document.createElement('div');
  caja.className = 'pointer-events-auto w-full';
  montar(caja, aviso(tono, mensaje));
  contenedorAvisos().append(caja);
  window.setTimeout(() => caja.remove(), duracionMs);
}

// ───────────────────────── Modales (<dialog> nativo: foco atrapado + Esc) ─────────────────────────

export interface Modal {
  readonly dialogo: HTMLDialogElement;
  cerrar(): void;
}

export interface OpcionesModal {
  readonly titulo: string;
  readonly cuerpo: HtmlSeguro;
  readonly ancho?: 'md' | 'lg';
  readonly alCerrar?: () => void;
}

let contadorModal = 0;

export function abrirModal(opciones: OpcionesModal): Modal {
  contadorModal += 1;
  const idTitulo = `modal-titulo-${contadorModal}`;
  const dialogo = document.createElement('dialog');
  dialogo.setAttribute('aria-labelledby', idTitulo);
  dialogo.className = `m-auto w-[calc(100%-2rem)] ${opciones.ancho === 'lg' ? 'max-w-2xl' : 'max-w-md'} rounded-xl border border-slate-200 bg-white/95 p-0 text-slate-900 shadow-lg backdrop:bg-slate-900/60 backdrop:backdrop-blur-sm`;
  montar(
    dialogo,
    html`<div class="p-6">
      <div class="mb-4 flex items-start justify-between gap-4">
        <h2 id="${idTitulo}" class="text-lg font-bold">${opciones.titulo}</h2>
        <button type="button" data-cerrar class="${boton(CLS.btnSecundario, CLS.btnPeq)}" aria-label="Cerrar">${icono('x', 'h-4 w-4')}</button>
      </div>
      <div data-cuerpo>${opciones.cuerpo}</div>
    </div>`,
  );
  const cerrar = (): void => {
    if (dialogo.open) dialogo.close();
  };
  dialogo.addEventListener('close', () => {
    dialogo.remove();
    opciones.alCerrar?.();
  });
  dialogo.addEventListener('click', (ev) => {
    if (ev.target === dialogo) cerrar(); // clic sobre el fondo difuminado
  });
  dialogo.querySelector('[data-cerrar]')?.addEventListener('click', cerrar);
  document.body.append(dialogo);
  dialogo.showModal();
  return { dialogo, cerrar };
}

// ───────────────────────── Utilidades varias ─────────────────────────

export function iniciales(texto: string): string {
  return esc(texto.trim().slice(0, 1).toUpperCase());
}

/** Ejecuta `tarea` con el botón bloqueado y un indicador de progreso; siempre lo restaura. */
export async function conBotonOcupado<T>(boton_: HTMLButtonElement, tarea: () => Promise<T>): Promise<T> {
  const etiquetaOriginal = boton_.innerHTML;
  boton_.disabled = true;
  boton_.setAttribute('aria-busy', 'true');
  montar(boton_, html`${icono('refresh', 'h-4 w-4 animate-spin')}<span>Procesando…</span>`);
  try {
    return await tarea();
  } finally {
    boton_.disabled = false;
    boton_.removeAttribute('aria-busy');
    boton_.innerHTML = etiquetaOriginal;
  }
}
