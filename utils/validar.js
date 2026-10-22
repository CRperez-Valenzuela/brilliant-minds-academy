'use strict';
const { e } = require('../errors/AppError');
const { esFechaValida, hoyCaracas } = require('./fechas');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Validador declarativo sin dependencias. `reglas[campo]` = { tipo, requerido, max, min, valores }.
 * Tipos: texto | email | entero | decimal | fecha | fechaPasada | enum | booleano.
 * Acumula TODOS los errores y lanza un único AppError 422 VALIDACION con `detalles: [{campo, mensaje}]`.
 * Devuelve un objeto limpio SOLO con los campos declarados (descarta propiedades inesperadas).
 */
function validar(entrada, reglas) {
  const src = entrada && typeof entrada === 'object' ? entrada : {};
  const salida = {};
  const errores = [];

  for (const [campo, r] of Object.entries(reglas)) {
    let v = src[campo];
    if (typeof v === 'string') v = v.trim();
    const vacio = v === undefined || v === null || v === '';
    if (vacio) {
      if (r.requerido) errores.push({ campo, mensaje: 'Es obligatorio.' });
      else salida[campo] = r.defecto !== undefined ? r.defecto : null;
      continue;
    }
    const falla = (mensaje) => errores.push({ campo, mensaje });

    switch (r.tipo || 'texto') {
      case 'texto':
      case 'email': {
        if (typeof v !== 'string') { falla('Debe ser texto.'); break; }
        if (r.max && v.length > r.max) { falla(`Máximo ${r.max} caracteres.`); break; }
        if (r.min && v.length < r.min) { falla(`Mínimo ${r.min} caracteres.`); break; }
        if (r.tipo === 'email' && !EMAIL_RE.test(v)) { falla('Correo inválido.'); break; }
        if (r.patron && !r.patron.test(v)) { falla(r.mensajePatron || 'Formato inválido.'); break; }
        salida[campo] = r.tipo === 'email' ? v.toLowerCase() : v;
        break;
      }
      case 'entero': {
        const n = Number(v);
        if (!Number.isInteger(n)) { falla('Debe ser un entero.'); break; }
        if (r.min !== undefined && n < r.min) { falla(`Debe ser >= ${r.min}.`); break; }
        if (r.max !== undefined && n > r.max) { falla(`Debe ser <= ${r.max}.`); break; }
        salida[campo] = n;
        break;
      }
      case 'decimal': {
        const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'));
        if (!Number.isFinite(n)) { falla('Debe ser un número.'); break; }
        if (Math.round(n * 100) / 100 !== n) { falla('Máximo 2 decimales.'); break; }
        if (r.min !== undefined && n < r.min) { falla(`Debe ser >= ${r.min}.`); break; }
        if (r.max !== undefined && n > r.max) { falla(`Debe ser <= ${r.max}.`); break; }
        if (r.positivo && n <= 0) { falla('Debe ser mayor que 0.'); break; }
        salida[campo] = n;
        break;
      }
      case 'fecha':
      case 'fechaPasada': {
        if (!esFechaValida(v)) { falla('Fecha inválida (AAAA-MM-DD).'); break; }
        if (r.tipo === 'fechaPasada' && v > hoyCaracas()) { falla('No puede ser una fecha futura.'); break; }
        if (r.min && v < r.min) { falla(`Debe ser >= ${r.min}.`); break; }
        salida[campo] = v;
        break;
      }
      case 'enum': {
        if (!r.valores.includes(v)) { falla(`Valor no permitido. Opciones: ${r.valores.join(', ')}.`); break; }
        salida[campo] = v;
        break;
      }
      case 'booleano': {
        if (v === true || v === 'true' || v === '1' || v === 1) salida[campo] = true;
        else if (v === false || v === 'false' || v === '0' || v === 0) salida[campo] = false;
        else falla('Debe ser verdadero o falso.');
        break;
      }
      default:
        throw new Error(`Tipo de regla desconocido: ${r.tipo}`);
    }
  }

  if (errores.length) throw e.validacion(errores);
  return salida;
}

/** Paginación segura: página >= 1, límite 1..200. */
function paginacion(query, limiteMax = 200, limiteDefecto = 50) {
  const pagina = Math.max(1, parseInt(query.pagina, 10) || 1);
  const limite = Math.min(limiteMax, Math.max(1, parseInt(query.limite, 10) || limiteDefecto));
  return { pagina, limite, offset: (pagina - 1) * limite };
}

module.exports = { validar, paginacion };

/** Parámetro de ruta :id → entero positivo o 422. */
function idParam(valor, campo = 'id') {
  const n = Number(valor);
  if (!Number.isInteger(n) || n <= 0 || n > 2_147_483_647) throw e.validacion([{ campo, mensaje: 'Identificador inválido.' }]);
  return n;
}

module.exports.idParam = idParam;
