'use strict';

/**
 * Error de dominio con contrato JSON estable:
 *   { ok:false, error:{ codigo, mensaje, detalles?, requestId } }
 * `status` es el código HTTP; `codigo` es una constante en MAYÚSCULAS que el frontend puede evaluar.
 */
class AppError extends Error {
  constructor(status, codigo, mensaje, detalles) {
    super(mensaje);
    this.name = 'AppError';
    this.status = status;
    this.codigo = codigo;
    this.detalles = detalles;
    this.headers = undefined;
  }

  conCabeceras(headers) {
    this.headers = headers;
    return this;
  }
}

const e = {
  validacion: (detalles, mensaje = 'Hay datos inválidos o faltantes.') => new AppError(422, 'VALIDACION', mensaje, detalles),
  noAutenticado: (mensaje = 'Autenticación requerida.') => new AppError(401, 'NO_AUTENTICADO', mensaje),
  prohibido: (mensaje = 'No tienes permiso para esta acción.') => new AppError(403, 'PROHIBIDO', mensaje),
  noEncontrado: (que = 'Recurso') => new AppError(404, 'NO_ENCONTRADO', `${que} no encontrado.`),
  conflicto: (codigo, mensaje, detalles) => new AppError(409, codigo, mensaje, detalles),
  reglaNegocio: (codigo, mensaje, detalles) => new AppError(422, codigo, mensaje, detalles),
  noDisponible: (codigo, mensaje) => new AppError(503, codigo, mensaje),
  externo: (codigo, mensaje) => new AppError(502, codigo, mensaje),
};

module.exports = { AppError, e };
