'use strict';
const { sql, ejecutar } = require('../config/db');
const { e } = require('../errors/AppError');

async function obtener(clave, ejecutor) {
  const r = await ejecutar('SELECT valor FROM dbo.parametros WHERE clave = @clave', { clave: [sql.NVarChar(60), clave] }, ejecutor);
  return r.recordset[0] ? r.recordset[0].valor : null;
}

async function guardar(clave, valor, ejecutor) {
  await ejecutar(
    `MERGE dbo.parametros AS t USING (SELECT @clave AS clave) AS s ON t.clave = s.clave
     WHEN MATCHED THEN UPDATE SET valor = @valor, actualizado_en = SYSUTCDATETIME()
     WHEN NOT MATCHED THEN INSERT (clave, valor) VALUES (@clave, @valor);`,
    { clave: [sql.NVarChar(60), clave], valor: [sql.NVarChar(300), String(valor)] },
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
  const r = await ejecutar('SELECT id, metodo, titular, detalle FROM dbo.cuentas_pago WHERE activa = 1 ORDER BY metodo, id', {}, ejecutor);
  return r.recordset;
}

module.exports = { obtener, guardar, matriculaUsd, cuentasActivas };
