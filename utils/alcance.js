'use strict';
const { AppError, e } = require('../errors/AppError');

/**
 * Alcance de sede del usuario autenticado (multi-sede).
 *   · devuelve un ENTERO  → el usuario solo opera sobre esa sede: los servicios filtran con `($n::int IS NULL OR x.sede_id = $n::int)`.
 *   · devuelve NULL       → acceso consolidado/global (SuperAdmin): el mismo predicado deja pasar todas las filas.
 * FAIL-CLOSED: un usuario que NO es admin y no tiene sede (secretaria sin asignar, token anterior a la migración 005) NO se trata como
 * global: recibe 403 SEDE_NO_ASIGNADA. Así un olvido de configuración nunca abre el acceso consolidado.
 * Todo controlador del panel que lea o escriba datos segmentados por sede debe llamar a esta función con `req.usuario`.
 */
function alcanceDe(usuario) {
  if (!usuario) throw e.noAutenticado();
  const sede = usuario.sede_id;
  if (sede === null || sede === undefined) {
    if (usuario.rol === 'admin') return null;
    throw new AppError(403, 'SEDE_NO_ASIGNADA', 'Tu usuario no tiene una sede asignada. Pide a un administrador que te asigne una sede.');
  }
  if (!Number.isInteger(sede) || sede <= 0) throw e.prohibido('La sede de tu sesión no es válida. Inicia sesión de nuevo.');
  return sede;
}

/** Función reservada al acceso consolidado (nómina, personal, horas, ajustes globales): un usuario atado a una sede recibe 403. */
function requireConsolidado(req, _res, next) {
  try {
    if (alcanceDe(req.usuario) !== null) {
      throw e.prohibido('Esta función solo está disponible para el acceso consolidado (usuario sin sede asignada).');
    }
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { alcanceDe, requireConsolidado };
