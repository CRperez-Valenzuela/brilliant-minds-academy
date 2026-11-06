/**
 * Vista «Sedes» — gestión global de ubicaciones (acceso consolidado: rol `admin` sin sede).
 *  - Guarda de alcance (lib/alcance.ts → `alcanceDe`): cualquier usuario que NO sea consolidado (secretaria o admin atado a una sede,
 *    o sin sede asignada) ve «Sección Restringida» y NO dispara ninguna petición. El servidor impone la misma regla (`requireConsolidado`).
 *  - GET  /api/sedes → cuadrícula responsiva de tarjetas con el estado operativo de cada sede.
 *  - POST /api/sedes { nombre } → alta. 409 SEDE_DUPLICADA y 422 VALIDACION se pintan junto al campo.
 *  - Core Base: hasta 2 sedes (Sede Este y Sede Norte). A partir de la 3ª el trigger trg_sedes_limite_base (SQLSTATE BM403) responde
 *    403 MODULO_PREMIUM_DESHABILITADO con { modulo, nombre, precio_usd }: la vista delega en `alBloquear`, que relee el catálogo y pinta
 *    la pantalla de cristal de lib/candado.ts con el precio vigente (US$ 50.00 por defecto) y, si aún aplica, la prueba gratuita.
 *
 * Todo texto dinámico pasa por la etiqueta `html` (escape XSS automático); los errores se escriben con `textContent`.
 */
import { bma, BmaApiError, BmaSesionExpiradaError, mensajeDeError } from './api/bmaClient';
import { html, montar, type HtmlSeguro } from './lib/html';
import { icono } from './lib/icons';
import { fechaHora, usd } from './lib/format';
import { alcanceDe, type AlcanceUsuario } from './lib/alcance';
import { CLS, aviso, boton, conBotonOcupado, etiqueta, notificar, obtener, todos } from './lib/ui';
import { cargarConCache, invalidarCache } from './lib/cache';
import { CLAVE_SEDES, esListaSedes } from './lib/sedes-cache';
import { encabezadoVista } from './lib/candado';
import { erroresDeCampos, mostrarMensaje, pintarErrores, valorDe } from './lib/formulario';
import type { CuerpoCrearSede, DetalleModuloPremium, RespuestaCrearSede, SedeResumen, Usuario } from './types/index';

/** Sedes incluidas en el Core Base (espejo de `LIMITE_SEDES_BASE` en modules/premium/catalogo.js). */
export const LIMITE_SEDES_BASE = 2;
const MAX_NOMBRE = 120;
const MODULO_MULTI_SEDE = 'MULTI_SEDE_PREMIUM';
const NOMBRE_MODULO_MULTI_SEDE = 'Expansión Multi-Sede Avanzada (3+ Sedes)';
/** Solo se usa si el servidor omite el precio en el detalle del error; el precio vigente siempre lo manda el servidor. */
const PRECIO_RESPALDO_USD = 50;

export interface ContextoSedes {
  readonly zona: HTMLElement;
  readonly vigente: () => boolean;
  readonly usuario: Usuario | null;
  /** El servidor respondió 403 MODULO_PREMIUM_DESHABILITADO: el panel relee el catálogo y pinta el candado de cristal. */
  readonly alBloquear: (detalle: DetalleModuloPremium) => void;
  /** Clic en la tarjeta de una sede: el panel guarda su `sede_id` en el estado y abre el CRM de Estudiantes filtrado por esa sucursal. */
  readonly alElegirSede: (sedeId: number) => void;
  readonly alSesionExpirada: () => void;
}

// ───────────────────────── Lógica pura (sin DOM) ─────────────────────────

export interface ResultadoNombreSede {
  readonly error: string | null;
  readonly nombre: string | null;
}

/** Misma regla que el servidor (nombre obligatorio, ≤ 120). Los espacios repetidos se colapsan para evitar duplicados «fantasma». */
export function validarNombreSede(texto: string): ResultadoNombreSede {
  const nombre = texto.trim().replace(/\s+/g, ' ');
  if (nombre === '') return { error: 'Escribe el nombre de la sede, por ejemplo «Sede Este».', nombre: null };
  if (nombre.length > MAX_NOMBRE) return { error: `El nombre admite hasta ${MAX_NOMBRE} caracteres.`, nombre: null };
  return { error: null, nombre };
}

/**
 * ¿El error es el candado premium? Acepta el código HTTP estable del servidor y, por defensa, el SQLSTATE crudo `BM403`.
 * Si el servidor no trajo `nombre`/`precio_usd` (detalle del trigger ilegible) se completan con los datos del módulo de sedes.
 */
export function detallePremiumDe(e: unknown): DetalleModuloPremium | null {
  if (!(e instanceof BmaApiError)) return null;
  const detalle = e.moduloPremium();
  if (detalle) return detalle;
  if (e.codigo === 'MODULO_PREMIUM_DESHABILITADO' || e.codigo === 'BM403') {
    return { modulo: MODULO_MULTI_SEDE, nombre: NOMBRE_MODULO_MULTI_SEDE, precio_usd: PRECIO_RESPALDO_USD };
  }
  return null;
}

// ───────────────────────── Interfaz ─────────────────────────

function restringidaHtml(alcance: AlcanceUsuario): HtmlSeguro {
  const motivo =
    alcance.tipo === 'sede'
      ? 'La gestión de sedes es una función del acceso consolidado (SuperAdmin). Tu usuario opera únicamente sobre su sede.'
      : 'Tu usuario no tiene una sede asignada, así que no puede abrir esta sección. Pide a un administrador que revise tu cuenta.';
  return html`${encabezadoVista('Sedes', 'Ubicaciones de la academia')}
    <div class="max-w-2xl">${aviso('warn', motivo, 'Sección Restringida')}</div>`;
}

function tarjetaSedeHtml(s: SedeResumen): HtmlSeguro {
  return html`<li class="${CLS.tarjeta} transition duration-200 hover:shadow-md motion-reduce:transition-none">
    <button type="button" data-sede-id="${s.id}" aria-label="Ver los estudiantes de ${s.nombre}" class="flex w-full flex-col gap-3 rounded-xl p-4 text-left">
      <span class="flex items-start gap-3">
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bma-azul text-white">${icono('building')}</span>
        <span class="min-w-0 flex-1">
          <span class="block break-words text-base font-bold text-slate-900">${s.nombre}</span>
          ${s.creado_en ? html`<span class="${CLS.ayuda} block">Creada el ${fechaHora(s.creado_en)}</span>` : null}
        </span>
        ${etiqueta(s.activa ? 'Operativa' : 'Inactiva', s.activa ? 'ok' : 'neutral')}
      </span>
      <span class="text-sm font-medium text-bma-azul-oscuro">Ver estudiantes de esta sede →</span>
    </button>
  </li>`;
}

function listaHtml(sedes: readonly SedeResumen[]): HtmlSeguro {
  if (sedes.length === 0) return aviso('info', 'Todavía no hay sedes registradas. Crea la primera con el formulario de abajo.', 'Sin sedes');
  return html`<ul class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Sedes registradas">${sedes.map(tarjetaSedeHtml)}</ul>`;
}

function formularioHtml(sedes: readonly SedeResumen[]): HtmlSeguro {
  return html`<section class="${CLS.tarjetaCristal} max-w-2xl p-6" aria-labelledby="t-nueva-sede">
    <h2 id="t-nueva-sede" class="mb-1 flex items-center gap-2 text-base font-bold text-slate-900">${icono('building', 'h-5 w-5')}Nueva sede</h2>
    <p class="${CLS.ayuda} mb-4">El Core Base incluye ${LIMITE_SEDES_BASE} sedes (hoy hay ${sedes.length}). Desde la tercera se requiere la Expansión Multi-Sede (${usd(PRECIO_RESPALDO_USD)} · pago único); si ya está habilitada, el alta funciona con normalidad.</p>
    <form id="form-sede" novalidate class="flex flex-col gap-4 sm:flex-row sm:items-start" aria-label="Crear sede">
      <div class="min-w-0 flex-1">
        <label for="f-sede-nombre" class="${CLS.etiqueta}">Nombre de la sede <span class="text-red-800" aria-hidden="true">*</span></label>
        <input id="f-sede-nombre" name="nombre" type="text" maxlength="${MAX_NOMBRE}" required autocomplete="off" placeholder="Sede Este" aria-describedby="e-sede-nombre" class="${CLS.input} min-h-10">
        <p id="e-sede-nombre" data-error="nombre" role="alert" hidden class="${CLS.errorCampo}"></p>
      </div>
      <button type="submit" class="${boton(CLS.btnPrimario, 'min-h-10 sm:mt-6')}">${icono('check', 'h-4 w-4')}<span>Crear sede</span></button>
    </form>
    <div id="sede-resultado" class="mt-4" aria-live="polite"></div>
  </section>`;
}

function vistaHtml(sedes: readonly SedeResumen[]): HtmlSeguro {
  return html`${encabezadoVista('Sedes', 'Ubicaciones de la academia y su estado operativo')}
    <div class="flex flex-col gap-8">${listaHtml(sedes)}${formularioHtml(sedes)}</div>`;
}

// ───────────────────────── Comportamiento ─────────────────────────

function enlazarFormulario(ctx: ContextoSedes, recargar: () => Promise<void>): void {
  const form = obtener('#form-sede', HTMLFormElement, ctx.zona);
  const salida = obtener('#sede-resultado', HTMLElement, ctx.zona);

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const r = validarNombreSede(valorDe(form, 'nombre'));
    pintarErrores(form, r.error === null ? {} : { nombre: r.error });
    montar(salida, html``);
    if (r.nombre === null) return;
    const cuerpo: CuerpoCrearSede = { nombre: r.nombre };
    const enviar = obtener('button[type="submit"]', HTMLButtonElement, form);

    void conBotonOcupado(enviar, () => bma.post<RespuestaCrearSede>('/sedes', cuerpo))
      .then(async (creada) => {
        notificar('ok', `Sede «${creada.nombre}» creada.`);
        if (ctx.vigente()) await recargar();
      })
      .catch((e: unknown) => {
        if (e instanceof BmaSesionExpiradaError) {
          ctx.alSesionExpirada();
          return;
        }
        const premium = detallePremiumDe(e);
        if (premium) {
          ctx.alBloquear(premium);
          return;
        }
        if (!ctx.vigente()) return;
        if (e instanceof BmaApiError && e.codigo === 'SEDE_DUPLICADA') {
          pintarErrores(form, { nombre: e.message });
          return;
        }
        const campos = erroresDeCampos(e);
        if (campos) pintarErrores(form, campos);
        mostrarMensaje(salida, 'err', mensajeDeError(e));
      });
  });
}

/** Punto de entrada. Los errores de carga (red, 401, 403 premium) se propagan al panel, que ya sabe pintarlos. */
export async function vistaSedesGestion(ctx: ContextoSedes): Promise<void> {
  const alcance = alcanceDe(ctx.usuario);
  if (alcance.tipo !== 'consolidado') {
    montar(ctx.zona, restringidaHtml(alcance)); // sin peticiones: el servidor las rechazaría con 403
    return;
  }
  // Caché instantáneo + refresco en segundo plano: las tarjetas aparecen al momento y se actualizan en silencio si algo cambió.
  const pintar = async (): Promise<void> => {
    await cargarConCache<readonly SedeResumen[]>({
      clave: CLAVE_SEDES,
      esValido: esListaSedes,
      cargar: () => bma.get<readonly SedeResumen[]>('/sedes'),
      vigente: ctx.vigente,
      pintar: (sedes) => {
        montar(ctx.zona, vistaHtml(sedes));
        enlazarFormulario(ctx, recargar);
        for (const tarjeta of todos('[data-sede-id]', HTMLButtonElement, ctx.zona)) {
          tarjeta.addEventListener('click', () => {
            const id = Number(tarjeta.dataset['sedeId']);
            if (Number.isInteger(id) && id > 0) ctx.alElegirSede(id);
          });
        }
      },
    });
  };
  const recargar = async (): Promise<void> => {
    invalidarCache(CLAVE_SEDES); // tras crear una sede el caché quedó viejo
    await pintar();
  };
  await pintar();
}
