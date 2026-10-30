/**
 * Vista «Invitaciones» — enlaces únicos de inscripción con NIVEL y SEDE blindados.
 *  - Formulario → POST /api/invitaciones { nivel_asignado, dias, sede_id? }. La sede se filtra por alcance (lib/alcance.ts):
 *      · consolidado (admin sin sede) → selector con las sedes activas; `sede_id` es obligatorio;
 *      · usuario de sede (secretaria)  → sede fija (solo lectura) y NO se envía `sede_id`: el servidor usa la de su sesión.
 *    Sin sede asignada la vista muestra «Sección Restringida» y no dispara peticiones (el servidor respondería 403 SEDE_NO_ASIGNADA).
 *  - Respuesta 201 { id, sede_id, nivel_asignado, expira_en, token, enlace }: el `token` (48 hex) solo existe en esa respuesta, en la base
 *    queda su SHA-256. Se muestra una tarjeta de éxito con el `enlace` y «Copiar enlace» (navigator.clipboard) para pegarlo en WhatsApp.
 *  - GET /api/invitaciones (paginado, filtro por estado) → lista cronológica con estado efectivo: Pendiente · Usada · Vencida · Revocada.
 *  - «Revocar» → POST /api/invitaciones/:id/revocar. El servidor lo resuelve con un UPDATE condicionado a estado = 'Pendiente' (atómico):
 *    si otra persona la revocó o el representante la usó en ese instante responde 409 INVITACION_NO_REVOCABLE y la lista se refresca.
 *
 * El servidor es la fuente de verdad: ignora cualquier grado enviado por el formulario público y usa `nivel_asignado`.
 * Todo texto dinámico pasa por la etiqueta `html` (escape XSS automático); los errores se escriben con `textContent`.
 */
import { bma, BmaApiError, BmaSesionExpiradaError, mensajeDeError } from './api/bmaClient';
import { html, montar, raw, type HtmlSeguro } from './lib/html';
import { icono } from './lib/icons';
import { fechaHora } from './lib/format';
import { alcanceDe, type AlcanceUsuario } from './lib/alcance';
import { CLS, abrirModal, aviso, boton, buscar, conBotonOcupado, etiqueta, notificar, obtener, type Tono } from './lib/ui';
import { encabezadoVista } from './lib/candado';
import { erroresDeCampos, mostrarMensaje, pintarErrores, valorDe } from './lib/formulario';
import type {
  CuerpoCrearInvitacion,
  EstadoInvitacion,
  InvitacionInscripcion,
  Paginacion,
  RespuestaCrearInvitacion,
  RespuestaRevocarInvitacion,
  SedeResumen,
  Usuario,
} from './types/index';

export interface ContextoInvitaciones {
  readonly zona: HTMLElement;
  readonly vigente: () => boolean;
  readonly usuario: Usuario | null;
  readonly alSesionExpirada: () => void;
}

// ───────────────────────── Constantes ─────────────────────────

export const DIAS_DEFECTO = 7;
export const DIAS_MIN = 1;
/** Tope del servidor (`dias` ≤ 60 en controllers/sedes.controller.js). */
export const DIAS_MAX = 60;
const MAX_NIVEL = 60;
const LIMITE_PAGINA = 10;
const OPCION_OTRO = '__otro__';

/**
 * Niveles ofrecidos en el selector. Es una lista base: ajústala a los niveles reales de la academia; «Otro…» permite escribir uno distinto.
 * El valor elegido viaja como `nivel_asignado` y se convierte en el «Grado a cursar» bloqueado de la planilla pública.
 */
export const NIVELES: readonly string[] = [
  'Maternal',
  'Preescolar 1.er nivel',
  'Preescolar 2.º nivel',
  'Preescolar 3.er nivel',
  '1.er grado',
  '2.º grado',
  '3.er grado',
  '4.º grado',
  '5.º grado',
  '6.º grado',
  '1.er año',
  '2.º año',
  '3.er año',
  '4.º año',
  '5.º año',
];

const FILTROS: readonly ('' | EstadoInvitacion)[] = ['', 'Pendiente', 'Usada', 'Vencida', 'Revocada'];

const TONO_ESTADO: Readonly<Record<EstadoInvitacion, Tono>> = {
  Pendiente: 'info',
  Usada: 'ok',
  Vencida: 'warn',
  Revocada: 'bad',
};

// ───────────────────────── Validación (pura, sin DOM) ─────────────────────────

export interface EntradaInvitacion {
  readonly sede: string;
  readonly nivel: string;
  readonly nivelOtro: string;
  readonly dias: string;
}

export interface ResultadoInvitacion {
  readonly errores: Readonly<Record<string, string>>;
  readonly cuerpo: CuerpoCrearInvitacion | null;
}

/** Misma regla que el servidor: nivel 1–60, días entero 1–60, `sede_id` obligatorio solo para el acceso consolidado. */
export function validarInvitacion(e: EntradaInvitacion, alcance: AlcanceUsuario): ResultadoInvitacion {
  const errores: Record<string, string> = {};

  let sedeId: number | null = null;
  if (alcance.tipo === 'consolidado') {
    const n = Number(e.sede);
    if (e.sede === '' || !Number.isInteger(n) || n <= 0) errores['sede_id'] = 'Elige la sede a la que pertenecerá el estudiante.';
    else sedeId = n;
  }

  let nivel = '';
  if (e.nivel === OPCION_OTRO) {
    nivel = e.nivelOtro.trim().replace(/\s+/g, ' ');
    if (nivel === '') errores['nivel_otro'] = 'Escribe el nivel o grado.';
    else if (nivel.length > MAX_NIVEL) errores['nivel_otro'] = `El nivel admite hasta ${MAX_NIVEL} caracteres.`;
  } else if (NIVELES.includes(e.nivel)) {
    nivel = e.nivel;
  } else {
    errores['nivel_asignado'] = 'Elige el nivel o grado asignado.';
  }

  const diasTexto = e.dias.trim();
  const dias = /^\d{1,3}$/.test(diasTexto) ? Number(diasTexto) : Number.NaN;
  if (!Number.isInteger(dias) || dias < DIAS_MIN || dias > DIAS_MAX) {
    errores['dias'] = `Escribe un número entero de días entre ${DIAS_MIN} y ${DIAS_MAX}.`;
  }

  if (Object.keys(errores).length > 0) return { errores, cuerpo: null };
  return { errores, cuerpo: sedeId === null ? { nivel_asignado: nivel, dias } : { nivel_asignado: nivel, dias, sede_id: sedeId } };
}

// ───────────────────────── Portapapeles ─────────────────────────

/**
 * Copia con `navigator.clipboard` (requiere contexto seguro: HTTPS o localhost). Devuelve `false` si el navegador lo impide;
 * en ese caso deja el texto seleccionado en `entrada` para que la persona pulse Ctrl+C.
 */
export async function copiarEnlace(texto: string, entrada: HTMLInputElement): Promise<boolean> {
  try {
    if (window.isSecureContext && typeof navigator.clipboard?.writeText === 'function') {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch {
    /* permiso denegado o documento sin foco: se usa la selección manual */
  }
  entrada.focus();
  entrada.select();
  entrada.setSelectionRange(0, texto.length);
  return false;
}

// ───────────────────────── Interfaz ─────────────────────────

const CLASE_SOLO_LECTURA = 'flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-800';

function restringidaHtml(): HtmlSeguro {
  return html`${encabezadoVista('Invitaciones', 'Enlaces únicos de inscripción para los representantes')}
    <div class="max-w-2xl">${aviso('warn', 'Tu usuario no tiene una sede asignada, así que no puede emitir invitaciones. Pide a un administrador que revise tu cuenta.', 'Sección Restringida')}</div>`;
}

function campoSedeHtml(alcance: AlcanceUsuario, sedes: readonly SedeResumen[]): HtmlSeguro {
  if (alcance.tipo === 'consolidado') {
    const activas = sedes.filter((s) => s.activa);
    const unica = activas.length === 1 ? activas[0] : undefined;
    return html`<div>
      <label for="f-inv-sede" class="${CLS.etiqueta}">Sede destino <span class="text-red-800" aria-hidden="true">*</span></label>
      <select id="f-inv-sede" name="sede_id" required aria-describedby="e-inv-sede" class="${CLS.input} min-h-10">
        <option value="">Elige una sede…</option>
        ${activas.map((s) => html`<option value="${s.id}" ${s.id === unica?.id ? raw('selected') : null}>${s.nombre}</option>`)}
      </select>
      <p id="e-inv-sede" data-error="sede_id" role="alert" hidden class="${CLS.errorCampo}"></p>
    </div>`;
  }
  const propia = sedes.find((s) => alcance.tipo === 'sede' && s.id === alcance.sedeId);
  return html`<div>
    <span class="${CLS.etiqueta}">Sede destino</span>
    <p class="${CLASE_SOLO_LECTURA}">${icono('building', 'h-4 w-4')}<span class="min-w-0 break-words">${propia?.nombre ?? 'Tu sede'}</span></p>
    <p class="${CLS.ayuda}">Las invitaciones se emiten siempre para tu sede.</p>
  </div>`;
}

function formularioHtml(alcance: AlcanceUsuario, sedes: readonly SedeResumen[]): HtmlSeguro {
  return html`<section class="${CLS.tarjetaCristal} p-6" aria-labelledby="t-nueva-inv">
    <h2 id="t-nueva-inv" class="mb-1 flex items-center gap-2 text-base font-bold text-slate-900">${icono('link', 'h-5 w-5')}Nueva invitación</h2>
    <p class="${CLS.ayuda} mb-4">El enlace es de un solo uso y fija la sede y el nivel: el representante no puede cambiarlos en la planilla.</p>
    <form id="form-inv" novalidate class="grid gap-4 sm:grid-cols-2" aria-label="Emitir invitación">
      ${campoSedeHtml(alcance, sedes)}
      <div>
        <label for="f-inv-nivel" class="${CLS.etiqueta}">Nivel / grado asignado <span class="text-red-800" aria-hidden="true">*</span></label>
        <select id="f-inv-nivel" name="nivel_asignado" required aria-describedby="e-inv-nivel" class="${CLS.input} min-h-10">
          <option value="">Elige un nivel…</option>
          ${NIVELES.map((n) => html`<option value="${n}">${n}</option>`)}
          <option value="${OPCION_OTRO}">Otro…</option>
        </select>
        <p id="e-inv-nivel" data-error="nivel_asignado" role="alert" hidden class="${CLS.errorCampo}"></p>
        <div id="inv-nivel-otro" class="mt-2" hidden>
          <label for="f-inv-otro" class="${CLS.etiqueta}">Escribe el nivel</label>
          <input id="f-inv-otro" name="nivel_otro" type="text" maxlength="${MAX_NIVEL}" autocomplete="off" aria-describedby="e-inv-otro" class="${CLS.input} min-h-10">
          <p id="e-inv-otro" data-error="nivel_otro" role="alert" hidden class="${CLS.errorCampo}"></p>
        </div>
      </div>
      <div>
        <label for="f-inv-dias" class="${CLS.etiqueta}">Días de vigencia <span class="text-red-800" aria-hidden="true">*</span></label>
        <input id="f-inv-dias" name="dias" type="text" inputmode="numeric" required autocomplete="off" value="${DIAS_DEFECTO}" aria-describedby="e-inv-dias" class="${CLS.input} min-h-10">
        <p class="${CLS.ayuda}">Entre ${DIAS_MIN} y ${DIAS_MAX} días. Por defecto ${DIAS_DEFECTO}.</p>
        <p id="e-inv-dias" data-error="dias" role="alert" hidden class="${CLS.errorCampo}"></p>
      </div>
      <div class="flex items-end justify-end sm:col-span-2">
        <button type="submit" class="${boton(CLS.btnPrimario, 'min-h-10')}">${icono('link', 'h-4 w-4')}<span>Generar enlace</span></button>
      </div>
    </form>
    <div id="inv-resultado" class="mt-4" aria-live="polite"></div>
  </section>`;
}

function tarjetaExitoHtml(r: RespuestaCrearInvitacion, nombreSede: string): HtmlSeguro {
  return html`<section class="${CLS.tarjetaCristal} border-emerald-700/30 p-6" aria-labelledby="t-inv-ok">
    <h2 id="t-inv-ok" class="flex items-center gap-2 text-base font-bold text-slate-900">${icono('check', 'h-5 w-5 text-emerald-700')}Invitación creada</h2>
    <p class="${CLS.ayuda} mb-4">${nombreSede} · ${r.nivel_asignado} · vence el ${fechaHora(r.expira_en)} · un solo uso.</p>
    <label for="inv-enlace" class="${CLS.etiqueta}">Enlace de inscripción</label>
    <div class="flex flex-col gap-3 sm:flex-row">
      <input id="inv-enlace" type="text" readonly value="${r.enlace}" class="${CLS.input} min-h-10 flex-1 font-mono text-xs">
      <button type="button" id="inv-copiar" class="${boton(CLS.btnPrimario, 'min-h-10')}">${icono('copy', 'h-4 w-4')}<span>Copiar enlace</span></button>
    </div>
    <div class="mt-4">${aviso('warn', 'Por seguridad el enlace se muestra solo ahora: en el sistema queda únicamente su huella cifrada. Cópialo y envíalo al representante (por ejemplo, por WhatsApp). Si lo pierdes, revoca esta invitación y emite otra.', 'Cópialo ahora')}</div>
  </section>`;
}

function filaHtml(i: InvitacionInscripcion): HtmlSeguro {
  const cierre =
    i.estado === 'Usada' && i.usada_en !== null
      ? html`Usada el ${fechaHora(i.usada_en)}`
      : html`Vence el ${fechaHora(i.expira_en)}`;
  return html`<tr>
    <td class="${CLS.td}">${i.sede}</td>
    <td class="${CLS.td}">${i.nivel_asignado}</td>
    <td class="${CLS.td}">${etiqueta(i.estado, TONO_ESTADO[i.estado])}</td>
    <td class="${CLS.td} whitespace-nowrap">${fechaHora(i.creado_en)}</td>
    <td class="${CLS.td} whitespace-nowrap">${cierre}</td>
    <td class="${CLS.td} text-right">
      ${i.estado === 'Pendiente'
        ? html`<button type="button" data-revocar="${i.id}" class="${boton(CLS.btnSecundario, 'min-h-10')}" aria-label="Revocar invitación de ${i.nivel_asignado} en ${i.sede}">${icono('x', 'h-4 w-4')}<span>Revocar</span></button>`
        : null}
    </td>
  </tr>`;
}

function tablaHtml(filas: readonly InvitacionInscripcion[]): HtmlSeguro {
  if (filas.length === 0) return aviso('info', 'No hay invitaciones con este filtro.', 'Sin resultados');
  return html`<div class="overflow-x-auto rounded-xl border border-slate-200 bg-white/90 backdrop-blur">
    <table class="${CLS.tabla}">
      <thead><tr>
        <th scope="col" class="${CLS.th}">Sede</th>
        <th scope="col" class="${CLS.th}">Nivel</th>
        <th scope="col" class="${CLS.th}">Estado</th>
        <th scope="col" class="${CLS.th}">Emitida</th>
        <th scope="col" class="${CLS.th}">Vigencia</th>
        <th scope="col" class="${CLS.th}"><span class="sr-only">Acciones</span></th>
      </tr></thead>
      <tbody>${filas.map(filaHtml)}</tbody>
    </table>
  </div>`;
}

function paginadorHtml(p: Paginacion): HtmlSeguro {
  const paginas = Math.max(1, Math.ceil(p.total / Math.max(1, p.limite)));
  return html`<nav class="mt-4 flex flex-wrap items-center justify-between gap-4 text-sm" aria-label="Paginación de invitaciones">
    <span class="text-slate-600">Página ${p.pagina} de ${paginas} · ${p.total} invitación(es)</span>
    <span class="flex gap-2">
      <button type="button" data-pag="-1" class="${boton(CLS.btnSecundario, 'min-h-10')}" ${p.pagina <= 1 ? raw('disabled') : null}>Anterior</button>
      <button type="button" data-pag="1" class="${boton(CLS.btnSecundario, 'min-h-10')}" ${p.pagina >= paginas ? raw('disabled') : null}>Siguiente</button>
    </span>
  </nav>`;
}

function esqueletoHtml(): HtmlSeguro {
  return html`<div class="h-32 animate-pulse rounded-xl bg-slate-200" role="status" aria-label="Cargando invitaciones"></div>`;
}

function vistaHtml(alcance: AlcanceUsuario, sedes: readonly SedeResumen[]): HtmlSeguro {
  const sinSedes = alcance.tipo === 'consolidado' && !sedes.some((s) => s.activa);
  return html`${encabezadoVista('Invitaciones', 'Enlaces únicos de inscripción con sede y nivel blindados')}
    <div class="flex flex-col gap-8">
      <div class="max-w-3xl">
        ${sinSedes
          ? aviso('warn', 'No hay sedes activas. Crea o activa una sede en la sección Sedes antes de emitir invitaciones.', 'Sin sedes disponibles')
          : formularioHtml(alcance, sedes)}
      </div>
      <div id="inv-exito" class="max-w-3xl" aria-live="polite"></div>
      <section aria-labelledby="t-inv-lista">
        <div class="mb-4 flex flex-wrap items-end justify-between gap-4">
          <h2 id="t-inv-lista" class="text-base font-bold text-slate-900">Invitaciones emitidas</h2>
          <div>
            <label for="inv-filtro" class="${CLS.etiqueta}">Estado</label>
            <select id="inv-filtro" class="${CLS.input} min-h-10">${FILTROS.map((f) => html`<option value="${f}">${f === '' ? 'Todas' : f}</option>`)}</select>
          </div>
        </div>
        <div id="inv-lista">${esqueletoHtml()}</div>
      </section>
    </div>`;
}

// ───────────────────────── Comportamiento ─────────────────────────

function enlazarFormulario(ctx: ContextoInvitaciones, alcance: AlcanceUsuario, sedes: readonly SedeResumen[], alCrear: () => void): void {
  const form = buscar('#form-inv', HTMLFormElement, ctx.zona);
  if (form === null) return; // sin sedes activas no hay formulario
  const salida = obtener('#inv-resultado', HTMLElement, ctx.zona);
  const exito = obtener('#inv-exito', HTMLElement, ctx.zona);
  const selNivel = obtener('#f-inv-nivel', HTMLSelectElement, form);
  const cajaOtro = obtener('#inv-nivel-otro', HTMLElement, form);

  selNivel.addEventListener('change', () => {
    cajaOtro.hidden = selNivel.value !== OPCION_OTRO;
    if (!cajaOtro.hidden) obtener('#f-inv-otro', HTMLInputElement, form).focus();
  });

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const r = validarInvitacion(
      { sede: valorDe(form, 'sede_id'), nivel: valorDe(form, 'nivel_asignado'), nivelOtro: valorDe(form, 'nivel_otro'), dias: valorDe(form, 'dias') },
      alcance,
    );
    pintarErrores(form, r.errores);
    montar(salida, html``);
    if (r.cuerpo === null) return;
    const cuerpo = r.cuerpo;
    const enviar = obtener('button[type="submit"]', HTMLButtonElement, form);

    void conBotonOcupado(enviar, () => bma.post<RespuestaCrearInvitacion>('/invitaciones', cuerpo))
      .then((resp) => {
        if (!ctx.vigente()) return;
        const nombreSede = sedes.find((s) => s.id === resp.sede_id)?.nombre ?? 'Sede';
        montar(exito, tarjetaExitoHtml(resp, nombreSede));
        enlazarCopia(exito, resp.enlace);
        obtener('#inv-copiar', HTMLButtonElement, exito).focus();
        alCrear();
      })
      .catch((e: unknown) => {
        if (e instanceof BmaSesionExpiradaError) {
          ctx.alSesionExpirada();
          return;
        }
        if (!ctx.vigente()) return;
        const campos = erroresDeCampos(e);
        if (campos) pintarErrores(form, campos);
        mostrarMensaje(salida, 'err', mensajeDeError(e)); // incl. 422 SEDE_INACTIVA y 403 SEDE_NO_ASIGNADA
      });
  });
}

function enlazarCopia(raiz: HTMLElement, enlace: string): void {
  const boton_ = obtener('#inv-copiar', HTMLButtonElement, raiz);
  const entrada = obtener('#inv-enlace', HTMLInputElement, raiz);
  const original = boton_.innerHTML;
  boton_.addEventListener('click', () => {
    void copiarEnlace(enlace, entrada).then((copiado) => {
      if (!copiado) {
        notificar('warn', 'Tu navegador no permitió copiar automáticamente. El enlace quedó seleccionado: pulsa Ctrl+C (⌘+C en Mac).');
        return;
      }
      montar(boton_, html`${icono('check', 'h-4 w-4')}<span>¡Copiado!</span>`);
      notificar('ok', 'Enlace copiado. Ya puedes pegarlo en WhatsApp.');
      window.setTimeout(() => {
        if (boton_.isConnected) boton_.innerHTML = original;
      }, 2_500);
    });
  });
}

function confirmarRevocacion(inv: InvitacionInscripcion, alRevocar: () => void, alSesionExpirada: () => void): void {
  const modal = abrirModal({
    titulo: 'Revocar invitación',
    cuerpo: html`<p class="text-sm text-slate-700">Se desactivará el enlace de <strong>${inv.nivel_asignado}</strong> en <strong>${inv.sede}</strong>. Quien lo abra verá que ya no es válido. Esta acción no se puede deshacer.</p>
      <div class="mt-6 flex justify-end gap-3">
        <button type="button" data-cancelar class="${boton(CLS.btnSecundario, 'min-h-10')}">Cancelar</button>
        <button type="button" data-confirmar class="${boton(CLS.btnPeligro, 'min-h-10')}">${icono('x', 'h-4 w-4')}<span>Revocar</span></button>
      </div>`,
  });
  buscar('[data-cancelar]', HTMLButtonElement, modal.dialogo)?.addEventListener('click', modal.cerrar);
  const confirmar = obtener('[data-confirmar]', HTMLButtonElement, modal.dialogo);
  confirmar.addEventListener('click', () => {
    void conBotonOcupado(confirmar, () => bma.post<RespuestaRevocarInvitacion>(`/invitaciones/${inv.id}/revocar`))
      .then(() => {
        modal.cerrar();
        notificar('ok', 'Invitación revocada: el enlace ya no sirve.');
        alRevocar();
      })
      .catch((e: unknown) => {
        if (e instanceof BmaSesionExpiradaError) {
          modal.cerrar();
          alSesionExpirada();
          return;
        }
        if (e instanceof BmaApiError && e.codigo === 'INVITACION_NO_REVOCABLE') {
          modal.cerrar();
          notificar('warn', e.message); // otra persona la revocó o ya fue usada: la lista se refresca con el estado real
          alRevocar();
          return;
        }
        notificar('bad', mensajeDeError(e));
      });
  });
}

/** Conecta la lista (estado propio: filtro, página, carga) y devuelve la acción «volver a la primera página sin filtro y recargar». */
function enlazarLista(ctx: ContextoInvitaciones): () => void {
  const contenedor = obtener('#inv-lista', HTMLElement, ctx.zona);
  const filtro = obtener('#inv-filtro', HTMLSelectElement, ctx.zona);
  let filtroActual: '' | EstadoInvitacion = '';
  let pagina = 1;
  let filas: readonly InvitacionInscripcion[] = [];
  let peticion = 0; // descarta respuestas viejas si la persona cambia de filtro o página muy rápido

  const cargar = async (): Promise<void> => {
    peticion += 1;
    const mia = peticion;
    montar(contenedor, esqueletoHtml());
    try {
      const r = await bma.pagina<InvitacionInscripcion>('/invitaciones', { estado: filtroActual, pagina, limite: LIMITE_PAGINA });
      if (!ctx.vigente() || mia !== peticion) return;
      filas = r.datos;
      montar(contenedor, html`${tablaHtml(r.datos)}${paginadorHtml(r.paginacion)}`);
    } catch (e: unknown) {
      if (!ctx.vigente() || mia !== peticion) return;
      if (e instanceof BmaSesionExpiradaError) {
        ctx.alSesionExpirada();
        return;
      }
      montar(contenedor, html`${aviso('bad', mensajeDeError(e), 'No se pudo cargar la lista')}
        <button type="button" data-reintentar class="${boton(CLS.btnSecundario, 'mt-4 min-h-10')}">${icono('refresh', 'h-4 w-4')}<span>Reintentar</span></button>`);
    }
  };

  contenedor.addEventListener('click', (ev) => {
    const objetivo = ev.target instanceof Element ? ev.target : null;
    const revocar = objetivo?.closest('[data-revocar]');
    if (revocar instanceof HTMLElement) {
      const id = Number(revocar.dataset['revocar']);
      const inv = filas.find((f) => f.id === id);
      if (inv) confirmarRevocacion(inv, () => void cargar(), () => ctx.alSesionExpirada());
      return;
    }
    if (objetivo?.closest('[data-reintentar]')) {
      void cargar();
      return;
    }
    const pag = objetivo?.closest('[data-pag]');
    if (pag instanceof HTMLButtonElement && !pag.disabled) {
      pagina = Math.max(1, pagina + Number(pag.dataset['pag']));
      void cargar();
    }
  });

  filtro.addEventListener('change', () => {
    const elegido = FILTROS.find((f) => f === filtro.value);
    filtroActual = elegido ?? '';
    pagina = 1;
    void cargar();
  });

  void cargar();

  // Tras emitir una invitación la lista vuelve a la primera página sin filtro, para que la nueva se vea arriba.
  return () => {
    filtro.value = '';
    filtroActual = '';
    pagina = 1;
    void cargar();
  };
}

/** Punto de entrada. Los errores de carga (red, 401) se propagan al panel, que ya sabe pintarlos. */
export async function vistaInvitaciones(ctx: ContextoInvitaciones): Promise<void> {
  const alcance = alcanceDe(ctx.usuario);
  if (alcance.tipo === 'denegado') {
    montar(ctx.zona, restringidaHtml()); // sin peticiones: el servidor respondería 403 SEDE_NO_ASIGNADA
    return;
  }
  const sedes = await bma.get<readonly SedeResumen[]>('/sedes'); // un usuario de sede recibe solo la suya
  if (!ctx.vigente()) return;
  montar(ctx.zona, vistaHtml(alcance, sedes));
  const recargarLista = enlazarLista(ctx);
  enlazarFormulario(ctx, alcance, sedes, recargarLista);
}
