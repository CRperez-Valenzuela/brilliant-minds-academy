'use strict';
const { ejecutar } = require('../../config/db');
const { e } = require('../../errors/AppError');

/** Duración de la prueba premium: 15 días continuos desde la activación. */
const DIAS_PRUEBA = 15;

/**
 * Activa la prueba de UN módulo. Es una sola sentencia atómica (sin SELECT previo): dos administradores que pulsen a la
 * vez no pueden iniciar dos pruebas ni extender una existente. Solo procede si el módulo está bloqueado y nunca consumió su
 * prueba; si no, se diagnostica el motivo para responder con un 404/409 claro:
 *   - MODULO_YA_HABILITADO : ya está contratado o con una prueba vigente.
 *   - PRUEBA_YA_UTILIZADA  : la prueba de 15 días ya se usó (para seguir hay que contratar el módulo).
 */
async function activarPrueba({ codigo }) {
  const r = await ejecutar(
    `UPDATE modulos_premium
        SET habilitado = TRUE, habilitado_en = NOW(), prueba_iniciada_en = NOW(),
            expira_prueba_en = NOW() + ($2::int * INTERVAL '1 day'), actualizado_en = NOW()
      WHERE codigo = $1 AND habilitado = FALSE AND prueba_iniciada_en IS NULL
      RETURNING codigo, nombre, habilitado_en, prueba_iniciada_en, expira_prueba_en`,
    [codigo, DIAS_PRUEBA]);

  if (r.rowCount) {
    const m = r.rows[0];
    return {
      modulo: m.codigo, nombre: m.nombre, habilitado: true, en_prueba: true, dias_prueba: DIAS_PRUEBA,
      iniciada_en: m.prueba_iniciada_en, expira_prueba_en: m.expira_prueba_en,
    };
  }

  const f = await ejecutar('SELECT nombre, habilitado, prueba_iniciada_en, expira_prueba_en FROM modulos_premium WHERE codigo = $1', [codigo]);
  if (!f.rowCount) throw e.noEncontrado('El módulo premium');
  const m = f.rows[0];
  const vencida = m.habilitado && m.expira_prueba_en && new Date(m.expira_prueba_en).getTime() <= Date.now();
  if (m.habilitado && !vencida) {
    throw e.conflicto('MODULO_YA_HABILITADO',
      m.expira_prueba_en ? 'El módulo ya tiene una prueba vigente.' : 'El módulo ya está habilitado de forma permanente.',
      { modulo: codigo, en_prueba: Boolean(m.expira_prueba_en), expira_prueba_en: m.expira_prueba_en || null });
  }
  throw e.conflicto('PRUEBA_YA_UTILIZADA', 'La prueba gratuita de 15 días de este módulo ya fue utilizada. Contrata el módulo para continuar.', { modulo: codigo });
}

module.exports = { activarPrueba, DIAS_PRUEBA };
