/**
 * Portal del representante.
 *  - El token llega en la URL (`/portal/:token`; en desarrollo también `?token=`). Nunca se guarda en sessionStorage:
 *    el portal usa su propio token y NO envía el Bearer del panel administrativo.
 *  - Estado de cuenta (estado académico + estatus de pago), cuotas pendientes a tasa BCV y formulario tipado
 *    para declarar la referencia de transferencia / pago móvil.
 */
import './styles/main.css';
import { bma, BmaApiError, mensajeDeError } from './api/bmaClient';
import { html, montar, type HtmlSeguro } from './lib/html';
import { icono } from './lib/icons';
import { bs, esVencida, fechaCorta, nombreMetodo, tasa as formatoTasa, usd } from './lib/format';
import { CLS, aviso, boton, buscar, conBotonOcupado, etiqueta, etiquetaEstado, notificar, obtener, todos } from './lib/ui';
import type {
  CuentaPago,
  CuotaPortal,
  DeclararReferenciaPeticion,
  DeclararReferenciaRespuesta,
  EstadoCuentaPortal,
  MetodoPago,
} from './types/index';

const METODOS: readonly MetodoPago[] = ['ZELLE', 'BINANCE', 'PAYPAL', 'PAGO_MOVIL'];
const RE_REFERENCIA = /^[A-Za-z0-9-]{4,40}$/;
const RE_TOKEN = /^[A-Za-z0-9._~-]{8,256}$/;

const esMetodoPago = (v: string): v is MetodoPago => (METODOS as readonly string[]).includes(v);

// ───────────────────────── Token ─────────────────────────

/** Extrae el token de `/portal/<token>` o, como respaldo (desarrollo), de `?token=`. Devuelve null si no hay o no es válido. */
export function capturarToken(ubicacion: Pick<Location, 'pathname' | 'search'> = window.location): string | null {
  const m = /^\/portal\/([^/]+)\/?$/.exec(ubicacion.pathname);
  let candidato: string | null = null;
  if (m && m[1] !== undefined && m[1] !== 'index.html') {
    try {
      candidato = decodeURIComponent(m[1]);
    } catch {
      candidato = null;
    }
  } else {
    candidato = new URLSearchParams(ubicacion.search).get('token');
  }
  return candidato !== null && RE_TOKEN.test(candidato) ? candidato : null;
}

// ───────────────────────── Estado ─────────────────────────

type EstadoPortal =
  | { readonly fase: 'cargando' }
  | { readonly fase: 'error'; readonly mensaje: string }
  | { readonly fase: 'listo'; readonly datos: EstadoCuentaPortal };

let token: string | null = null;
let estado: EstadoPortal = { fase: 'cargando' };
const enviando = new Set<number>();

// ───────────────────────── Cálculos ─────────────────────────

/** Suma en centavos enteros para evitar errores de coma flotante. */
export function sumarMonto(valores: readonly number[]): number {
  return valores.reduce((acc, v) => acc + Math.round(v * 100), 0) / 100;
}

export function cuotasAbiertas(cuotas: readonly CuotaPortal[]): readonly CuotaPortal[] {
  return cuotas.filter((c) => c.estado === 'Pendiente' || c.estado === 'En Revisión');
}

// ───────────────────────── Plantillas ─────────────────────────

function bannerEstado(d: EstadoCuentaPortal, pendientes: readonly CuotaPortal[]): HtmlSeguro {
  const vencidas = pendientes.filter((c) => c.estado === 'Pendiente' && esVencida(c.fecha_vencimiento));
  switch (d.estado) {
    case 'Fuera de la Academia':
      return aviso('bad', 'El estudiante figura fuera de la academia. Comunícate con la administración antes de realizar pagos.', 'Cuenta inactiva');
    case 'Pendiente por Validación Administrativa':
      return aviso('info', 'La administración está validando la inscripción y el pago de la matrícula. Te avisaremos por WhatsApp.', 'Inscripción en validación');
    case 'Moroso':
      return aviso('warn', `Tienes ${vencidas.length} ${vencidas.length === 1 ? 'cuota vencida' : 'cuotas vencidas'}. Registra tu pago para regularizar la cuenta.`, 'Cuenta con saldo vencido');
    default:
      return pendientes.length === 0
        ? aviso('ok', 'No tienes cuotas pendientes. ¡Gracias por estar al día!', 'Cuenta al día')
        : aviso('ok', 'Tu cuenta está al día. Estas son las próximas cuotas.', 'Cuenta al día');
  }
}

function cuentasHtml(cuentas: readonly CuentaPago[]): HtmlSeguro {
  if (cuentas.length === 0) return html`<p class="${CLS.ayuda}">Consulta los datos de pago con la administración.</p>`;
  return html`<ul class="mt-2 grid gap-2 sm:grid-cols-2">${cuentas.map(
    (c) => html`<li class="rounded-lg border border-slate-200 bg-white/95 p-3 text-sm"><p class="font-semibold text-slate-900">${nombreMetodo(c.metodo)}</p><p class="break-words text-slate-700">${c.detalle}</p><p class="text-xs text-slate-600">Titular: ${c.titular}</p></li>`,
  )}</ul>`;
}

function formularioReferencia(c: CuotaPortal): HtmlSeguro {
  const idRef = `ref-${c.id}`;
  const idMet = `met-${c.id}`;
  return html`<form data-cuota="${c.id}" novalidate class="mt-4 grid gap-4 border-t border-slate-200 pt-4 sm:grid-cols-2" aria-label="Registrar referencia de ${c.concepto}">
    <div>
      <label for="${idMet}" class="${CLS.etiqueta}">Método de pago</label>
      <select id="${idMet}" name="metodo_pago" class="${CLS.input}">${METODOS.map((m) => html`<option value="${m}">${nombreMetodo(m)}</option>`)}</select>
    </div>
    <div>
      <label for="${idRef}" class="${CLS.etiqueta}">Número de referencia</label>
      <input id="${idRef}" name="referencia" type="text" required maxlength="40" autocomplete="off" aria-describedby="${idRef}-ayuda ${idRef}-error" class="${CLS.input}">
      <p id="${idRef}-ayuda" class="${CLS.ayuda}">4 a 40 caracteres: letras, números o guiones, sin espacios.</p>
      <p id="${idRef}-error" class="${CLS.errorCampo}" role="alert" hidden></p>
    </div>
    <div class="sm:col-span-2">
      <button type="submit" class="${boton(CLS.btnPrimario, 'w-full sm:w-auto')}">${icono('check', 'h-4 w-4')}<span>Registrar referencia</span></button>
    </div>
  </form>`;
}

function cuotaHtml(c: CuotaPortal): HtmlSeguro {
  const vencida = c.estado === 'Pendiente' && esVencida(c.fecha_vencimiento);
  return html`<li class="${CLS.tarjeta} p-6" data-cuota-card="${c.id}">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="min-w-0">
        <h3 class="break-words text-base font-bold text-slate-900">${c.concepto}</h3>
        <p class="mt-1 text-sm text-slate-600">Vence el <time>${fechaCorta(c.fecha_vencimiento)}</time></p>
      </div>
      <div class="flex flex-wrap items-center gap-2">${vencida ? etiqueta('Vencida', 'bad') : null}${etiquetaEstado(c.estado === 'Pendiente' ? 'Pendiente' : 'En Revisión')}</div>
    </div>
    <p class="mt-4 text-2xl font-bold text-slate-900">${usd(c.monto_usd)} <span class="text-lg font-semibold text-slate-700">≈ ${bs(c.monto_bs)}</span></p>
    ${c.estado === 'Pendiente' ? formularioReferencia(c) : html`<p class="mt-4 text-sm text-slate-700">Tu referencia está en revisión. La administración la confirmará en breve.</p>`}
  </li>`;
}

function vistaListo(d: EstadoCuentaPortal): HtmlSeguro {
  const abiertas = cuotasAbiertas(d.cuotas);
  const porPagar = abiertas.filter((c) => c.estado === 'Pendiente');
  return html`
    <section class="${CLS.tarjetaCristal} p-6" aria-labelledby="t-estudiante">
      <p class="text-sm text-slate-600">Estudiante</p>
      <h2 id="t-estudiante" class="break-words text-xl font-bold text-slate-900">${d.estudiante}</h2>
      <div class="mt-4 flex flex-wrap items-center gap-2">${etiquetaEstado(d.estado)}${etiquetaEstado(d.estatus_pago)}</div>
      <p class="mt-4 text-sm text-slate-700">Tasa BCV vigente: <strong class="text-slate-900">${formatoTasa(d.tasa_bcv)}</strong> Bs. por US$. Los montos en bolívares se calculan con esta tasa.</p>
      ${d.tasa_desactualizada ? html`<div class="mt-4">${aviso('warn', 'El BCV no respondió en este momento: se usa la última tasa disponible. El monto exacto se confirma al validar el pago.')}</div>` : null}
    </section>
    ${bannerEstado(d, abiertas)}
    ${porPagar.length > 0
      ? html`<section class="${CLS.tarjeta} flex flex-wrap items-center justify-between gap-4 p-6" aria-label="Total pendiente">
          <span class="text-sm font-medium text-slate-700">Total pendiente de pago</span>
          <span class="text-xl font-bold text-slate-900">${usd(sumarMonto(porPagar.map((c) => c.monto_usd)))} <span class="text-base font-semibold text-slate-700">≈ ${bs(sumarMonto(porPagar.map((c) => c.monto_bs)))}</span></span>
        </section>`
      : null}
    <section class="${CLS.tarjeta} p-6" aria-labelledby="t-cuentas">
      <h2 id="t-cuentas" class="text-base font-bold text-slate-900">Cuentas para pagar</h2>
      ${cuentasHtml(d.cuentas)}
    </section>
    <section aria-labelledby="t-cuotas">
      <h2 id="t-cuotas" class="mb-4 text-base font-bold text-slate-900">Cuotas pendientes</h2>
      ${abiertas.length === 0 ? html`<div class="${CLS.tarjeta} p-6 text-sm text-slate-700">No tienes cuotas pendientes.</div>` : html`<ul class="flex flex-col gap-4">${abiertas.map(cuotaHtml)}</ul>`}
    </section>`;
}

function esqueleto(): HtmlSeguro {
  return html`<div class="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-8">
    <header class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <span class="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">${icono('wallet', 'h-6 w-6')}</span>
        <div>
          <h1 class="${CLS.titulo}">Portal del representante</h1>
          <p class="${CLS.subtitulo}">Brilliant Minds Academy</p>
        </div>
      </div>
      <button type="button" id="actualizar" class="${boton(CLS.btnSecundario, CLS.btnPeq)}">${icono('refresh', 'h-4 w-4')}<span>Actualizar</span></button>
    </header>
    <div id="contenido" class="flex flex-col gap-6"></div>
  </div>`;
}

function pintar(): void {
  const zona = obtener('#contenido', HTMLElement);
  switch (estado.fase) {
    case 'cargando':
      montar(zona, html`<div class="h-32 animate-pulse rounded-xl bg-slate-200" role="status" aria-label="Cargando estado de cuenta"></div>`);
      return;
    case 'error':
      montar(zona, aviso('bad', html`${estado.mensaje} <span class="block pt-2">Si el problema continúa, solicita un nuevo enlace a la administración.</span>`, 'No pudimos abrir tu estado de cuenta'));
      return;
    case 'listo':
      montar(zona, vistaListo(estado.datos));
      for (const f of todos('form[data-cuota]', HTMLFormElement, zona)) {
        f.addEventListener('submit', (ev) => {
          ev.preventDefault();
          void alDeclarar(f);
        });
      }
  }
}

// ───────────────────────── Datos ─────────────────────────

async function cargar(silencioso = false): Promise<void> {
  if (token === null) {
    estado = { fase: 'error', mensaje: 'El enlace del portal no es válido o está incompleto.' };
    pintar();
    return;
  }
  if (!silencioso) {
    estado = { fase: 'cargando' };
    pintar();
  }
  try {
    const datos = await bma.get<EstadoCuentaPortal>(`/portal/${encodeURIComponent(token)}`, undefined, { sinAuth: true });
    estado = { fase: 'listo', datos };
  } catch (e: unknown) {
    estado = { fase: 'error', mensaje: mensajeDeError(e) };
  }
  pintar();
}

function errorDeFormulario(f: HTMLFormElement, mensaje: string | null): void {
  const idCuota = f.dataset['cuota'] ?? '';
  const p = buscar(`#ref-${CSS.escape(idCuota)}-error`, HTMLElement, f);
  const input = buscar('input[name="referencia"]', HTMLInputElement, f);
  if (!p || !input) return;
  p.textContent = mensaje ?? '';
  p.hidden = mensaje === null;
  if (mensaje === null) input.removeAttribute('aria-invalid');
  else input.setAttribute('aria-invalid', 'true');
}

async function alDeclarar(f: HTMLFormElement): Promise<void> {
  const idCuota = Number(f.dataset['cuota']);
  if (token === null || !Number.isInteger(idCuota) || enviando.has(idCuota)) return;
  errorDeFormulario(f, null);

  const referencia = obtener('input[name="referencia"]', HTMLInputElement, f).value.trim();
  const metodo = obtener('select[name="metodo_pago"]', HTMLSelectElement, f).value;
  if (!RE_REFERENCIA.test(referencia)) {
    errorDeFormulario(f, 'La referencia debe tener de 4 a 40 caracteres (letras, números o guiones, sin espacios).');
    obtener('input[name="referencia"]', HTMLInputElement, f).focus();
    return;
  }
  if (!esMetodoPago(metodo)) {
    errorDeFormulario(f, 'Selecciona un método de pago válido.');
    return;
  }

  const cuerpo: DeclararReferenciaPeticion = { cuota_id: idCuota, referencia, metodo_pago: metodo };
  enviando.add(idCuota);
  try {
    const r = await conBotonOcupado(obtener('button[type="submit"]', HTMLButtonElement, f), () =>
      bma.post<DeclararReferenciaRespuesta>(`/portal/${encodeURIComponent(token ?? '')}/referencias`, cuerpo, { sinAuth: true }),
    );
    notificar('ok', `Referencia registrada por ${usd(r.monto_usd)} (${bs(r.monto_bs)} a tasa ${formatoTasa(r.tasa_bcv)}). La administración la validará.`);
    await cargar(true);
  } catch (e: unknown) {
    const detalle = e instanceof BmaApiError ? e.camposInvalidos()[0]?.mensaje : undefined;
    errorDeFormulario(f, detalle ?? mensajeDeError(e));
  } finally {
    enviando.delete(idCuota);
  }
}

// ───────────────────────── Arranque ─────────────────────────

function iniciar(): void {
  document.body.className = 'text-slate-900';
  montar(obtener('#app', HTMLElement), esqueleto());
  token = capturarToken();
  obtener('#actualizar', HTMLButtonElement).addEventListener('click', () => void cargar());
  void cargar();
}

iniciar();
