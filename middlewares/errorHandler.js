'use strict';
const { AppError } = require('../errors/AppError');

/** Mensajes amigables por nombre de índice/constraint único violado (errores MSSQL 2601 / 2627). */
const UNICOS = {
  ux_pagos_referencia_activa: ['REFERENCIA_DUPLICADA', 'Esa referencia bancaria ya fue registrada para este método de pago.'],
  ux_estudiantes_identidad: ['ESTUDIANTE_DUPLICADO', 'Ya existe un estudiante con esos datos para este representante.'],
  uq_representantes_cedula: ['REPRESENTANTE_DUPLICADO', 'Ya existe un representante con esa cédula.'],
  uq_personal_cedula: ['CEDULA_DUPLICADA', 'Ya existe un miembro del personal con esa cédula.'],
  uq_usuarios_admin_email: ['EMAIL_DUPLICADO', 'Ya existe un usuario con ese correo.'],
  uq_nomina_personal_periodo: ['NOMINA_DUPLICADA', 'La nómina de ese período ya fue calculada para esta persona.'],
  ux_egresos_nomina: ['EGRESO_NOMINA_DUPLICADO', 'Esa nómina ya generó su egreso.'],
  uq_documentos_estudiante_tipo: ['DOCUMENTO_DUPLICADO', 'Ese documento ya fue cargado para el estudiante.'],
};

const CODIGOS_CONEXION = new Set(['ESOCKET', 'ECONNCLOSED', 'ELOGIN', 'ECONNRESET', 'ENOTOPEN', 'ETIMEOUT', 'EINSTLOOKUP']);

function nombreConstraint(mensaje = '') {
  const m = /(?:index|constraint)\s+'([^']+)'/i.exec(mensaje);
  return m ? m[1] : null;
}

/** Traduce cualquier error a { status, codigo, mensaje, detalles?, headers? }. Nunca expone SQL ni stack al cliente. */
function normalizar(err) {
  if (err instanceof AppError) {
    return { status: err.status, codigo: err.codigo, mensaje: err.message, detalles: err.detalles, headers: err.headers };
  }
  // Cuerpo JSON malformado o demasiado grande (body-parser).
  if (err && err.type === 'entity.parse.failed') {
    return { status: 400, codigo: 'JSON_INVALIDO', mensaje: 'El cuerpo de la petición no es JSON válido.' };
  }
  if (err && err.type === 'entity.too.large') {
    return { status: 413, codigo: 'CUERPO_DEMASIADO_GRANDE', mensaje: 'El cuerpo de la petición excede el tamaño permitido.' };
  }
  // multer
  if (err && err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return { status: 413, codigo: 'ARCHIVO_DEMASIADO_GRANDE', mensaje: 'Un archivo excede el tamaño máximo permitido.', detalles: [{ campo: err.field }] };
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return { status: 422, codigo: 'ARCHIVO_NO_ESPERADO', mensaje: `Campo de archivo no esperado: ${err.field}.` };
    }
    return { status: 422, codigo: 'CARGA_INVALIDA', mensaje: 'La carga de archivos es inválida.', detalles: [{ campo: err.field, motivo: err.code }] };
  }
  // mssql
  if (err && (err.name === 'RequestError' || err.name === 'TransactionError' || err.name === 'PreparedStatementError' || err.name === 'ConnectionError')) {
    const numero = err.number ?? err.originalError?.info?.number;
    if (numero === 2601 || numero === 2627) {
      const [codigo, mensaje] = UNICOS[nombreConstraint(err.message)] || ['REGISTRO_DUPLICADO', 'Ya existe un registro con esos datos.'];
      return { status: 409, codigo, mensaje };
    }
    if (numero === 547) return { status: 409, codigo: 'VIOLACION_INTEGRIDAD', mensaje: 'La operación viola una regla de integridad de los datos.' };
    if (numero === 515 || numero === 8152) return { status: 422, codigo: 'VALIDACION', mensaje: 'Datos faltantes o demasiado largos.' };
    if (numero === 1205) return { status: 503, codigo: 'REINTENTAR', mensaje: 'Conflicto temporal en la base de datos. Intenta de nuevo.', headers: { 'Retry-After': '2' } };
    if (err.code === 'ETIMEOUT') return { status: 504, codigo: 'BASE_DATOS_TIMEOUT', mensaje: 'La base de datos tardó demasiado en responder.' };
    if (CODIGOS_CONEXION.has(err.code) || err.name === 'ConnectionError') {
      return { status: 503, codigo: 'BASE_DATOS_NO_DISPONIBLE', mensaje: 'La base de datos no está disponible. Intenta más tarde.', headers: { 'Retry-After': '10' } };
    }
  }
  return { status: 500, codigo: 'ERROR_INTERNO', mensaje: 'Error interno del servidor.' };
}

function notFound(req, _res, next) {
  next(new AppError(404, 'RUTA_NO_ENCONTRADA', `No existe ${req.method} ${req.originalUrl.split('?')[0]}.`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const r = normalizar(err);
  if (r.status >= 500) console.error(`[error] ${req.id || '-'} ${req.method} ${req.originalUrl}`, err);
  // Si ya se enviaron cabeceras (p. ej. un .xlsx a medias) no se puede enviar JSON: se corta la conexión.
  if (res.headersSent) return res.destroy(err);
  // Si el error ocurrió antes del primer byte de una descarga (.xlsx), el navegador no debe guardar el JSON como archivo.
  res.removeHeader('Content-Disposition');
  if (r.headers) res.set(r.headers);
  const error = { codigo: r.codigo, mensaje: r.mensaje, requestId: req.id };
  if (r.detalles !== undefined) error.detalles = r.detalles;
  return res.status(r.status).json({ ok: false, error });
}

module.exports = { errorHandler, notFound, normalizar };
