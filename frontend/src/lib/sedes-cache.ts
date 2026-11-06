/** Lista de sedes en caché (dato de baja mutación): clave y guarda de tipo compartidas por Sedes, Estudiantes e Invitaciones. */
import type { SedeResumen } from '../types/index';

export const CLAVE_SEDES = 'sedes';

export function esListaSedes(v: unknown): v is readonly SedeResumen[] {
  return Array.isArray(v) && v.every((s: unknown) => {
    if (typeof s !== 'object' || s === null) return false;
    const o = s as Readonly<Record<string, unknown>>;
    return typeof o['id'] === 'number' && typeof o['nombre'] === 'string' && typeof o['activa'] === 'boolean';
  });
}
