'use strict';
const { ejecutar } = require('../config/db');
const { e } = require('../errors/AppError');

async function obtener(clave, ejecutor) {
  const r = await ejecutar('SELECT valor FROM parametros WHERE clave = $1', [clave], ejecutor);
  return r.rows[0] ? r.rows[0].valor : null;
}

async function guardar(clave, valor, ejecutor) {
  await ejecutar(
    `INSERT INTO parametros (clave, valor) VALUES ($1, $2)
     ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor, actualizado_en = NOW()`,
    [clave, String(valor)],
    ejecutor,
  );
}

/** Matrícula inicial en USD. Mientras sea <= 0 las inscripciones se bloquean (no se inventa un precio). */
async function matriculaUsd(ejecutor) {
  const v = Number(await obtener('MATRICULA_USD', ejecutor));
  if (!Number.isFinite(v) || v <= 0) {
    throw e.noDisponible('CONFIG_INCOMPLETA', 'La matrícula inicial aún no está configurada. Contacta a la administración.');
  }
  return v;
}

async function cuentasActivas(ejecutor) {
  const r = await ejecutar('SELECT id, metodo, titular, detalle FROM cuentas_pago WHERE activa = TRUE ORDER BY metodo, id', [], ejecutor);
  return r.rows;
}

module.exports = { obtener, guardar, matriculaUsd, cuentasActivas };
