'use strict';
const crypto = require('node:crypto');
const { ejecutar } = require('../config/db');
const { e } = require('../errors/AppError');
const { usdABs } = require('../utils/dinero');
const { bcv } = require('./bcv.service');
const parametros = require('./parametros.service');
const pagos = require('./pagos.service');

const DIAS_VIGENCIA = 30;
const TOKEN_RE = /^[a-f0-9]{48}$/;
const sha256 = (t) => crypto.createHash('sha256').update(t).digest('hex');

/** Genera el link único del portal privado. En la base solo se guarda el hash SHA-256; el token en claro viaja una vez en el mensaje. */
async function emitirToken(estudianteId, ejecutor) {
  const token = crypto.randomBytes(24).toString('hex');
  await ejecutar(
    `INSERT INTO portal_tokens (estudiante_id, token_hash, expira_en) VALUES ($1, $2, NOW() + make_interval(days => $3::int))`,
    [estudianteId, sha256(token), DIAS_VIGENCIA], ejecutor);
  return token;
}

async function resolverToken(token) {
  if (!TOKEN_RE.test(String(token))) throw e.noEncontrado('El enlace');
  const r = await ejecutar(
    `SELECT t.estudiante_id, v.nombres, v.apellidos, v.estado_dinamico, v.estatus_pago
     FROM portal_tokens t JOIN vw_estudiantes_estado v ON v.id = t.estudiante_id
     WHERE t.token_hash = $1 AND t.expira_en > NOW()`, [sha256(token)]);
  // Mismo mensaje para "no existe" y "vencido": no se revela cuáles tokens existieron.
  if (!r.rowCount) throw e.noEncontrado('El enlace');
  return r.rows[0];
}

async function vista(token, { bcvSvc = bcv } = {}) {
  const est = await resolverToken(token);
  const [tasa, cuentas, cuotas] = await Promise.all([
    bcvSvc.obtenerTasa(),
    parametros.cuentasActivas(),
    ejecutar(
      `SELECT id, concepto, monto_usd, fecha_vencimiento, estado
       FROM cuotas WHERE estudiante_id = $1 AND estado IN ('Pendiente', 'En Revisión') ORDER BY fecha_vencimiento, id`,
      [est.estudiante_id]),
  ]);
  return {
    estudiante: `${est.nombres} ${est.apellidos}`,
    estado: est.estado_dinamico,
    estatus_pago: est.estatus_pago,
    tasa_bcv: tasa.tasa,
    tasa_desactualizada: tasa.desactualizada,
    cuentas,
    cuotas: cuotas.rows.map((c) => ({ ...c, monto_usd: Number(c.monto_usd), monto_bs: usdABs(c.monto_usd, tasa.tasa) })),
  };
}

async function declarar(token, { cuota_id, referencia, metodo_pago }, { bcvSvc = bcv } = {}) {
  const est = await resolverToken(token);
  const tasa = await bcvSvc.obtenerTasa();
  const r = await pagos.declararReferencia({ estudianteId: est.estudiante_id, cuotaId: cuota_id, referencia, metodo: metodo_pago, tasa: tasa.tasa });
  return { pago_id: r.pagoId, estado: 'Por Validar', monto_usd: r.montoUsd, monto_bs: r.montoBs, tasa_bcv: tasa.tasa };
}

module.exports = { emitirToken, resolverToken, vista, declarar };
