/**
 * Vista administrativa «Configuración de cobro» (acceso consolidado: rol admin sin sede).
 *  - Costo de la matrícula en USD            → GET /api/configuracion · PUT  /api/configuracion/matricula
 *  - Cuentas de cobro (Zelle, Binance Pay, PayPal y Pago Móvil)
 *                                            → GET /api/configuracion · POST /api/configuracion/cuentas
 *                                              (editar / activar / desactivar: PUT /api/configuracion/cuentas/:id)
 *  - Ámbito de cada cuenta: «Común» (sede_id NULL) o una sede concreta. El portal público muestra a cada familia las cuentas
 *    activas comunes + las de SU sede (services/parametros.service.js → cuentasActivas), por eso el ámbito es obligatorio.
 *
 * El backend guarda cada cuenta como { metodo, titular, detalle (texto ≤ 500) }. Para que el dato sea TIPADO, cada método define sus
 * campos (correo, banco, teléfono…), se validan en el cliente y se COMPONEN en un `detalle` con formato fijo; al editar se
 * INTERPRETAN de vuelta. Un `detalle` antiguo que no siga el formato se muestra tal cual y se pide re-ingresarlo con campos.
 * El servidor repite todas las validaciones: aquí solo se evita el viaje de ida y vuelta.
 *
 * Todo texto dinámico pasa por la etiqueta `html` (escape XSS automático); los errores se escriben con `textContent`.
 */
import { bma, BmaApiError, BmaSesionExpiradaError, mensajeDeError } from './api/bmaClient';
import { html, montar, type HtmlSeguro } from './lib/html';
import { icono } from './lib/icons';
import { nombreMetodo, usd } from './lib/format';
import { CLS, abrirModal, aviso, boton, buscar, conBotonOcupado, etiqueta, notificar, obtener, todos, type Modal } from './lib/ui';
import type { ConfiguracionAcademia, CuentaCobro, CuerpoCuenta, MetodoPago, SedeResumen, Usuario } from './types/index';

// ───────────────────────── Definición tipada de cada método ─────────────────────────

type Valores = Readonly<Record<string, string>>;
const v = (valores: Valores, clave: string): string => valores[clave] ?? '';

interface DefCampo {
  readonly id: string;
  readonly etiqueta: string;
  readonly tipo: 'text' | 'email';
  readonly inputmode: 'text' | 'email' | 'numeric' | 'tel';
  readonly placeholder: string;
  readonly ayuda: string;
  readonly error: string;
  readonly patron: RegExp;
  readonly normalizar: (texto: string) => string;
}

interface DefMetodo {
  readonly campos: readonly DefCampo[];
  readonly componer: (valores: Valores) => string;
  /** `null` si el detalle guardado no sigue el formato estructurado (cuenta cargada antes de esta vista). */
  readonly interpretar: (detalle: string) => Valores | null;
}

const RE_CORREO = /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/;
const RE_PAY_ID = /^(?:\d{6,20}|[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,})$/;
const RE_PAGO_MOVIL = /^Banco (\d{4}) · Tel (0\d{10}) · Cédula\/RIF ([VEJGP]\d{5,10})$/;

const campoCorreo = (id: string, etiquetaTexto: string, ayuda: string): DefCampo => ({
  id,
  etiqueta: etiquetaTexto,
  tipo: 'email',
  inputmode: 'email',
  placeholder: 'pagos@academia.com',
  ayuda,
  error: 'Escribe un correo válido, por ejemplo pagos@academia.com.',
  patron: RE_CORREO,
  normalizar: (t) => t.trim().toLowerCase(),
});

const DEFINICIONES: Readonly<Record<MetodoPago, DefMetodo>> = {
  ZELLE: {
    campos: [campoCorreo('correo', 'Correo de Zelle', 'Correo con el que la academia recibe pagos por Zelle.')],
    componer: (x) => v(x, 'correo'),
    interpretar: (d) => (RE_CORREO.test(d) ? { correo: d } : null),
  },
  PAYPAL: {
    campos: [campoCorreo('correo', 'Correo de PayPal', 'Cuenta de PayPal que recibe los pagos.')],
    componer: (x) => v(x, 'correo'),
    interpretar: (d) => (RE_CORREO.test(d) ? { correo: d } : null),
  },
  BINANCE: {
    campos: [
      {
        id: 'idBinance',
        etiqueta: 'Pay ID o correo de Binance',
        tipo: 'text',
        inputmode: 'text',
        placeholder: '123456789',
        ayuda: 'Pay ID numérico (6 a 20 dígitos) o el correo de la cuenta Binance.',
        error: 'Escribe un Pay ID numérico de 6 a 20 dígitos o un correo válido.',
        patron: RE_PAY_ID,
        normalizar: (t) => t.trim().toLowerCase(),
      },
    ],
    componer: (x) => v(x, 'idBinance'),
    interpretar: (d) => (RE_PAY_ID.test(d) ? { idBinance: d } : null),
  },
  PAGO_MOVIL: {
    campos: [
      {
        id: 'banco',
        etiqueta: 'Código del banco',
        tipo: 'text',
        inputmode: 'numeric',
        placeholder: '0102',
        ayuda: 'Cuatro dígitos (0102 = Banco de Venezuela, 0105 = Mercantil…).',
        error: 'El código del banco son exactamente 4 dígitos.',
        patron: /^\d{4}$/,
        normalizar: (t) => t.trim(),
      },
      {
        id: 'telefono',
        etiqueta: 'Teléfono afiliado',
        tipo: 'text',
        inputmode: 'tel',
        placeholder: '04141234567',
        ayuda: '11 dígitos, empezando por 0 (sin espacios ni guiones).',
        error: 'Escribe 11 dígitos empezando por 0, por ejemplo 04141234567.',
        patron: /^0\d{10}$/,
        normalizar: (t) => t.replace(/[\s.-]/g, ''),
      },
      {
        id: 'documento',
        etiqueta: 'Cédula o RIF del titular',
        tipo: 'text',
        inputmode: 'text',
        placeholder: 'V12345678',
        ayuda: 'Letra (V, E, J, G o P) seguida de 5 a 10 dígitos.',
        error: 'Escribe la letra (V, E, J, G o P) y de 5 a 10 dígitos, por ejemplo V12345678.',
        patron: /^[VEJGP]\d{5,10}$/,
        normalizar: (t) => t.replace(/[\s.-]/g, '').toUpperCase(),
      },
    ],
    componer: (x) => `Banco ${v(x, 'banco')} · Tel ${v(x, 'telefono')} · Cédula/RIF ${v(x, 'documento')}`,
    interpretar: (d) => {
      const m = RE_PAGO_MOVIL.exec(d);
      return m ? { banco: m[1] ?? '', telefono: m[2] ?? '', documento: m[3] ?? '' } : null;
    },
  },
};

const METODOS: readonly MetodoPago[] = ['ZELLE', 'BINANCE', 'PAYPAL', 'PAGO_MOVIL'];
const MAX_TITULAR = 150;
const MAX_MATRICULA = 99_999_999;

const esMetodo = (x: string): x is MetodoPago => METODOS.some((m) => m === x);

// ───────────────────────── Validación (pura, sin DOM) ─────────────────────────

export interface ResultadoCuenta {
  readonly errores: Readonly<Record<string, string>>;
  readonly cuerpo: CuerpoCuenta | null;
}

/** `ambito`: '' (sin elegir) · 'comun' (sede_id NULL) · id de sede en texto. */
export interface EntradaCuenta {
  readonly metodo: string;
  readonly titular: string;
  readonly ambito: string;
  readonly activa: boolean;
  readonly campos: Valores;
}

export function validarCuenta(entrada: EntradaCuenta, sedes: readonly SedeResumen[]): ResultadoCuenta {
  const errores: Record<string, string> = {};
  const titular = entrada.titular.trim();
  if (titular === '') errores['titular'] = 'El titular es obligatorio.';
  else if (titular.length > MAX_TITULAR) errores['titular'] = `Máximo ${MAX_TITULAR} caracteres.`;

  let sedeId: number | null = null;
  if (entrada.ambito === '') {
    errores['ambito'] = 'Elige a qué sede aplica la cuenta o márcala como común a todas.';
  } else if (entrada.ambito !== 'comun') {
    const id = Number(entrada.ambito);
    if (Number.isInteger(id) && sedes.some((s) => s.id === id)) sedeId = id;
    else errores['ambito'] = 'La sede elegida no existe. Recarga la página.';
  }

  const metodo = entrada.metodo;
  if (!esMetodo(metodo)) {
    errores['metodo'] = 'Elige un método de pago.';
    return { errores, cuerpo: null };
  }
  const def = DEFINICIONES[metodo];
  const limpios: Record<string, string> = {};
  for (const campo of def.campos) {
    const valor = campo.normalizar(v(entrada.campos, campo.id));
    limpios[campo.id] = valor;
    if (!campo.patron.test(valor)) errores[`campo_${campo.id}`] = campo.error;
  }
  if (Object.keys(errores).length > 0) return { errores, cuerpo: null };

  return {
    errores,
    cuerpo: { metodo, titular, detalle: def.componer(limpios), activa: entrada.activa, sede_id: sedeId },
  };
}

/** Texto → número con hasta 2 decimales (acepta coma). `null` si no es un monto válido (> 0 y ≤ máximo). */
export function parsearMonto(texto: string): number | null {
  const limpio = texto.trim().replace(',', '.');
  if (!/^\d+(?:\.\d{1,2})?$/.test(limpio)) return null;
  const n = Number(limpio);
  return Number.isFinite(n) && n > 0 && n <= MAX_MATRICULA ? n : null;
}

// ───────────────────────── Acceso y datos ─────────────────────────

/** Las rutas /api/configuracion exigen acceso consolidado: admin sin sede (misma regla que utils/alcance.js). */
export const esAccesoConsolidado = (u: Usuario | null): boolean => u?.rol === 'admin' && (u.sede_id ?? null) === null;

interface Datos {
  readonly matricula_usd: number;
  readonly cuentas: readonly CuentaCobro[];
  readonly sedes: readonly SedeResumen[];
}

async function cargarDatos(): Promise<Datos> {
  const [cfg, sedes] = await Promise.all([bma.get<ConfiguracionAcademia>('/configuracion'), bma.get<readonly SedeResumen[]>('/sedes')]);
  return { matricula_usd: cfg.matricula_usd, cuentas: cfg.cuentas, sedes };
}

export interface ContextoConfiguracion {
  readonly zona: HTMLElement;
  readonly vigente: () => boolean;
  readonly usuario: Usuario | null;
}

const nombreAmbito = (sedeId: number | null, sedes: readonly SedeResumen[]): string => {
  if (sedeId === null) return 'Común (todas las sedes)';
  const s = sedes.find((x) => x.id === sedeId);
  return s ? s.nombre : `Sede #${sedeId}`;
};

function ordenarCuentas(cuentas: readonly CuentaCobro[], sedes: readonly SedeResumen[]): readonly CuentaCobro[] {
  const clave = (c: CuentaCobro): string => `${c.sede_id === null ? '0' : '1'}|${nombreAmbito(c.sede_id, sedes)}|${METODOS.indexOf(c.metodo)}|${String(c.id).padStart(10, '0')}`;
  return [...cuentas].sort((a, b) => clave(a).localeCompare(clave(b), 'es'));
}

// ───────────────────────── Helpers de formulario ─────────────────────────

const texto = (fd: FormData, nombre: string): string => {
  const x = fd.get(nombre);
  return typeof x === 'string' ? x : '';
};

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

/** Errores por campo del servidor (códigos VALIDACION) → nombres de control de este formulario. */
function erroresDelServidor(e: BmaApiError): Readonly<Record<string, string>> {
  const mapa: Readonly<Record<string, string>> = { titular: 'titular', sede_id: 'ambito', metodo: 'metodo', detalle: 'general', matricula_usd: 'matricula_usd' };
  const salida: Record<string, string> = {};
  for (const d of e.camposInvalidos()) salida[mapa[d.campo] ?? 'general'] = d.mensaje;
  if (Object.keys(salida).length === 0) salida['general'] = e.message;
  return salida;
}

// ───────────────────────── Vista principal ─────────────────────────

function cuentasTablaHtml(cuentas: readonly CuentaCobro[], sedes: readonly SedeResumen[]): HtmlSeguro {
  if (cuentas.length === 0) {
    return aviso('warn', 'Todavía no hay cuentas de cobro. Mientras no exista ninguna activa, las familias verán «Consulta los datos de pago con la administración».');
  }
  const filas = ordenarCuentas(cuentas, sedes).map(
    (c) => html`<tr>
      <td class="${CLS.td}">${nombreAmbito(c.sede_id, sedes)}</td>
      <td class="${CLS.td} font-semibold">${nombreMetodo(c.metodo)}</td>
      <td class="${CLS.td}">${c.titular}</td>
      <td class="${CLS.td} break-words">${c.detalle}</td>
      <td class="${CLS.td}">${c.activa ? etiqueta('Activa', 'ok') : etiqueta('Inactiva', 'neutral')}</td>
      <td class="${CLS.td}">
        <div class="flex flex-wrap gap-2">
          <button type="button" data-accion="editar" data-id="${c.id}" class="${boton(CLS.btnSecundario, CLS.btnPeq)}" aria-label="Editar la cuenta de ${nombreMetodo(c.metodo)} de ${c.titular}">Editar</button>
          <button type="button" data-accion="alternar" data-id="${c.id}" class="${boton(CLS.btnSecundario, CLS.btnPeq)}" aria-label="${c.activa ? 'Desactivar' : 'Activar'} la cuenta de ${nombreMetodo(c.metodo)} de ${c.titular}">${c.activa ? 'Desactivar' : 'Activar'}</button>
        </div>
      </td>
    </tr>`,
  );
  return html`<div class="overflow-x-auto rounded-xl border border-slate-200 bg-white/95">
    <table class="${CLS.tabla}">
      <caption class="sr-only">Cuentas de cobro de la academia</caption>
      <thead><tr>
        <th scope="col" class="${CLS.th}">Ámbito</th><th scope="col" class="${CLS.th}">Método</th><th scope="col" class="${CLS.th}">Titular</th>
        <th scope="col" class="${CLS.th}">Datos públicos</th><th scope="col" class="${CLS.th}">Estado</th><th scope="col" class="${CLS.th}">Acciones</th>
      </tr></thead>
      <tbody>${filas}</tbody>
    </table>
  </div>`;
}

function vistaHtml(d: Datos): HtmlSeguro {
  const sinMatricula = d.matricula_usd <= 0;
  return html`<div id="config-raiz">
    <header class="mb-6">
      <h1 class="${CLS.titulo}">Configuración de cobro</h1>
      <p class="${CLS.subtitulo}">Costo de la matrícula y cuentas donde las familias depositan.</p>
    </header>

    <section class="${CLS.tarjeta} mb-6 p-6" aria-labelledby="t-matricula">
      <h2 id="t-matricula" class="text-base font-bold text-slate-900">Costo de la matrícula</h2>
      <p class="${CLS.ayuda}">Monto único en dólares para todas las sedes. Se muestra en el formulario público de admisiones junto a su equivalente en bolívares a la tasa BCV.</p>
      <div class="mt-4">${sinMatricula
        ? aviso('warn', 'La matrícula aún no está configurada: las inscripciones públicas permanecen bloqueadas hasta que fijes un monto.')
        : aviso('info', html`Matrícula vigente: <strong>${usd(d.matricula_usd)}</strong>.`)}</div>
      <form id="form-matricula" novalidate class="mt-4 grid gap-4 sm:grid-cols-3 sm:items-start">
        <div class="sm:col-span-1">
          <label for="f-matricula" class="${CLS.etiqueta}">Monto en USD</label>
          <input id="f-matricula" name="matricula_usd" type="text" inputmode="decimal" autocomplete="off" required placeholder="120.00"
            value="${sinMatricula ? '' : d.matricula_usd.toFixed(2)}" class="${CLS.input}" aria-describedby="ay-matricula er-matricula">
          <p id="ay-matricula" class="${CLS.ayuda}">Hasta dos decimales. Ejemplo: 120.00</p>
          <p id="er-matricula" data-error="matricula_usd" class="${CLS.errorCampo}" hidden></p>
        </div>
        <div class="flex items-end sm:col-span-2 sm:pt-6">
          <button type="submit" class="${boton(CLS.btnPrimario)}">${icono('check', 'h-4 w-4')}<span>Guardar matrícula</span></button>
        </div>
      </form>
    </section>

    <section class="${CLS.tarjeta} p-6" aria-labelledby="t-cuentas">
      <div class="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div class="min-w-0">
          <h2 id="t-cuentas" class="text-base font-bold text-slate-900">Cuentas de cobro</h2>
          <p class="${CLS.ayuda}">Datos públicos de Zelle, Binance Pay, PayPal y Pago Móvil. Nunca registres contraseñas ni claves aquí: esta información se muestra a las familias.</p>
        </div>
        <button type="button" data-accion="nueva" class="${boton(CLS.btnPrimario)}">${icono('wallet', 'h-4 w-4')}<span>Agregar cuenta</span></button>
      </div>
      ${cuentasTablaHtml(d.cuentas, d.sedes)}
      <div class="mt-4">${aviso('info', 'Una familia ve las cuentas activas comunes más las de su sede. Si entra sin enlace de invitación, solo ve las comunes.')}</div>
    </section>
  </div>`;
}

export async function vistaConfiguracion(ctx: ContextoConfiguracion): Promise<void> {
  if (!esAccesoConsolidado(ctx.usuario)) {
    montar(
      ctx.zona,
      html`<div class="mx-auto max-w-2xl pt-8">${aviso('info', 'La configuración de cobro es del acceso consolidado (administrador sin sede asignada). Pídele a esa persona que actualice la matrícula o las cuentas.', 'Sección restringida')}</div>`,
    );
    return;
  }
  const inicial = await cargarDatos(); // un fallo aquí lo muestra el manejador de errores del panel (con «Reintentar»)
  if (!ctx.vigente()) return;

  let datos = inicial;
  const pintar = (): void => {
    montar(ctx.zona, vistaHtml(datos));
    enlazar();
  };
  const recargar = async (): Promise<void> => {
    datos = await cargarDatos();
    if (ctx.vigente()) pintar();
  };

  const enlazar = (): void => {
    const raiz = obtener('#config-raiz', HTMLElement, ctx.zona);
    obtener('#form-matricula', HTMLFormElement, raiz).addEventListener('submit', (ev) => {
      ev.preventDefault();
      void guardarMatricula(obtener('#form-matricula', HTMLFormElement, raiz), (valor) => {
        datos = { ...datos, matricula_usd: valor };
        pintar();
      });
    });
    raiz.addEventListener('click', (ev) => {
      const origen = ev.target instanceof Element ? ev.target.closest('[data-accion]') : null;
      if (!(origen instanceof HTMLButtonElement)) return;
      const accion = origen.dataset['accion'];
      const cuenta = datos.cuentas.find((c) => c.id === Number(origen.dataset['id']));
      if (accion === 'nueva') abrirFormularioCuenta(null, datos.sedes, recargar);
      else if (accion === 'editar' && cuenta) abrirFormularioCuenta(cuenta, datos.sedes, recargar);
      else if (accion === 'alternar' && cuenta) void alternarActiva(origen, cuenta, recargar);
    });
  };

  pintar();
}

// ───────────────────────── Matrícula ─────────────────────────

async function guardarMatricula(form: HTMLFormElement, alGuardar: (valor: number) => void): Promise<void> {
  const monto = parsearMonto(texto(new FormData(form), 'matricula_usd'));
  if (monto === null) {
    pintarErrores(form, { matricula_usd: `Escribe un monto mayor que 0 y hasta ${MAX_MATRICULA.toLocaleString('en-US')}, con máximo 2 decimales.` });
    return;
  }
  pintarErrores(form, {});
  try {
    const r = await conBotonOcupado(obtener('button[type="submit"]', HTMLButtonElement, form), () => bma.put<{ readonly matricula_usd: number }>('/configuracion/matricula', { matricula_usd: monto }));
    notificar('ok', `Matrícula actualizada a ${usd(r.matricula_usd)}.`);
    alGuardar(r.matricula_usd);
  } catch (e: unknown) {
    if (e instanceof BmaSesionExpiradaError) {
      window.location.reload();
      return;
    }
    pintarErrores(form, e instanceof BmaApiError ? erroresDelServidor(e) : { matricula_usd: mensajeDeError(e) });
  }
}

// ───────────────────────── Cuentas: activar / desactivar ─────────────────────────

async function alternarActiva(boton_: HTMLButtonElement, c: CuentaCobro, recargar: () => Promise<void>): Promise<void> {
  // El PUT exige el cuerpo completo (la activación por defecto del servidor es TRUE): se reenvía todo con `activa` invertido.
  const cuerpo: CuerpoCuenta = { metodo: c.metodo, titular: c.titular, detalle: c.detalle, activa: !c.activa, sede_id: c.sede_id };
  try {
    await conBotonOcupado(boton_, () => bma.put<{ readonly id: number }>(`/configuracion/cuentas/${c.id}`, cuerpo));
    notificar('ok', cuerpo.activa ? 'Cuenta activada: ya la ven las familias.' : 'Cuenta desactivada: las familias ya no la ven.');
    await recargar();
  } catch (e: unknown) {
    if (e instanceof BmaSesionExpiradaError) {
      window.location.reload();
      return;
    }
    notificar('bad', mensajeDeError(e));
  }
}

// ───────────────────────── Cuentas: formulario (modal) ─────────────────────────

function camposMetodoHtml(metodo: string, valores: Valores): HtmlSeguro {
  if (!esMetodo(metodo)) return html`<p class="${CLS.ayuda}">Elige un método para ver los datos que se piden.</p>`;
  return html`${DEFINICIONES[metodo].campos.map(
    (c) => html`<div>
      <label for="f-campo_${c.id}" class="${CLS.etiqueta}">${c.etiqueta}</label>
      <input id="f-campo_${c.id}" name="campo_${c.id}" type="${c.tipo}" inputmode="${c.inputmode}" autocomplete="off" required
        placeholder="${c.placeholder}" value="${v(valores, c.id)}" class="${CLS.input}" aria-describedby="ay-${c.id} er-${c.id}">
      <p id="ay-${c.id}" class="${CLS.ayuda}">${c.ayuda}</p>
      <p id="er-${c.id}" data-error="campo_${c.id}" class="${CLS.errorCampo}" hidden></p>
    </div>`,
  )}`;
}

function formularioCuentaHtml(cuenta: CuentaCobro | null, sedes: readonly SedeResumen[], valoresIniciales: Valores, legado: string | null): HtmlSeguro {
  const metodo = cuenta?.metodo ?? '';
  const ambito = cuenta === null ? '' : cuenta.sede_id === null ? 'comun' : String(cuenta.sede_id);
  return html`<form id="form-cuenta" novalidate class="grid gap-4">
    <div data-error="general" hidden></div>
    ${legado === null ? null : aviso('warn', html`El dato guardado no sigue el formato estructurado: <span class="font-semibold">${legado}</span>. Complétalo con los campos de abajo para reemplazarlo.`, 'Datos anteriores')}
    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label for="f-metodo" class="${CLS.etiqueta}">Método de pago</label>
        <select id="f-metodo" name="metodo" required class="${CLS.input}" aria-describedby="er-metodo">
          <option value="" ${metodo === '' ? 'selected' : ''} disabled>Selecciona un método…</option>
          ${METODOS.map((m) => html`<option value="${m}" ${m === metodo ? 'selected' : ''}>${nombreMetodo(m)}</option>`)}
        </select>
        <p id="er-metodo" data-error="metodo" class="${CLS.errorCampo}" hidden></p>
      </div>
      <div>
        <label for="f-ambito" class="${CLS.etiqueta}">Sede a la que aplica</label>
        <select id="f-ambito" name="ambito" required class="${CLS.input}" aria-describedby="ay-ambito er-ambito">
          <option value="" ${ambito === '' ? 'selected' : ''} disabled>Selecciona el ámbito…</option>
          <option value="comun" ${ambito === 'comun' ? 'selected' : ''}>Común (todas las sedes)</option>
          ${sedes.map((s) => html`<option value="${s.id}" ${String(s.id) === ambito ? 'selected' : ''}>${s.nombre}${s.activa ? '' : ' (inactiva)'}</option>`)}
        </select>
        <p id="ay-ambito" class="${CLS.ayuda}">Las cuentas de una sede solo las ven las familias de esa sede.</p>
        <p id="er-ambito" data-error="ambito" class="${CLS.errorCampo}" hidden></p>
      </div>
    </div>
    <div>
      <label for="f-titular" class="${CLS.etiqueta}">Titular de la cuenta</label>
      <input id="f-titular" name="titular" type="text" maxlength="${MAX_TITULAR}" autocomplete="off" required value="${cuenta?.titular ?? ''}"
        class="${CLS.input}" aria-describedby="er-titular">
      <p id="er-titular" data-error="titular" class="${CLS.errorCampo}" hidden></p>
    </div>
    <div id="campos-metodo" class="grid gap-4" aria-live="polite">${camposMetodoHtml(metodo, valoresIniciales)}</div>
    <label class="flex items-center gap-3 text-sm font-medium text-slate-800">
      <input type="checkbox" name="activa" ${cuenta === null || cuenta.activa ? 'checked' : ''} class="h-4 w-4 rounded border-slate-300">
      <span>Cuenta activa (visible para las familias)</span>
    </label>
    <div class="flex flex-wrap justify-end gap-3">
      <button type="button" data-cancelar class="${boton(CLS.btnSecundario)}">Cancelar</button>
      <button type="submit" class="${boton(CLS.btnPrimario)}">${icono('check', 'h-4 w-4')}<span>${cuenta === null ? 'Agregar cuenta' : 'Guardar cambios'}</span></button>
    </div>
  </form>`;
}

function leerEntrada(form: HTMLFormElement): EntradaCuenta {
  const fd = new FormData(form);
  const campos: Record<string, string> = {};
  for (const [nombre, valor] of fd.entries()) {
    if (nombre.startsWith('campo_') && typeof valor === 'string') campos[nombre.slice('campo_'.length)] = valor;
  }
  return { metodo: texto(fd, 'metodo'), titular: texto(fd, 'titular'), ambito: texto(fd, 'ambito'), activa: fd.get('activa') !== null, campos };
}

function abrirFormularioCuenta(cuenta: CuentaCobro | null, sedes: readonly SedeResumen[], recargar: () => Promise<void>): void {
  const interpretado = cuenta ? DEFINICIONES[cuenta.metodo].interpretar(cuenta.detalle) : null;
  const legado = cuenta !== null && interpretado === null ? cuenta.detalle : null;
  const modal: Modal = abrirModal({
    titulo: cuenta === null ? 'Agregar cuenta de cobro' : 'Editar cuenta de cobro',
    ancho: 'lg',
    cuerpo: formularioCuentaHtml(cuenta, sedes, interpretado ?? {}, legado),
  });
  const form = obtener('#form-cuenta', HTMLFormElement, modal.dialogo);

  // Al cambiar de método se redibujan solo los campos propios del método (se conserva titular y ámbito).
  obtener('#f-metodo', HTMLSelectElement, form).addEventListener('change', (ev) => {
    const nuevo = ev.target instanceof HTMLSelectElement ? ev.target.value : '';
    montar(obtener('#campos-metodo', HTMLElement, form), camposMetodoHtml(nuevo, cuenta !== null && cuenta.metodo === nuevo && interpretado ? interpretado : {}));
  });
  obtener('[data-cancelar]', HTMLButtonElement, form).addEventListener('click', () => modal.cerrar());

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    void enviarCuenta(form, cuenta, sedes, modal, recargar);
  });
  obtener('#f-metodo', HTMLSelectElement, form).focus();
}

async function enviarCuenta(form: HTMLFormElement, cuenta: CuentaCobro | null, sedes: readonly SedeResumen[], modal: Modal, recargar: () => Promise<void>): Promise<void> {
  const r = validarCuenta(leerEntrada(form), sedes);
  pintarErrores(form, r.errores);
  const zonaGeneral = obtener('[data-error="general"]', HTMLElement, form);
  zonaGeneral.hidden = true;
  if (r.cuerpo === null) return;
  const cuerpo = r.cuerpo;
  try {
    await conBotonOcupado(obtener('button[type="submit"]', HTMLButtonElement, form), () =>
      cuenta === null ? bma.post<{ readonly id: number }>('/configuracion/cuentas', cuerpo) : bma.put<{ readonly id: number }>(`/configuracion/cuentas/${cuenta.id}`, cuerpo),
    );
    modal.cerrar();
    notificar('ok', cuenta === null ? 'Cuenta agregada.' : 'Cuenta actualizada.');
    await recargar();
  } catch (e: unknown) {
    if (e instanceof BmaSesionExpiradaError) {
      window.location.reload();
      return;
    }
    const errores = e instanceof BmaApiError ? erroresDelServidor(e) : { general: mensajeDeError(e) };
    const general = errores['general'];
    pintarErrores(form, { ...errores, general: '' });
    if (general) {
      zonaGeneral.hidden = false;
      montar(zonaGeneral, aviso('bad', general));
    }
  }
}
