/**
 * Caché transitorio «stale-while-revalidate» en `sessionStorage` para datos de baja mutación (lista de sedes, etc.).
 *  - Con dato en caché: se pinta AL INSTANTE y se pide el dato fresco en segundo plano; si cambió, se repinta en silencio.
 *  - Sin caché: se pide y se pinta al llegar (el llamador muestra un esqueleto mientras tanto).
 *  - Vive solo en la pestaña (sessionStorage) y se vacía al cerrar sesión; si el almacenamiento está bloqueado, todo sigue funcionando sin caché.
 *  - Un fallo de red en el refresco de fondo NO borra lo que ya se ve; un 401 (sesión vencida) siempre se propaga.
 * El dato guardado jamás se asume correcto: se valida con una guarda de tipo antes de usarlo (sin `any`).
 */
import { BmaSesionExpiradaError } from '../api/bmaClient';

const PREFIJO = 'bma.cache.v1:';

export type Guarda<T> = (valor: unknown) => valor is T;

function almacen(): Storage | null {
  try {
    return sessionStorage;
  } catch {
    return null;
  }
}

export function leerCache<T>(clave: string, esValido: Guarda<T>): T | null {
  const s = almacen();
  if (!s) return null;
  try {
    const crudo = s.getItem(PREFIJO + clave);
    if (crudo === null) return null;
    const v: unknown = JSON.parse(crudo);
    return esValido(v) ? v : null;
  } catch {
    return null;
  }
}

export function guardarCache(clave: string, valor: unknown): void {
  try {
    almacen()?.setItem(PREFIJO + clave, JSON.stringify(valor));
  } catch {
    /* cuota llena o bloqueado: se sigue sin caché */
  }
}

/** Invalida una clave (tras una escritura que la deja vieja) o, sin argumento, todo el caché. */
export function invalidarCache(clave?: string): void {
  const s = almacen();
  if (!s) return;
  try {
    if (clave !== undefined) {
      s.removeItem(PREFIJO + clave);
      return;
    }
    const claves: string[] = [];
    for (let i = 0; i < s.length; i += 1) {
      const k = s.key(i);
      if (k !== null && k.startsWith(PREFIJO)) claves.push(k);
    }
    for (const k of claves) s.removeItem(k);
  } catch {
    /* nada que limpiar */
  }
}

export interface OpcionesSwr<T> {
  readonly clave: string;
  readonly esValido: Guarda<T>;
  readonly cargar: () => Promise<T>;
  /** `desdeCache` es true en el primer pintado instantáneo. Debe ser idempotente (se llama una o dos veces). */
  readonly pintar: (datos: T, desdeCache: boolean) => void;
  /** Si devuelve false se abandona (el usuario ya cambió de pestaña). */
  readonly vigente?: () => boolean;
}

/**
 * Devuelve cuando termina el refresco (o enseguida si ya había caché y se prefiere no esperar: ver `esperarRefresco`).
 * Con caché la promesa se resuelve tras el pintado instantáneo + el refresco; el llamador puede ignorarla con `void`.
 */
export async function cargarConCache<T>(o: OpcionesSwr<T>): Promise<void> {
  const vigente = o.vigente ?? ((): boolean => true);
  const enCache = leerCache(o.clave, o.esValido);
  if (enCache !== null && vigente()) o.pintar(enCache, true);
  try {
    const fresco = await o.cargar();
    if (!vigente()) return;
    const cambio = enCache === null || JSON.stringify(fresco) !== JSON.stringify(enCache);
    guardarCache(o.clave, fresco);
    if (cambio) o.pintar(fresco, false);
  } catch (e: unknown) {
    if (e instanceof BmaSesionExpiradaError || enCache === null) throw e;
    /* refresco de fondo fallido: se conserva lo ya pintado */
  }
}
