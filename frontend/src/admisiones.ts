/**
 * Planilla pública de admisiones.
 *  - Costo de la matrícula en USD y su equivalente en Bs. a la tasa BCV vigente (se vuelve a consultar cada 30 s,
 *    al volver a la pestaña y justo antes de enviar; si la tasa cambió se avisa y se exige reenviar con el monto nuevo).
 *  - Validación en TypeScript: los 3 archivos obligatorios deben existir en el DOM, estar seleccionados y pesar ≤ 5 MB
 *    ANTES de construir el FormData transaccional.
 */
import './styles/main.css';
import { bma, BmaApiError, mensajeDeError } from './api/bmaClient';
import { html, montar, raw, type HtmlSeguro } from './lib/html';
import { icono } from './lib/icons';
import { bs, horaConSegundos, hoyCaracas, nombreMetodo, tasa as formatoTasa, usd } from './lib/format';
import { CLS, aviso, boton, buscar, conBotonOcupado, etiqueta, notificar, obtener, todos } from './lib/ui';
import { esConfigInvitacion } from './types/index';
import type {
  CampoArchivoAdmision,
  ConfigAdmisiones,
  ConfigInvitacion,
  CuentaPago,
  MetodoPago,
  RespuestaAdmision,
  SolicitudAdmisionTexto,
  TipoSangre,
} from './types/index';

// ───────────────────────── Constantes y definiciones ─────────────────────────

export const MAX_BYTES_ARCHIVO = 5 * 1024 * 1024;
const INTERVALO_TASA_MS = 30_000;
/** Orden de presentación: primero el método local (bolívares) y luego las divisas. */
const METODOS: readonly MetodoPago[] = ['PAGO_MOVIL', 'ZELLE', 'BINANCE', 'PAYPAL'];
const TIPOS_SANGRE: readonly TipoSangre[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const RE_CEDULA = /^[A-Za-z0-9.-]{4,20}$/;
const RE_REFERENCIA = /^[A-Za-z0-9-]{4,40}$/;
const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RE_INVITACION = /^[a-f0-9]{48}$/;

/**
 * Señal visual del nivel bloqueado (el bloqueo REAL lo impone el servidor: ignora el grado enviado y usa `nivel_asignado`).
 * `pointer-events-none` impide el clic, `select-none` la selección y `bg-slate-100` lo muestra como no editable.
 */
export const CLASES_NIVEL_BLOQUEADO = 'bg-slate-100 pointer-events-none select-none';

/** Invitación presente en la URL (`?invitacion=<48 hex>`). Un parámetro mal formado NO habilita el formulario libre. */
export type InvitacionDeUrl =
  | { readonly tipo: 'ninguna' }
  | { readonly tipo: 'invalida' }
  | { readonly tipo: 'token'; readonly token: string };

export function leerInvitacion(busqueda: string): InvitacionDeUrl {
  const v = new URLSearchParams(busqueda).get('invitacion');
  if (v === null) return { tipo: 'ninguna' };
  return RE_INVITACION.test(v) ? { tipo: 'token', token: v } : { tipo: 'invalida' };
}

const INVITACION: InvitacionDeUrl = leerInvitacion(window.location.search);
const MENSAJE_INVITACION_INVALIDA = 'El enlace de invitación no es válido, ya fue utilizado o venció. Solicita uno nuevo a la academia.';

/** Quita TODO espacio en blanco (pegar «0012 3456» o «ABC 123» deja una referencia válida). */
export function sanearReferencia(valor: string): string {
  return valor.replace(/\s+/g, '');
}

/**
 * Valida el número de referencia bancaria (mismo patrón que el backend: ^[A-Za-z0-9-]{4,40}$).
 * Devuelve el mensaje de error o null si es válido. Con `completo = false` (mientras se escribe) no se exige aún el mínimo.
 */
export function mensajeReferencia(valor: string, completo = true): string | null {
  if (valor === '') return completo ? 'Número de referencia: es obligatorio.' : null;
  if (/\s/.test(valor)) return 'Número de referencia: no puede contener espacios.';
  if (/[^A-Za-z0-9-]/.test(valor)) return 'Número de referencia: solo letras, números o guiones.';
  if (valor.length > 40) return 'Número de referencia: máximo 40 caracteres.';
  if (valor.length < 4) return completo ? 'Número de referencia: mínimo 4 caracteres.' : null;
  return RE_REFERENCIA.test(valor) ? null : 'Número de referencia: formato no válido.';
}

/** Moneda en la que se paga con cada método y pasos a seguir (las cuentas concretas llegan de /api/public/admisiones/config). */
interface InfoMetodo {
  readonly moneda: 'USD' | 'BS';
  readonly icono: 'phone' | 'wallet' | 'globe';
  readonly pasos: readonly string[];
}

const INFO_METODOS: Readonly<Record<MetodoPago, InfoMetodo>> = {
  PAGO_MOVIL: {
    moneda: 'BS',
    icono: 'phone',
    pasos: ['Abre la app de tu banco y elige Pago Móvil.', 'Transfiere el monto exacto en bolívares a los datos indicados.', 'Copia el número de referencia que te da el banco y pégalo abajo.'],
  },
  ZELLE: {
    moneda: 'USD',
    icono: 'wallet',
    pasos: ['Envía el monto exacto en dólares al contacto de Zelle indicado, a nombre del titular.', 'Guarda el número de confirmación que te entrega tu banco.', 'Pégalo en «Número de referencia».'],
  },
  BINANCE: {
    moneda: 'USD',
    icono: 'globe',
    pasos: ['En Binance entra a Pay y envía el monto exacto en dólares al ID o correo indicado.', 'Copia el ID de la orden de la transacción.', 'Pégalo en «Número de referencia».'],
  },
  PAYPAL: {
    moneda: 'USD',
    icono: 'globe',
    pasos: ['Envía el monto exacto en dólares al correo de PayPal indicado.', 'Copia el ID de la transacción que muestra PayPal.', 'Pégalo en «Número de referencia».'],
  },
};

type NombreTexto = keyof SolicitudAdmisionTexto;
type TipoControl = 'text' | 'date' | 'email' | 'tel' | 'select';

interface DefCampo {
  readonly nombre: NombreTexto;
  readonly etiqueta: string;
  readonly tipo: TipoControl;
  readonly requerido: boolean;
  readonly maximo?: number;
  readonly autocompletar?: string;
  readonly ayuda?: string;
  readonly opciones?: readonly { readonly valor: string; readonly texto: string }[];
  readonly porDefecto?: string;
  /** Atributos HTML constantes del propio código (nunca datos del usuario). */
  readonly atributos?: string;
}

interface DefSeccion {
  readonly id: string;
  readonly titulo: string;
  readonly campos: readonly DefCampo[];
}

const SECCIONES: readonly DefSeccion[] = [
  {
    id: 'estudiante',
    titulo: 'Datos del estudiante',
    campos: [
      { nombre: 'alumno_nombres', etiqueta: 'Nombres', tipo: 'text', requerido: true, maximo: 100 },
      { nombre: 'alumno_apellidos', etiqueta: 'Apellidos', tipo: 'text', requerido: true, maximo: 100 },
      { nombre: 'alumno_fecha_nacimiento', etiqueta: 'Fecha de nacimiento', tipo: 'date', requerido: true, autocompletar: 'bday' },
      { nombre: 'alumno_cedula', etiqueta: 'Cédula del estudiante', tipo: 'text', requerido: false, maximo: 20, ayuda: 'Solo si tiene.' },
      { nombre: 'grado_solicitado', etiqueta: 'Grado a cursar', tipo: 'text', requerido: true, maximo: 60 },
      { nombre: 'colegio_procedencia', etiqueta: 'Colegio de procedencia', tipo: 'text', requerido: false, maximo: 150 },
      { nombre: 'ultimo_grado_aprobado', etiqueta: 'Último grado aprobado', tipo: 'text', requerido: false, maximo: 60 },
    ],
  },
  {
    id: 'medicos',
    titulo: 'Datos médicos y contacto de emergencia',
    campos: [
      {
        nombre: 'tipo_sangre',
        etiqueta: 'Tipo de sangre',
        tipo: 'select',
        requerido: false,
        opciones: [{ valor: '', texto: 'No sé / prefiero no indicarlo' }, ...TIPOS_SANGRE.map((t) => ({ valor: t, texto: t }))],
      },
      { nombre: 'alergias', etiqueta: 'Alergias', tipo: 'text', requerido: false, maximo: 500 },
      { nombre: 'condiciones_medicas', etiqueta: 'Condiciones médicas', tipo: 'text', requerido: false, maximo: 500 },
      { nombre: 'medicamentos', etiqueta: 'Medicamentos', tipo: 'text', requerido: false, maximo: 500 },
      { nombre: 'emergencia_nombre', etiqueta: 'Contacto de emergencia', tipo: 'text', requerido: false, maximo: 150 },
      { nombre: 'emergencia_telefono', etiqueta: 'Teléfono de emergencia', tipo: 'tel', requerido: false, ayuda: 'Con código de país, p. ej. +58 414 1234567.' },
    ],
  },
  {
    id: 'representante',
    titulo: 'Datos del representante',
    campos: [
      { nombre: 'representante_nombres', etiqueta: 'Nombres', tipo: 'text', requerido: true, maximo: 100, autocompletar: 'given-name' },
      { nombre: 'representante_apellidos', etiqueta: 'Apellidos', tipo: 'text', requerido: true, maximo: 100, autocompletar: 'family-name' },
      { nombre: 'representante_cedula', etiqueta: 'Cédula', tipo: 'text', requerido: true, maximo: 20, ayuda: 'Letras, números, puntos o guiones (4 a 20).' },
      { nombre: 'representante_email', etiqueta: 'Correo electrónico', tipo: 'email', requerido: false, maximo: 160, autocompletar: 'email' },
      { nombre: 'telefono_codigo', etiqueta: 'Código de país', tipo: 'tel', requerido: true, maximo: 6, porDefecto: '+58' },
      { nombre: 'telefono_numero', etiqueta: 'Teléfono (WhatsApp)', tipo: 'tel', requerido: true, maximo: 20, autocompletar: 'tel-national', ayuda: 'Recibirás los avisos de cobro por este número.' },
    ],
  },
  {
    id: 'pago',
    titulo: 'Pago de la matrícula',
    campos: [
      {
        nombre: 'metodo_pago',
        etiqueta: 'Método de pago utilizado',
        tipo: 'select',
        requerido: true,
        opciones: METODOS.map((m) => ({ valor: m, texto: nombreMetodo(m) })),
      },
      { nombre: 'referencia_bancaria', etiqueta: 'Número de referencia bancaria', tipo: 'text', requerido: true, maximo: 40, ayuda: 'Cópiala tal como la muestra tu banco o billetera: de 4 a 40 letras, números o guiones, sin espacios.', atributos: 'spellcheck="false" autocapitalize="characters"' },
    ],
  },
];

const CAMPOS: readonly DefCampo[] = SECCIONES.flatMap((s) => s.campos);

interface DefArchivo {
  readonly campo: CampoArchivoAdmision;
  readonly etiqueta: string;
  readonly mimes: readonly string[];
  readonly extensiones: readonly string[];
  readonly accept: string;
  readonly formatos: string;
}

const ARCHIVOS: readonly DefArchivo[] = [
  { campo: 'foto_carnet', etiqueta: 'Foto carnet', mimes: ['image/jpeg', 'image/png'], extensiones: ['jpg', 'jpeg', 'png'], accept: 'image/jpeg,image/png', formatos: 'JPG o PNG' },
  { campo: 'cedula_identidad', etiqueta: 'Cédula de identidad', mimes: ['image/jpeg', 'image/png', 'application/pdf'], extensiones: ['jpg', 'jpeg', 'png', 'pdf'], accept: 'image/jpeg,image/png,application/pdf', formatos: 'JPG, PNG o PDF' },
  { campo: 'acta_nacimiento', etiqueta: 'Acta de nacimiento', mimes: ['image/jpeg', 'image/png', 'application/pdf'], extensiones: ['jpg', 'jpeg', 'png', 'pdf'], accept: 'image/jpeg,image/png,application/pdf', formatos: 'JPG, PNG o PDF' },
];

// ───────────────────────── Validación (pura, exportada para pruebas) ─────────────────────────

export interface ErrorValidacion {
  readonly campo: string;
  readonly mensaje: string;
}

export interface InspeccionArchivos {
  readonly errores: readonly ErrorValidacion[];
  readonly archivos: ReadonlyMap<CampoArchivoAdmision, File>;
}

export function formatoTamano(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(2)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function extensionDe(nombre: string): string {
  const i = nombre.lastIndexOf('.');
  return i < 0 ? '' : nombre.slice(i + 1).toLowerCase();
}

/** Valida UN archivo contra su definición: presencia, tamaño ≤ 5 MB, no vacío y formato permitido. */
export function validarArchivo(def: DefArchivo, archivo: File | undefined): ErrorValidacion | null {
  if (!archivo) return { campo: def.campo, mensaje: `Adjunta: ${def.etiqueta}.` };
  if (archivo.size === 0) return { campo: def.campo, mensaje: `${def.etiqueta}: el archivo está vacío.` };
  if (archivo.size > MAX_BYTES_ARCHIVO) {
    return { campo: def.campo, mensaje: `${def.etiqueta}: pesa ${formatoTamano(archivo.size)} y el máximo es 5 MB.` };
  }
  const formatoValido = archivo.type ? def.mimes.includes(archivo.type) : def.extensiones.includes(extensionDe(archivo.name));
  if (!formatoValido) return { campo: def.campo, mensaje: `${def.etiqueta}: formato no permitido (usa ${def.formatos}).` };
  return null;
}

/** Comprueba que los 3 `<input type="file">` EXISTEN en el DOM del formulario y valida cada archivo seleccionado. */
export function inspeccionarArchivos(formulario: HTMLFormElement): InspeccionArchivos {
  const errores: ErrorValidacion[] = [];
  const archivos = new Map<CampoArchivoAdmision, File>();
  for (const def of ARCHIVOS) {
    const control = formulario.elements.namedItem(def.campo);
    if (!(control instanceof HTMLInputElement) || control.type !== 'file') {
      errores.push({ campo: def.campo, mensaje: `Falta el campo «${def.etiqueta}» en la página. Recárgala e inténtalo de nuevo.` });
      continue;
    }
    const archivo = control.files?.[0];
    const problema = validarArchivo(def, archivo);
    if (problema) errores.push(problema);
    else if (archivo) archivos.set(def.campo, archivo);
  }
  return { errores, archivos };
}

/** Misma normalización que el backend (utils/telefono.js): devuelve solo dígitos E.164 o null si no es válido. */
export function normalizarTelefono(...partes: readonly string[]): string | null {
  let d = partes.join('').replace(/\D+/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.length === 11 && d.startsWith('0')) d = `58${d.slice(1)}`;
  if (/^580\d{10}$/.test(d)) d = `58${d.slice(3)}`;
  return d.length >= 10 && d.length <= 15 ? d : null;
}

function esFechaPasadaValida(valor: string, hoy: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const [a, m, d] = valor.split('-').map(Number);
  if (a === undefined || m === undefined || d === undefined) return false;
  const fecha = new Date(Date.UTC(a, m - 1, d));
  const coincide = fecha.getUTCFullYear() === a && fecha.getUTCMonth() === m - 1 && fecha.getUTCDate() === d;
  return coincide && valor >= '1990-01-01' && valor <= hoy;
}

export function validarTextos(v: SolicitudAdmisionTexto, hoy: string = hoyCaracas()): readonly ErrorValidacion[] {
  const errores: ErrorValidacion[] = [];
  const agregar = (campo: string, mensaje: string): void => {
    errores.push({ campo, mensaje });
  };
  for (const def of CAMPOS) {
    const valor = v[def.nombre];
    if (valor === '') {
      if (def.requerido) agregar(def.nombre, `${def.etiqueta}: es obligatorio.`);
      continue;
    }
    if (def.maximo !== undefined && valor.length > def.maximo) agregar(def.nombre, `${def.etiqueta}: máximo ${def.maximo} caracteres.`);
  }
  const ya = (campo: string): boolean => errores.some((e) => e.campo === campo);

  if (!ya('alumno_fecha_nacimiento') && !esFechaPasadaValida(v.alumno_fecha_nacimiento, hoy)) {
    agregar('alumno_fecha_nacimiento', 'Fecha de nacimiento: indica una fecha válida (entre 1990 y hoy).');
  }
  if (v.alumno_cedula && !ya('alumno_cedula') && !RE_CEDULA.test(v.alumno_cedula)) agregar('alumno_cedula', 'Cédula del estudiante: solo letras, números, puntos y guiones (4 a 20).');
  if (!ya('representante_cedula') && !RE_CEDULA.test(v.representante_cedula)) agregar('representante_cedula', 'Cédula del representante: solo letras, números, puntos y guiones (4 a 20).');
  if (v.representante_email && !ya('representante_email') && !RE_EMAIL.test(v.representante_email)) agregar('representante_email', 'Correo electrónico: formato no válido.');
  if (!ya('telefono_numero') && !ya('telefono_codigo') && normalizarTelefono(v.telefono_codigo, v.telefono_numero) === null) {
    agregar('telefono_numero', 'Teléfono: debe tener entre 10 y 15 dígitos incluyendo el código de país.');
  }
  if (v.emergencia_telefono && !ya('emergencia_telefono') && normalizarTelefono(v.emergencia_telefono) === null) {
    agregar('emergencia_telefono', 'Teléfono de emergencia: debe tener entre 10 y 15 dígitos incluyendo el código de país.');
  }
  if (!ya('referencia_bancaria')) {
    const problema = mensajeReferencia(v.referencia_bancaria);
    if (problema) agregar('referencia_bancaria', problema);
  }
  return errores;
}

// ───────────────────────── Lectura del formulario ─────────────────────────

function leerTexto(formulario: HTMLFormElement, nombre: NombreTexto): string {
  const control = formulario.elements.namedItem(nombre);
  if (control instanceof HTMLInputElement || control instanceof HTMLSelectElement || control instanceof HTMLTextAreaElement) return control.value.trim();
  return '';
}

const esTipoSangre = (v: string): v is TipoSangre => (TIPOS_SANGRE as readonly string[]).includes(v);
const esMetodoPago = (v: string): v is MetodoPago => (METODOS as readonly string[]).includes(v);

export function leerTextos(formulario: HTMLFormElement): SolicitudAdmisionTexto {
  const t = (n: NombreTexto): string => leerTexto(formulario, n);
  const sangre = t('tipo_sangre');
  const metodo = t('metodo_pago');
  return {
    alumno_nombres: t('alumno_nombres'),
    alumno_apellidos: t('alumno_apellidos'),
    alumno_cedula: t('alumno_cedula'),
    alumno_fecha_nacimiento: t('alumno_fecha_nacimiento'),
    grado_solicitado: t('grado_solicitado'),
    colegio_procedencia: t('colegio_procedencia'),
    ultimo_grado_aprobado: t('ultimo_grado_aprobado'),
    tipo_sangre: esTipoSangre(sangre) ? sangre : '',
    alergias: t('alergias'),
    condiciones_medicas: t('condiciones_medicas'),
    medicamentos: t('medicamentos'),
    emergencia_nombre: t('emergencia_nombre'),
    emergencia_telefono: t('emergencia_telefono'),
    representante_nombres: t('representante_nombres'),
    representante_apellidos: t('representante_apellidos'),
    representante_cedula: t('representante_cedula'),
    representante_email: t('representante_email'),
    telefono_codigo: t('telefono_codigo'),
    telefono_numero: t('telefono_numero'),
    metodo_pago: esMetodoPago(metodo) ? metodo : 'ZELLE',
    referencia_bancaria: sanearReferencia(t('referencia_bancaria')),
  };
}

/** FormData transaccional: solo los campos del contrato (omite los opcionales vacíos) + los 3 archivos ya validados. */
export function construirFormData(textos: SolicitudAdmisionTexto, archivos: ReadonlyMap<CampoArchivoAdmision, File>, invitacion: string | null = null): FormData {
  const datos = new FormData();
  if (invitacion !== null) datos.append('invitacion', invitacion); // el servidor resuelve sede y nivel a partir del enlace
  for (const def of CAMPOS) {
    const valor = textos[def.nombre];
    if (valor !== '' || def.requerido) datos.append(def.nombre, valor);
  }
  for (const def of ARCHIVOS) {
    const archivo = archivos.get(def.campo);
    if (!archivo) throw new Error(`Archivo obligatorio ausente: ${def.campo}`);
    datos.append(def.campo, archivo, archivo.name);
  }
  return datos;
}

// ───────────────────────── Estado de la interfaz ─────────────────────────

interface EstadoPantalla {
  readonly config: ConfigAdmisiones | null;
  readonly consultadoEn: Date | null;
  readonly errorConfig: string | null;
  readonly cargandoConfig: boolean;
  readonly enviando: boolean;
  /** Mensaje del servidor cuando rechazó el enlace de invitación (410): la planilla queda deshabilitada. */
  readonly invitacionRechazada: string | null;
}

let estado: EstadoPantalla = {
  config: null, consultadoEn: null, errorConfig: null, cargandoConfig: true, enviando: false,
  invitacionRechazada: INVITACION.tipo === 'invalida' ? MENSAJE_INVITACION_INVALIDA : null,
};

function actualizar(parcial: Partial<EstadoPantalla>): void {
  estado = { ...estado, ...parcial };
}

// ───────────────────────── Plantillas ─────────────────────────

function controlHtml(def: DefCampo): HtmlSeguro {
  const id = `f-${def.nombre}`;
  const descrito = `${def.ayuda ? `a-${def.nombre} ` : ''}e-${def.nombre}`;
  const estrella = def.requerido ? html`<span class="text-red-800" aria-hidden="true"> *</span>` : null;
  let control: HtmlSeguro;
  if (def.tipo === 'select') {
    control = html`<select id="${id}" name="${def.nombre}" class="${CLS.input}" aria-describedby="${descrito}" ${def.requerido ? raw('required') : null}>${(def.opciones ?? []).map((o) => html`<option value="${o.valor}">${o.texto}</option>`)}</select>`;
  } else {
    const extra = def.tipo === 'date' ? html` min="1990-01-01" max="${hoyCaracas()}"` : html`${def.maximo ? html` maxlength="${def.maximo}"` : null}`;
    control = html`<input id="${id}" name="${def.nombre}" type="${def.tipo}" class="${CLS.input}" value="${def.porDefecto ?? ''}" autocomplete="${def.autocompletar ?? 'off'}" aria-describedby="${descrito}"${extra} ${def.atributos ? raw(def.atributos) : null} ${def.requerido ? raw('required') : null}>`;
  }
  return html`<div>
    <label for="${id}" class="${CLS.etiqueta}">${def.etiqueta}${estrella}</label>
    ${control}
    ${def.ayuda ? html`<p id="a-${def.nombre}" class="${CLS.ayuda}">${def.ayuda}</p>` : null}
    <p id="e-${def.nombre}" class="${CLS.errorCampo}" hidden></p>
  </div>`;
}

function archivoHtml(def: DefArchivo): HtmlSeguro {
  const id = `f-${def.campo}`;
  return html`<div>
    <label for="${id}" class="${CLS.etiqueta}">${def.etiqueta}<span class="text-red-800" aria-hidden="true"> *</span></label>
    <input id="${id}" name="${def.campo}" type="file" accept="${def.accept}" required aria-describedby="a-${def.campo} e-${def.campo}"
      class="block w-full cursor-pointer rounded-lg border border-slate-300 bg-white text-sm text-slate-700 file:mr-4 file:cursor-pointer file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-700 aria-[invalid=true]:border-red-700">
    <p id="a-${def.campo}" class="${CLS.ayuda}">${def.formatos} · máximo 5 MB.</p>
    <p id="e-${def.campo}" class="${CLS.errorCampo}" hidden></p>
  </div>`;
}

/** Número de paso (1–5) en un círculo: guía el orden de la planilla sin depender del color. */
function encabezadoSeccion(id: string, numero: number, titulo: string): HtmlSeguro {
  return html`<h2 id="t-${id}" class="mb-4 flex items-center gap-3 text-base font-bold text-slate-900"><span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white" aria-hidden="true">${numero}</span><span>${titulo}</span></h2>`;
}

function seccionHtml(s: DefSeccion, numero: number): HtmlSeguro {
  // En el paso de pago las instrucciones de las cuentas van PRIMERO: se paga y luego se anota la referencia.
  const bloqueCuentas = s.id === 'pago' ? html`<div class="sm:col-span-2" id="cuentas-pago" aria-live="polite"></div>` : null;
  return html`<section class="${CLS.tarjeta} p-6" aria-labelledby="t-${s.id}">
    ${encabezadoSeccion(s.id, numero, s.titulo)}
    <div class="grid gap-4 sm:grid-cols-2">${bloqueCuentas}${s.campos.map(controlHtml)}</div>
  </section>`;
}

function esqueleto(): HtmlSeguro {
  return html`<div class="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-8">
    <header class="flex items-center gap-4">
      <span class="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">${icono('school', 'h-6 w-6')}</span>
      <div>
        <h1 id="titulo-pagina" tabindex="-1" class="${CLS.titulo}">Inscripción de nuevos estudiantes</h1>
        <p class="${CLS.subtitulo}">Brilliant Minds Academy · Planilla de admisión</p>
      </div>
    </header>

    <div id="invitacion"></div>

    <section id="costo" class="${CLS.tarjetaCristal} p-6" aria-labelledby="t-costo"></section>

    <div id="resumen-errores" tabindex="-1"></div>

    <form id="planilla" novalidate class="flex flex-col gap-6" aria-label="Planilla de inscripción">
      ${SECCIONES.slice(0, 3).map((s, i) => seccionHtml(s, i + 1))}
      <section class="${CLS.tarjeta} p-6" aria-labelledby="t-documentos">
        ${encabezadoSeccion('documentos', 4, 'Documentos obligatorios')}
        <div class="grid gap-4 sm:grid-cols-2">${ARCHIVOS.map(archivoHtml)}</div>
      </section>
      ${seccionHtml(SECCIONES[3] ?? { id: 'pago', titulo: 'Pago', campos: [] }, 5)}
      <button id="enviar" type="submit" class="${boton(CLS.btnPrimario, 'w-full py-3 text-base')}">${icono('upload', 'h-5 w-5')}<span>Enviar inscripción</span></button>
      <p class="text-center text-xs text-slate-600">Los campos con <span aria-hidden="true">*</span><span class="sr-only">asterisco</span> son obligatorios.</p>
    </form>
  </div>`;
}

function costoHtml(): HtmlSeguro {
  const { config, consultadoEn, errorConfig, cargandoConfig } = estado;
  const titulo = html`<h2 id="t-costo" class="text-base font-bold text-slate-900">Matrícula inicial</h2>`;
  if (!config) {
    if (cargandoConfig) {
      return html`${titulo}<div class="mt-4 h-12 animate-pulse rounded-lg bg-slate-200" role="status" aria-label="Cargando costo de la matrícula"></div>`;
    }
    return html`${titulo}<div class="mt-4">${aviso('bad', errorConfig ?? 'No se pudo cargar el costo de la matrícula.')}</div>
      <button type="button" id="reintentar" class="${boton(CLS.btnSecundario, 'mt-4')}">${icono('refresh', 'h-4 w-4')}<span>Reintentar</span></button>`;
  }
  return html`${titulo}
    <div class="mt-4 flex flex-wrap items-end gap-x-6 gap-y-2">
      <p class="text-3xl font-bold text-slate-900" data-usd>${usd(config.matricula_usd)}</p>
      <p class="pb-1 text-xl font-semibold text-slate-700" data-bs>≈ ${bs(config.matricula_bs)}</p>
    </div>
    <p class="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
      <span>Tasa BCV: <strong class="text-slate-900" data-tasa>${formatoTasa(config.tasa_bcv)}</strong> Bs. por US$</span>
      ${consultadoEn ? html`<span>· consultada a las <time data-hora>${horaConSegundos(consultadoEn)}</time></span>` : null}
      <button type="button" id="actualizar-tasa" class="${boton(CLS.btnSecundario, CLS.btnPeq)}">${icono('refresh', 'h-4 w-4')}<span>Actualizar</span></button>
    </p>
    ${config.tasa_desactualizada ? html`<div class="mt-4">${aviso('warn', 'El BCV no respondió en este momento: se muestra la última tasa disponible. El monto exacto se confirma al enviar.')}</div>` : null}
    <p class="mt-4 text-sm text-slate-700">Las cuentas autorizadas y los pasos para pagar están en el <a href="#t-pago" class="font-semibold text-slate-900 underline">paso 5 · Pago de la matrícula</a>.</p>`;
}

/** Aplica el bloqueo visual del campo «Grado a cursar» con el nivel asignado por la invitación (idempotente). */
function aplicarNivelBloqueado(nivel: string): void {
  const control = buscar('#f-grado_solicitado', HTMLInputElement);
  if (!control) return;
  control.value = nivel;
  control.readOnly = true;
  control.tabIndex = -1;
  control.setAttribute('aria-readonly', 'true');
  control.classList.remove('bg-white');
  control.classList.add(...CLASES_NIVEL_BLOQUEADO.split(' '));
  if (!buscar('#a-grado_solicitado', HTMLElement)) {
    const nota = document.createElement('p');
    nota.id = 'a-grado_solicitado';
    nota.className = CLS.ayuda;
    nota.textContent = 'Nivel asignado por la academia en tu invitación; no se puede cambiar.';
    control.insertAdjacentElement('afterend', nota);
    control.setAttribute('aria-describedby', 'a-grado_solicitado e-grado_solicitado');
  }
}

/** Banner de la invitación (sede + nivel) o, si el enlace no sirve, el aviso de error y la planilla deshabilitada. */
function pintarInvitacion(): void {
  const zona = obtener('#invitacion', HTMLElement);
  const planilla = obtener('#planilla', HTMLElement);
  const costo = obtener('#costo', HTMLElement);
  if (estado.invitacionRechazada !== null) {
    montar(zona, aviso('bad', estado.invitacionRechazada, 'Invitación no válida'));
    planilla.hidden = true;
    costo.hidden = true;
    return;
  }
  planilla.hidden = false;
  costo.hidden = false;
  if (INVITACION.tipo === 'token' && esConfigInvitacion(estado.config)) {
    const c = estado.config;
    montar(zona, aviso('info', html`Inscripción en <strong>${c.sede.nombre}</strong> · Nivel asignado: <strong>${c.nivel_asignado}</strong>`, 'Invitación válida'));
    aplicarNivelBloqueado(c.nivel_asignado);
  } else if (INVITACION.tipo === 'token') {
    montar(zona, html`<p class="text-sm text-slate-600" role="status">Validando tu invitación…</p>`);
  } else {
    montar(zona, html``);
  }
}

function pintarCosto(): void {
  const zona = obtener('#costo', HTMLElement);
  montar(zona, costoHtml());
  buscar('#reintentar', HTMLButtonElement)?.addEventListener('click', () => void refrescarConfig(false));
  buscar('#actualizar-tasa', HTMLButtonElement)?.addEventListener('click', () => void refrescarConfig(false));
  pintarCuentas();
  pintarInvitacion();
}

// ───────────────────────── Cuentas autorizadas (instrucciones de pago dinámicas) ─────────────────────────

const montoEn = (config: ConfigAdmisiones, moneda: InfoMetodo['moneda']): string => (moneda === 'BS' ? bs(config.matricula_bs) : usd(config.matricula_usd));

function cuentaHtml(c: CuentaPago): HtmlSeguro {
  return html`<div class="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
    <p class="break-words font-semibold text-slate-900">${c.detalle}</p>
    <p class="text-xs text-slate-600">Titular: ${c.titular}</p>
    <button type="button" data-copiar="${c.detalle}" class="${boton(CLS.btnSecundario, CLS.btnPeq, 'mt-2')}" aria-label="Copiar los datos de ${nombreMetodo(c.metodo)}">${icono('copy', 'h-4 w-4')}<span>Copiar datos</span></button>
  </div>`;
}

function tarjetaMetodoHtml(config: ConfigAdmisiones, metodo: MetodoPago, cuentas: readonly CuentaPago[], elegido: boolean): HtmlSeguro {
  const info = INFO_METODOS[metodo];
  return html`<article role="listitem" data-metodo="${metodo}" class="flex flex-col gap-3 rounded-xl border bg-white/95 p-4 shadow-sm ${elegido ? 'border-slate-900 ring-2 ring-slate-900' : 'border-slate-200'}">
    <header class="flex items-center justify-between gap-3">
      <h3 class="flex items-center gap-2 text-sm font-bold text-slate-900">${icono(info.icono, 'h-5 w-5')}<span>${nombreMetodo(metodo)}</span></h3>
      ${elegido ? etiqueta('Seleccionado', 'ok') : null}
    </header>
    <p class="text-lg font-bold text-slate-900">${montoEn(config, info.moneda)} <span class="text-xs font-medium text-slate-600">· monto exacto${info.moneda === 'BS' ? ` a tasa BCV ${formatoTasa(config.tasa_bcv)}` : ''}</span></p>
    ${cuentas.map(cuentaHtml)}
    <ol class="flex list-decimal flex-col gap-1 pl-6 text-xs text-slate-700">${info.pasos.map((p) => html`<li>${p}</li>`)}</ol>
    <button type="button" data-elegir="${metodo}" aria-pressed="${elegido}" class="${boton(elegido ? CLS.btnPrimario : CLS.btnSecundario, 'mt-auto')}">${elegido ? 'Método seleccionado' : 'Pagaré con este método'}</button>
  </article>`;
}

function cuentasHtml(config: ConfigAdmisiones, elegido: string): HtmlSeguro {
  const grupos = METODOS.map((m) => ({ metodo: m, cuentas: config.cuentas.filter((c) => c.metodo === m) })).filter((g) => g.cuentas.length > 0);
  if (grupos.length === 0) {
    return aviso('warn', 'Aún no hay cuentas de pago habilitadas. Consulta los datos de pago con la administración antes de enviar la planilla.');
  }
  return html`<p class="mb-3 text-sm text-slate-700">Paga el monto exacto en una de las cuentas autorizadas, elige el método que usaste y anota abajo el número de referencia.</p>
    <div class="grid gap-4 sm:grid-cols-2" role="list" aria-label="Cuentas autorizadas para el pago">${grupos.map((g) => tarjetaMetodoHtml(config, g.metodo, g.cuentas, g.metodo === elegido))}</div>`;
}

const metodoElegido = (): string => buscar('#f-metodo_pago', HTMLSelectElement)?.value ?? '';

let ultimoHtmlCuentas = '';

/** Redibuja las tarjetas solo si cambió algo (tasa, cuentas o método elegido) y devuelve el foco al botón que lo tenía. */
function pintarCuentas(): void {
  const zona = buscar('#cuentas-pago', HTMLElement);
  if (!zona || !estado.config) return;
  const contenido = cuentasHtml(estado.config, metodoElegido());
  if (contenido.valor === ultimoHtmlCuentas && zona.childElementCount > 0) return;
  const activo = document.activeElement;
  const clave = activo instanceof HTMLElement && zona.contains(activo) ? (activo.dataset['elegir'] ? `[data-elegir="${CSS.escape(activo.dataset['elegir'])}"]` : null) : null;
  ultimoHtmlCuentas = contenido.valor;
  montar(zona, contenido);
  if (clave) buscar(clave, HTMLElement, zona)?.focus();
}

function seleccionarMetodo(valor: string): void {
  if (!esMetodoPago(valor)) return;
  const selector = buscar('#f-metodo_pago', HTMLSelectElement);
  if (!selector) return;
  selector.value = valor;
  pintarCuentas();
}

/** Copia al portapapeles (API moderna con plan B para navegadores sin permiso) y avisa del resultado. */
async function copiarTexto(texto: string): Promise<void> {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(texto);
      notificar('ok', 'Datos copiados al portapapeles.', 3_000);
      return;
    }
  } catch {
    /* sin permiso: se intenta el plan B */
  }
  const area = document.createElement('textarea');
  area.value = texto;
  area.setAttribute('readonly', '');
  area.className = 'fixed left-0 top-0 opacity-0';
  document.body.append(area);
  area.select();
  let copiado = false;
  try {
    copiado = document.execCommand('copy');
  } catch {
    copiado = false;
  }
  area.remove();
  notificar(copiado ? 'ok' : 'warn', copiado ? 'Datos copiados al portapapeles.' : 'No se pudo copiar automáticamente: selecciona los datos y cópialos.', 4_000);
}

/** Validación en vivo del número de referencia: sin espacios, solo letras/números/guiones. */
function validarReferenciaEnVivo(control: HTMLInputElement, completo: boolean): void {
  const problema = mensajeReferencia(control.value, completo);
  const texto = buscar('#e-referencia_bancaria', HTMLElement);
  if (!texto) return;
  if (problema) {
    texto.textContent = problema;
    texto.hidden = false;
    control.setAttribute('aria-invalid', 'true');
  } else {
    texto.textContent = '';
    texto.hidden = true;
    control.removeAttribute('aria-invalid');
  }
}

// ───────────────────────── Carga de la tasa BCV ─────────────────────────

/** Devuelve true si la consulta tuvo éxito. */
async function refrescarConfig(silencioso: boolean): Promise<boolean> {
  if (!silencioso) {
    actualizar({ cargandoConfig: true, errorConfig: null });
    if (!estado.config) pintarCosto();
  }
  if (estado.invitacionRechazada !== null) return false; // enlace inválido: no hay nada que consultar
  const ruta = INVITACION.tipo === 'token' ? `/public/admisiones/invitacion/${INVITACION.token}` : '/public/admisiones/config';
  try {
    const config = await bma.get<ConfigAdmisiones | ConfigInvitacion>(ruta, undefined, { sinAuth: true });
    actualizar({ config, consultadoEn: new Date(), errorConfig: null, cargandoConfig: false });
    pintarCosto();
    return true;
  } catch (e: unknown) {
    if (INVITACION.tipo === 'token' && e instanceof BmaApiError && e.estado === 410) {
      actualizar({ cargandoConfig: false, config: null, invitacionRechazada: e.message });
      pintarCosto();
      return false;
    }
    actualizar({ cargandoConfig: false, errorConfig: estado.config ? null : mensajeDeError(e) });
    if (!silencioso || !estado.config) pintarCosto();
    return false;
  }
}

// ───────────────────────── Errores en pantalla ─────────────────────────

const ALIAS_CAMPO: Readonly<Record<string, string>> = { telefono: 'telefono_numero' };

function limpiarErrores(): void {
  montar(obtener('#resumen-errores', HTMLElement), html``);
  for (const p of todos('[id^="e-"]', HTMLElement)) {
    p.hidden = true;
    p.textContent = '';
  }
  for (const c of todos('[aria-invalid="true"]', HTMLElement)) c.removeAttribute('aria-invalid');
}

function marcarCampo(campo: string, mensaje: string): boolean {
  const nombre = ALIAS_CAMPO[campo] ?? campo;
  const texto = buscar(`#e-${CSS.escape(nombre)}`, HTMLElement);
  const control = buscar(`#f-${CSS.escape(nombre)}`, HTMLElement);
  if (!texto || !control) return false;
  texto.textContent = mensaje;
  texto.hidden = false;
  control.setAttribute('aria-invalid', 'true');
  return true;
}

function mostrarErrores(errores: readonly ErrorValidacion[], titulo = 'Revisa la planilla antes de enviarla'): void {
  for (const e of errores) marcarCampo(e.campo, e.mensaje);
  const zona = obtener('#resumen-errores', HTMLElement);
  montar(zona, aviso('bad', html`<ul class="list-disc pl-4">${errores.map((e) => html`<li>${e.mensaje}</li>`)}</ul>`, titulo));
  const primero = errores.map((e) => buscar(`#f-${CSS.escape(ALIAS_CAMPO[e.campo] ?? e.campo)}`, HTMLElement)).find((c) => c !== null);
  if (primero) primero.focus();
  else zona.focus();
  zona.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

function mostrarExito(r: RespuestaAdmision): void {
  const raiz = obtener('#planilla', HTMLElement);
  limpiarErrores();
  montar(
    raiz,
    html`<section class="${CLS.tarjetaCristal} p-6" role="status">
      <div class="flex items-center gap-3">
        <span class="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-700 text-white">${icono('check', 'h-5 w-5')}</span>
        <h2 id="exito" tabindex="-1" class="text-xl font-bold text-slate-900">¡Inscripción recibida!</h2>
      </div>
      <dl class="mt-6 grid gap-4 text-sm sm:grid-cols-2">
        <div><dt class="text-slate-600">Estatus</dt><dd class="font-semibold text-slate-900">${r.estatus}</dd></div>
        ${r.grado_solicitado ? html`<div><dt class="text-slate-600">Nivel asignado</dt><dd class="font-semibold text-slate-900">${r.grado_solicitado}</dd></div>` : null}
        <div><dt class="text-slate-600">Método</dt><dd class="font-semibold text-slate-900">${nombreMetodo(r.metodo_pago)}</dd></div>
        <div><dt class="text-slate-600">Referencia declarada</dt><dd class="break-all font-semibold text-slate-900">${r.referencia}</dd></div>
        <div><dt class="text-slate-600">Monto de la matrícula</dt><dd class="font-semibold text-slate-900">${usd(r.monto_usd)} · ${bs(r.monto_bs)}</dd></div>
        <div><dt class="text-slate-600">Tasa BCV aplicada</dt><dd class="font-semibold text-slate-900">${formatoTasa(r.tasa_bcv)} Bs. por US$${r.tasa_desactualizada ? ' (última disponible)' : ''}</dd></div>
      </dl>
      <p class="mt-6 text-sm text-slate-700">La administración validará tu pago en breve y te contactará por WhatsApp. Conserva el comprobante de tu transferencia.</p>
    </section>`,
  );
  buscar('#exito', HTMLElement)?.focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ───────────────────────── Envío ─────────────────────────

async function alEnviar(formulario: HTMLFormElement): Promise<void> {
  if (estado.enviando) return;
  limpiarErrores();

  if (INVITACION.tipo === 'token' && !esConfigInvitacion(estado.config)) {
    mostrarErrores([{ campo: '', mensaje: 'Estamos validando tu invitación. Intenta de nuevo en unos segundos.' }], 'Un momento');
    return;
  }
  const textos = leerTextos(formulario);
  const inspeccion = inspeccionarArchivos(formulario);
  const errores = [...validarTextos(textos), ...inspeccion.errores];
  if (errores.length > 0) {
    mostrarErrores(errores);
    return;
  }

  const botonEnviar = obtener('#enviar', HTMLButtonElement);
  actualizar({ enviando: true });
  try {
    await conBotonOcupado(botonEnviar, async () => {
      // La tasa se confirma justo antes de enviar: si cambió, el representante debe ver el monto nuevo antes de continuar.
      const tasaMostrada = estado.config?.tasa_bcv ?? null;
      await refrescarConfig(true);
      if (!estado.config) {
        mostrarErrores([{ campo: '', mensaje: 'No se pudo confirmar el costo de la matrícula. Intenta de nuevo en unos segundos.' }], 'Sin conexión');
        return;
      }
      if (tasaMostrada !== null && estado.config.tasa_bcv !== tasaMostrada) {
        mostrarErrores(
          [{ campo: '', mensaje: `La tasa BCV cambió a ${formatoTasa(estado.config.tasa_bcv)}. El monto en bolívares se actualizó a ${bs(estado.config.matricula_bs)}; revísalo y vuelve a enviar.` }],
          'La tasa BCV se actualizó',
        );
        return;
      }
      if (estado.invitacionRechazada !== null) {
        mostrarErrores([{ campo: '', mensaje: estado.invitacionRechazada }], 'Invitación no válida');
        return;
      }
      // Con invitación el nivel es el asignado por el servidor (el campo bloqueado ya lo muestra; esto cierra cualquier edición por consola).
      const nivelAsignado = esConfigInvitacion(estado.config) ? estado.config.nivel_asignado : null;
      const datos = construirFormData(
        nivelAsignado !== null ? { ...textos, grado_solicitado: nivelAsignado } : textos,
        inspeccion.archivos,
        INVITACION.tipo === 'token' ? INVITACION.token : null,
      );
      const respuesta = await bma.post<RespuestaAdmision>('/public/admisiones', datos, { sinAuth: true, timeoutMs: 120_000 });
      mostrarExito(respuesta);
    });
  } catch (e: unknown) {
    if (e instanceof BmaApiError && e.camposInvalidos().length > 0) {
      mostrarErrores(e.camposInvalidos().map((d) => ({ campo: d.campo, mensaje: d.mensaje })), e.message);
    } else {
      mostrarErrores([{ campo: '', mensaje: mensajeDeError(e) }], 'No se pudo enviar la inscripción');
    }
  } finally {
    actualizar({ enviando: false });
  }
}

// ───────────────────────── Arranque ─────────────────────────

function mostrarArchivoElegido(control: HTMLInputElement): void {
  const def = ARCHIVOS.find((a) => a.campo === control.name);
  const texto = buscar(`#e-${CSS.escape(control.name)}`, HTMLElement);
  if (!def || !texto) return;
  const archivo = control.files?.[0];
  if (!archivo) {
    texto.hidden = true;
    control.removeAttribute('aria-invalid');
    return;
  }
  const problema = validarArchivo(def, archivo);
  if (problema) {
    texto.textContent = problema.mensaje;
    texto.hidden = false;
    control.setAttribute('aria-invalid', 'true');
  } else {
    control.removeAttribute('aria-invalid');
    texto.hidden = true;
    texto.textContent = '';
    const ayuda = buscar(`#a-${CSS.escape(control.name)}`, HTMLElement);
    if (ayuda) ayuda.textContent = `${archivo.name} · ${formatoTamano(archivo.size)} · listo.`;
  }
}

function iniciar(): void {
  const raiz = obtener('#app', HTMLElement);
  document.body.className = 'text-slate-900';
  montar(raiz, esqueleto());
  pintarCosto();

  const formulario = obtener('#planilla', HTMLFormElement);
  formulario.addEventListener('submit', (ev) => {
    ev.preventDefault();
    void alEnviar(formulario);
  });
  for (const control of todos('input[type="file"]', HTMLInputElement, formulario)) {
    control.addEventListener('change', () => mostrarArchivoElegido(control));
  }

  // Cuentas de pago: copiar datos y elegir método desde las tarjetas (delegación: las tarjetas se redibujan con la tasa).
  obtener('#cuentas-pago', HTMLElement).addEventListener('click', (ev) => {
    const origen = ev.target instanceof Element ? ev.target : null;
    const copiar = origen?.closest('[data-copiar]');
    if (copiar instanceof HTMLElement) {
      void copiarTexto(copiar.dataset['copiar'] ?? '');
      return;
    }
    const elegir = origen?.closest('[data-elegir]');
    if (elegir instanceof HTMLElement) seleccionarMetodo(elegir.dataset['elegir'] ?? '');
  });
  obtener('#f-metodo_pago', HTMLSelectElement).addEventListener('change', pintarCuentas);

  // Referencia bancaria: se quitan los espacios al escribir/pegar y se valida el patrón al instante.
  const referencia = obtener('#f-referencia_bancaria', HTMLInputElement);
  referencia.addEventListener('input', () => {
    const limpio = sanearReferencia(referencia.value);
    if (limpio !== referencia.value) referencia.value = limpio;
    validarReferenciaEnVivo(referencia, false);
  });
  referencia.addEventListener('blur', () => validarReferenciaEnVivo(referencia, referencia.value !== ''));

  void refrescarConfig(false);
  window.setInterval(() => {
    if (!document.hidden && !estado.enviando) void refrescarConfig(true);
  }, INTERVALO_TASA_MS);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !estado.enviando) void refrescarConfig(true);
  });
}

iniciar();
