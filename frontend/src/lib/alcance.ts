/**
 * Alcance de sede del usuario del panel — espejo FAIL-CLOSED de `utils/alcance.js` (backend).
 *  - `consolidado`: rol `admin` sin sede (SuperAdmin) → ve y gestiona todas las sedes.
 *  - `sede`:        usuario atado a una sede (secretaria, o admin de sede) → solo opera sobre esa sede.
 *  - `denegado`:    sin sesión, secretaria sin sede asignada o sede con valor inválido → nunca se trata como global.
 *
 * Es solo la cara visible de la regla: el servidor repite la comprobación en cada ruta (`requireConsolidado`, `alcanceDe`)
 * y es la fuente de verdad. Aquí sirve para no disparar peticiones que el servidor rechazaría.
 */
import type { Usuario } from '../types/index';

export type AlcanceUsuario =
  | { readonly tipo: 'consolidado' }
  | { readonly tipo: 'sede'; readonly sedeId: number }
  | { readonly tipo: 'denegado' };

export function alcanceDe(usuario: Usuario | null): AlcanceUsuario {
  if (usuario === null) return { tipo: 'denegado' };
  const sede = usuario.sede_id ?? null;
  if (sede === null) return usuario.rol === 'admin' ? { tipo: 'consolidado' } : { tipo: 'denegado' };
  return Number.isInteger(sede) && sede > 0 ? { tipo: 'sede', sedeId: sede } : { tipo: 'denegado' };
}
