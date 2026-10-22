/**
 * Cliente HTTP unificado del backend BMA.
 *  - Inyecta `Authorization: Bearer <token>` leyendo `sessionStorage` (salvo `sinAuth`).
 *  - Mapea `{ ok: true, data }` → valor tipado y `{ ok: false, error }` → excepciones tipadas:
 *      BmaApiError (el servidor respondió con error), BmaSesionExpiradaError (401),
 *      BmaRedError (sin conexión / tiempo agotado / respuesta que no es JSON).
 */
import type {
  CuerpoError,
  DetalleCampo,
  DetalleModuloPremium,
  Paginacion,
  RespuestaError,
  RespuestaOk,
} from '../types/index';

const CLAVE_TOKEN = 'tok';
const CLAVE_USUARIO = 'usr';
const PREFIJO_API = '/api';
const TIMEOUT_POR_DEFECTO_MS = 30_000;

// ───────────────────────── Almacenamiento de sesión ─────────────────────────

export function leerSesion(clave: string): string | null {
  try {
    return sessionStorage.getItem(clave);
  } catch {
    return null; // modo privado / almacenamiento bloqueado
  }
}

function escribirSesion(clave: string, valor: string | null): void {
  try {
    if (valor === null) sessionStorage.removeItem(clave);
    else sessionStorage.setItem(clave, valor);
  } catch {
    /* sin almacenamiento: la sesión vive solo en memoria de la página */
  }
}

export const sesion = {
  token: (): string | null => leerSesion(CLAVE_TOKEN),
  usuarioCrudo: (): string | null => leerSesion(CLAVE_USUARIO),
  guardar(token: string, usuarioJson: string): void {
    escribirSesion(CLAVE_TOKEN, token);
    escribirSesion(CLAVE_USUARIO, usuarioJson);
  },
  cerrar(): void {
    escribirSesion(CLAVE_TOKEN, null);
    escribirSesion(CLAVE_USUARIO, null);
  },
} as const;

// ───────────────────────── Excepciones tipadas ─────────────────────────

export class BmaApiError extends Error {
  readonly estado: number;
  readonly codigo: string;
  readonly detalles: unknown;
  readonly requestId: string | null;

  constructor(estado: number, cuerpo: CuerpoError) {
    super(cuerpo.mensaje);
    this.name = 'BmaApiError';
    this.estado = estado;
    this.codigo = cuerpo.codigo ?? 'ERROR';
    this.detalles = cuerpo.detalles;
    this.requestId = cuerpo.requestId ?? null;
  }

  /** Errores por campo (códigos VALIDACION): `[{campo, mensaje}]`. */
  camposInvalidos(): readonly DetalleCampo[] {
    return Array.isArray(this.detalles) ? this.detalles.filter(esDetalleCampo) : [];
  }

  /** Datos del módulo cuando el servidor responde 403 MODULO_PREMIUM_DESHABILITADO. */
  moduloPremium(): DetalleModuloPremium | null {
    return this.codigo === 'MODULO_PREMIUM_DESHABILITADO' && esDetalleModuloPremium(this.detalles) ? this.detalles : null;
  }
}

/** 401 en una ruta protegida: el token no existe, venció o fue revocado. */
export class BmaSesionExpiradaError extends BmaApiError {
  constructor(cuerpo: CuerpoError) {
    super(401, cuerpo);
    this.name = 'BmaSesionExpiradaError';
  }
}

/** Fallo de transporte: sin red, tiempo agotado o cuerpo que no es JSON válido. */
export class BmaRedError extends Error {
  readonly causa: 'sin_conexion' | 'tiempo_agotado' | 'respuesta_invalida';

  constructor(causa: BmaRedError['causa']) {
    const mensajes: Readonly<Record<BmaRedError['causa'], string>> = {
      sin_conexion: 'Sin conexión con el servidor. Revisa tu internet e intenta de nuevo.',
      tiempo_agotado: 'El servidor tardó demasiado en responder. Intenta de nuevo.',
      respuesta_invalida: 'El servidor devolvió una respuesta no válida.',
    };
    super(mensajes[causa]);
    this.name = 'BmaRedError';
    this.causa = causa;
  }
}

export function esBmaApiError(e: unknown): e is BmaApiError {
  return e instanceof BmaApiError;
}

/** Mensaje presentable para cualquier excepción capturada (`unknown` en strict). */
export function mensajeDeError(e: unknown): string {
  if (e instanceof BmaApiError || e instanceof BmaRedError) return e.message;
  return 'Ocurrió un error inesperado. Intenta de nuevo.';
}

// ───────────────────────── Guardas de tipo ─────────────────────────

function esObjeto(v: unknown): v is Readonly<Record<string, unknown>> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function esDetalleCampo(v: unknown): v is DetalleCampo {
  return esObjeto(v) && typeof v['campo'] === 'string' && typeof v['mensaje'] === 'string';
}

function esDetalleModuloPremium(v: unknown): v is DetalleModuloPremium {
  return esObjeto(v) && typeof v['modulo'] === 'string' && typeof v['nombre'] === 'string' && typeof v['precio_usd'] === 'number';
}

function esRespuestaError(v: unknown): v is RespuestaError {
  return esObjeto(v) && v['ok'] === false && esObjeto(v['error']) && typeof v['error']['mensaje'] === 'string';
}

function esRespuestaOk(v: unknown): v is RespuestaOk<unknown> {
  return esObjeto(v) && v['ok'] === true && 'data' in v;
}

// ───────────────────────── Núcleo ─────────────────────────

export type ParametrosConsulta = Readonly<Record<string, string | number | boolean | null | undefined>>;

export interface OpcionesPeticion {
  readonly metodo?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  readonly consulta?: ParametrosConsulta;
  /** JSON (objeto) o FormData (multipart: el navegador fija el Content-Type con su boundary). */
  readonly cuerpo?: object;
  /** No enviar el Bearer (rutas públicas / portal con token propio). */
  readonly sinAuth?: boolean;
  readonly timeoutMs?: number;
  readonly senal?: AbortSignal;
}

function construirUrl(ruta: string, consulta?: ParametrosConsulta): string {
  const base = `${PREFIJO_API}${ruta.startsWith('/') ? ruta : `/${ruta}`}`;
  if (!consulta) return base;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(consulta)) {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  }
  const texto = params.toString();
  return texto ? `${base}?${texto}` : base;
}

function cabeceras(opciones: OpcionesPeticion, esFormData: boolean): Headers {
  const h = new Headers({ Accept: 'application/json' });
  if (opciones.cuerpo !== undefined && !esFormData) h.set('Content-Type', 'application/json');
  const token = opciones.sinAuth ? null : sesion.token();
  if (token) h.set('Authorization', `Bearer ${token}`);
  return h;
}

async function ejecutar(ruta: string, opciones: OpcionesPeticion): Promise<{ readonly estado: number; readonly respuesta: Response }> {
  const esFormData = opciones.cuerpo instanceof FormData;
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), opciones.timeoutMs ?? TIMEOUT_POR_DEFECTO_MS);
  opciones.senal?.addEventListener('abort', () => controlador.abort(), { once: true });
  const init: RequestInit = {
    method: opciones.metodo ?? (opciones.cuerpo !== undefined ? 'POST' : 'GET'),
    headers: cabeceras(opciones, esFormData),
    signal: controlador.signal,
    credentials: 'same-origin',
  };
  if (opciones.cuerpo !== undefined) init.body = esFormData ? (opciones.cuerpo as FormData) : JSON.stringify(opciones.cuerpo);
  try {
    const respuesta = await fetch(construirUrl(ruta, opciones.consulta), init);
    return { estado: respuesta.status, respuesta };
  } catch (e: unknown) {
    throw new BmaRedError(e instanceof DOMException && e.name === 'AbortError' ? 'tiempo_agotado' : 'sin_conexion');
  } finally {
    clearTimeout(temporizador);
  }
}

async function leerJson(respuesta: Response): Promise<unknown> {
  try {
    return (await respuesta.json()) as unknown;
  } catch {
    throw new BmaRedError('respuesta_invalida');
  }
}

/** Devuelve el sobre completo `{ok:true,data,paginacion?}` o lanza la excepción tipada que corresponda. */
async function sobre<T>(ruta: string, opciones: OpcionesPeticion = {}): Promise<RespuestaOk<T>> {
  const { estado, respuesta } = await ejecutar(ruta, opciones);
  const json = await leerJson(respuesta);

  if (esRespuestaError(json)) {
    if (estado === 401 && !opciones.sinAuth && ruta !== '/auth/login') {
      sesion.cerrar();
      throw new BmaSesionExpiradaError(json.error);
    }
    throw new BmaApiError(estado, json.error);
  }
  if (!respuesta.ok || !esRespuestaOk(json)) {
    throw new BmaApiError(estado, { mensaje: 'El servidor devolvió una respuesta inesperada.' });
  }
  return json as RespuestaOk<T>;
}

// ───────────────────────── API pública del cliente ─────────────────────────

export interface Pagina<T> {
  readonly datos: readonly T[];
  readonly paginacion: Paginacion;
}

export const bma = {
  async get<T>(ruta: string, consulta?: ParametrosConsulta, extra: Omit<OpcionesPeticion, 'consulta' | 'cuerpo' | 'metodo'> = {}): Promise<T> {
    const opciones: OpcionesPeticion = consulta ? { ...extra, consulta } : extra;
    return (await sobre<T>(ruta, opciones)).data;
  },

  async post<T>(ruta: string, cuerpo: object = {}, extra: Omit<OpcionesPeticion, 'cuerpo' | 'metodo'> = {}): Promise<T> {
    return (await sobre<T>(ruta, { ...extra, metodo: 'POST', cuerpo })).data;
  },

  /** Listados paginados: `{ ok, data: T[], paginacion }`. */
  async pagina<T>(ruta: string, consulta?: ParametrosConsulta): Promise<Pagina<T>> {
    const s = await sobre<readonly T[]>(ruta, consulta ? { consulta } : {});
    return { datos: s.data, paginacion: s.paginacion ?? { pagina: 1, limite: s.data.length, total: s.data.length } };
  },

  /** Descarga binaria autenticada (exportaciones .xlsx). */
  async descargar(ruta: string, nombreArchivo: string): Promise<void> {
    const { estado, respuesta } = await ejecutar(ruta, { timeoutMs: 120_000 });
    if (!respuesta.ok) {
      const json = await respuesta.json().then((v: unknown) => v, () => null);
      if (estado === 401) {
        sesion.cerrar();
        throw new BmaSesionExpiradaError(esRespuestaError(json) ? json.error : { mensaje: 'Tu sesión expiró.' });
      }
      throw new BmaApiError(estado, esRespuestaError(json) ? json.error : { mensaje: 'No se pudo exportar el archivo.' });
    }
    const url = URL.createObjectURL(await respuesta.blob());
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombreArchivo;
    enlace.click();
    setTimeout(() => URL.revokeObjectURL(url), 1_000);
  },
} as const;
