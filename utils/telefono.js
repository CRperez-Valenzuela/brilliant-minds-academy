'use strict';
const { e } = require('../errors/AppError');

/**
 * Unifica cualquier cantidad de fragmentos de un teléfono en UNA sola cadena de dígitos, sin espacios
 * ni separadores (formato internacional que WhatsApp exige, sin "+").
 *   sanitizarTelefono('+58', '414 123-4567')  → '584141234567'
 *   sanitizarTelefono('0414 123 4567')        → '584141234567'   (0 inicial de 11 dígitos → Venezuela)
 * Lanza AppError 422 si el resultado no tiene entre 10 y 15 dígitos (E.164).
 */
function sanitizarTelefono(...partes) {
  const crudo = partes.filter((p) => p !== undefined && p !== null).map(String).join('');
  let d = crudo.replace(/\D+/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.length === 11 && d.startsWith('0')) d = `58${d.slice(1)}`;
  if (/^580\d{10}$/.test(d)) d = `58${d.slice(3)}`; // '+58' + '0414…' → quita el 0 de troncal duplicado
  if (d.length < 10 || d.length > 15) {
    throw e.validacion([{ campo: 'telefono', mensaje: 'El teléfono debe tener entre 10 y 15 dígitos (incluye el código de país).' }]);
  }
  return d;
}

module.exports = { sanitizarTelefono };
