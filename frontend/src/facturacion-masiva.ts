/**
 * Vista «Facturación masiva» — MÓDULO PREMIUM `FACTURACION_MASIVA` (US$ 20 · pago único).
 *  - Candado: si el módulo está bloqueado se muestra la pantalla de cristal (lib/candado.ts) con el precio y, para el acceso consolidado,
 *    el botón «Activar prueba gratuita de 15 días». El servidor impone el mismo candado en la ruta (guard.requireModulo('FACTURACION_MASIVA')):
 *    un 403 MODULO_PREMIUM_DESHABILITADO durante el envío (p. ej. venció la prueba) devuelve al usuario a esa pantalla.
 *  - Formulario del administrador → POST /api/facturacion/cuotas/generar-mensualidades { concepto, monto_usd, fecha_vencimiento }.
 *    El servidor crea una mensualidad por cada estudiante «Activo» de su alcance (consolidado = todas las sedes; admin de sede = la suya)
 *    y es IDEMPOTENTE por (estudiante, concepto): repetir el mismo concepto no duplica nada. Responde { creadas }.
 *  - Resultado: aviso `.msg.okk` con la cantidad EXACTA de cuotas creadas que devolvió el servidor.
 *
 * Todo texto dinámico pasa por la etiqueta `html` (escape XSS automático).
 */
import { bma, BmaApiError, BmaSesionExpiradaError, mensajeDeError } from './api/bmaClient';
import { html, montar, type HtmlSeguro } from './lib/html';
import { icono } from './lib/icons';
import { fechaCorta, fechaHora, hoyCaracas, usd } from './lib/format';
import { CLS, aviso, boton, buscar, conBotonOcupado, obtener, todos } from './lib/ui';
import { encabezadoVista, enlazarPrueba, pantallaBloqueada } from './lib/candado';
import { parsearMonto } from './configuracion';
import type {
  CuerpoGenerarMensualidades,
  DetalleModuloPremium,
  ModuloPremium,
  RespuestaGenerarMensualidades,
} from './types/index';

export interface ContextoFacturacionMasiva {
  readonly zona: HTMLElement;
  readonly vigente: () => boolean;
  readonly modulo: ModuloPremium;
  /** Solo el rol `admin` genera cuotas en bloque (la ruta del servidor es `soloAdmin`). */
  readonly puedeGenerar: boolean;
  /** Prueba gratuita disponible y usuario con acceso consolidado: muestra el botón de activación en la pantalla de cristal. */
  readonly puedeProbar: boolean;
  /** `null` = acceso consolidado (todas las sedes); un número = administrador de esa sede. */
  readonly alcance: number | null;
  readonly alActivarPrueba: () => Promise<void>;
  /** El servidor respondió 403 MODULO_PREMIUM_DESHABILITADO: el panel relee el catálogo y vuelve a pintar el candado. */
  readonly alBloquear: (detalle: DetalleModuloPremium) => void;
  readonly alSesionExpirada: () => void;
}

const MAX_CONCEPTO = 150;

// ───────────────────────── Validación (pura, sin DOM) ─────────────────────────

export interface EntradaMensualidades {
  readonly concepto: string;
  readonly monto: string;
  readonly vencimiento: string;
}

export interface ResultadoMensualidades {
  readonly errores: Readonly<Record<string, string>>;
  readonly cuerpo: CuerpoGenerarMensualidades | null;
}

/** Misma regla que el servidor: concepto 1–150, monto > 0 con ≤ 2 decimales, fecha 'AAAA-MM-DD' válida. Además, el vencimiento no puede ser pasado. */
export function validarMensualidades(e: EntradaMensualidades, hoy: string): ResultadoMensualidades {
  const errores: Record<string, string> = {};
  const concepto = e.concepto.trim();
  if (concepto === '') errores['concepto'] = 'Escribe el concepto, por ejemplo «Mensualidad Noviembre 2026».';
  else if (concepto.length > MAX_CONCEPTO) errores['concepto'] = `El concepto admite hasta ${MAX_CONCEPTO} caracteres.`;

  const monto = parsearMonto(e.monto);
  if (monto === null) errores['monto_usd'] = 'Escribe un monto en USD mayor que 0, con máximo 2 decimales (por ejemplo 85.00).';

  if (!esFechaReal(e.vencimiento)) errores['fecha_vencimiento'] = 'Elige la fecha de vencimiento.';
  else if (e.vencimiento < hoy) errores['fecha_vencimiento'] = 'El vencimiento no puede ser anterior a hoy: todos los alumnos quedarían morosos de inmediato.';

  if (Object.keys(errores).length > 0 || monto === null) return { errores, cuerpo: null };
  return { errores, cuerpo: { concepto, monto_usd: monto, fecha_vencimiento: e.vencimiento } };
}

/** 'AAAA-MM-DD' que existe en el calendario (rechaza 2026-02-31). */
export function esFechaReal(texto: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (!m) return false;
  const [anio, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(Date.UTC(anio, mes - 1, dia));
  return d.getUTCFullYear() === anio && d.getUTCMonth() === mes - 1 && d.getUTCDate() === dia;
}

/** Texto del aviso de éxito con la cantidad exacta que informó el servidor. */
export function resumenGeneracion(creadas: number, concepto: string): { readonly tono: 'okk' | 'inf'; readonly texto: string } {
  if (creadas <= 0) {
    return { tono: 'inf', texto: `No se creó ninguna cuota nueva: todos los estudiantes activos ya tenían «${concepto}».` };
  }
  return { tono: 'okk', texto: `Se crearon ${creadas} ${creadas === 1 ? 'cuota' : 'cuotas'} de «${concepto}».` };
}

// ───────────────────────── Interfaz ─────────────────────────

function alcanceTexto(alcance: number | null): string {
  return alcance === null ? 'todas las sedes' : 'tu sede';
}

function formularioHtml(ctx: ContextoFacturacionMasiva, hoy: string): HtmlSeguro {
  const hasta = ctx.modulo.en_prueba === true && ctx.modulo.expira_prueba_en ? ctx.modulo.expira_prueba_en : null;
  return html`${encabezadoVista(ctx.modulo.nombre, 'Genera la mensualidad de todos los estudiantes activos en un solo paso.')}
    ${hasta ? html`<div class="mb-6">${aviso('warn', `Prueba gratuita vigente hasta el ${fechaHora(hasta)}. Después de esa fecha el módulo se bloquea automáticamente.`, 'Estás en periodo de prueba')}</div>` : null}
    ${ctx.puedeGenerar
      ? html`<section class="${CLS.tarjetaCristal} max-w-2xl p-6" aria-labelledby="t-masiva">
          <h2 id="t-masiva" class="mb-1 flex items-center gap-2 text-base font-bold text-slate-900">${icono('receipt', 'h-5 w-5')}Nueva facturación mensual</h2>
          <p class="${CLS.ayuda} mb-4">Se aplica a los estudiantes «Activo» de ${alcanceTexto(ctx.alcance)}. Repetir el mismo concepto no duplica cuotas.</p>
          <form id="form-masiva" novalidate class="flex flex-col gap-4" aria-label="Generar mensualidades">
            <div>
              <label for="f-concepto" class="${CLS.etiqueta}">Concepto <span class="text-red-800" aria-hidden="true">*</span></label>
              <input id="f-concepto" name="concepto" type="text" maxlength="${MAX_CONCEPTO}" required autocomplete="off" placeholder="Mensualidad Noviembre 2026" aria-describedby="e-concepto" class="${CLS.input}">
              <p id="e-concepto" data-error="concepto" class="${CLS.errorCampo}" role="alert" hidden></p>
            </div>
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label for="f-monto" class="${CLS.etiqueta}">Monto por estudiante (USD) <span class="text-red-800" aria-hidden="true">*</span></label>
                <input id="f-monto" name="monto_usd" type="text" inputmode="decimal" required autocomplete="off" placeholder="85.00" aria-describedby="e-monto" class="${CLS.input}">
                <p id="e-monto" data-error="monto_usd" class="${CLS.errorCampo}" role="alert" hidden></p>
              </div>
              <div>
                <label for="f-vence" class="${CLS.etiqueta}">Fecha de vencimiento <span class="text-red-800" aria-hidden="true">*</span></label>
                <input id="f-vence" name="fecha_vencimiento" type="date" required min="${hoy}" aria-describedby="e-vence" class="${CLS.input}">
                <p id="e-vence" data-error="fecha_vencimiento" class="${CLS.errorCampo}" role="alert" hidden></p>
              </div>
            </div>
            <p id="masiva-vista-previa" class="${CLS.ayuda}" aria-live="polite"></p>
            <div id="masiva-resultado" aria-live="polite"></div>
            <div class="flex justify-end">
              <button type="submit" class="${boton(CLS.btnPrimario)}">${icono('receipt', 'h-4 w-4')}<span>Generar</span></button>
            </div>
          </form>
        </section>`
      : html`<div class="max-w-2xl">${aviso('info', 'La generación masiva de mensualidades es una función del administrador. Pídele a esa persona que la ejecute.', 'Sección restringida')}</div>`}`;
}

function pintarErrores(form: HTMLFormElement, errores: Readonly<Record<string, string>>): void {
  for (const el of todos('[data-error]', HTMLElement, form)) {
    const mensaje = errores[el.dataset['error'] ?? ''] ?? '';
    el.textContent = mensaje;
    el.hidden = mensaje === '';
  }
  for (const control of todos('[name]', HTMLElement, form)) {
    if ((errores[control.getAttribute('name') ?? ''] ?? '') !== '') control.setAttribute('aria-invalid', 'true');
    else control.removeAttribute('aria-invalid');
  }
  buscar('[aria-invalid="true"]', HTMLElement, form)?.focus();
}

/** Aviso `.msg` (estilos en styles/main.css). `okk` = éxito, `inf` = sin cambios, `err` = fallo. El texto se asigna con textContent. */
function mostrarMensaje(salida: HTMLElement, tono: 'okk' | 'inf' | 'err', texto: string): void {
  montar(salida, html`<p class="msg ${tono}" role="${tono === 'err' ? 'alert' : 'status'}" tabindex="-1"></p>`);
  const p = obtener('.msg', HTMLElement, salida);
  p.textContent = texto;
  p.focus();
}

function enlazarFormulario(ctx: ContextoFacturacionMasiva, hoy: string): void {
  const form = obtener('#form-masiva', HTMLFormElement, ctx.zona);
  const salida = obtener('#masiva-resultado', HTMLElement, form);
  const vistaPrevia = obtener('#masiva-vista-previa', HTMLElement, form);
  const campo = (nombre: string): string => {
    const control = form.elements.namedItem(nombre);
    return control instanceof HTMLInputElement ? control.value : '';
  };
  const leer = (): EntradaMensualidades => ({ concepto: campo('concepto'), monto: campo('monto_usd'), vencimiento: campo('fecha_vencimiento') });

  // Vista previa en vivo de lo que se enviará (solo informativa; nunca sustituye la validación del servidor).
  const actualizarVistaPrevia = (): void => {
    const r = validarMensualidades(leer(), hoy);
    vistaPrevia.textContent = r.cuerpo
      ? `Se creará «${r.cuerpo.concepto}» por ${usd(r.cuerpo.monto_usd)} con vencimiento el ${fechaCorta(r.cuerpo.fecha_vencimiento)} para cada estudiante activo de ${alcanceTexto(ctx.alcance)}.`
      : '';
  };
  form.addEventListener('input', actualizarVistaPrevia);

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const r = validarMensualidades(leer(), hoy);
    pintarErrores(form, r.errores);
    montar(salida, html``);
    if (r.cuerpo === null) return;
    const cuerpo = r.cuerpo;
    const enviar = obtener('button[type="submit"]', HTMLButtonElement, form);
    void conBotonOcupado(enviar, () => bma.post<RespuestaGenerarMensualidades>('/facturacion/cuotas/generar-mensualidades', cuerpo))
      .then((resp) => {
        if (!ctx.vigente()) return;
        const resumen = resumenGeneracion(resp.creadas, cuerpo.concepto);
        mostrarMensaje(salida, resumen.tono, resumen.texto);
      })
      .catch((e: unknown) => {
        if (e instanceof BmaSesionExpiradaError) {
          ctx.alSesionExpirada();
          return;
        }
        if (e instanceof BmaApiError) {
          const premium = e.moduloPremium();
          if (premium) {
            ctx.alBloquear(premium);
            return;
          }
          const campos = e.camposInvalidos();
          if (campos.length > 0) {
            pintarErrores(form, Object.fromEntries(campos.map((c) => [c.campo, c.mensaje])));
          }
        }
        if (ctx.vigente()) mostrarMensaje(salida, 'err', mensajeDeError(e));
      });
  });
}

/** Punto de entrada de la sección. No lanza por el candado: lo resuelve pintando la pantalla de cristal. */
export function vistaFacturacionMasiva(ctx: ContextoFacturacionMasiva): void {
  if (ctx.modulo.bloqueado) {
    montar(ctx.zona, pantallaBloqueada({ nombre: ctx.modulo.nombre, descripcion: ctx.modulo.descripcion, precio_usd: ctx.modulo.precio_usd }, ctx.puedeProbar));
    enlazarPrueba(ctx.zona, ctx.alActivarPrueba);
    return;
  }
  const hoy = hoyCaracas();
  montar(ctx.zona, formularioHtml(ctx, hoy));
  if (ctx.puedeGenerar) enlazarFormulario(ctx, hoy);
}
