'use strict';
const { ejecutar, conTransaccion } = require('../config/db');
const { e } = require('../errors/AppError');
const { hoyCaracas, aFechaSql } = require('../utils/fechas');
const { usdABs } = require('../utils/dinero');
const { bcv } = require('./bcv.service');
const { drive } = require('./drive.service');
const parametros = require('./parametros.service');
const pagos = require('./pagos.service');

/** Datos que necesita el formulario público: costo en USD y Bs. a la tasa BCV del día + cuentas de la academia. */
async function configPublica({ bcvSvc = bcv } = {}) {
  const [matricula, tasa, cuentas] = await Promise.all([parametros.matriculaUsd(), bcvSvc.obtenerTasa(), parametros.cuentasActivas()]);
  return {
    matricula_usd: matricula,
    tasa_bcv: tasa.tasa,
    tasa_desactualizada: tasa.desactualizada,
    matricula_bs: usdABs(matricula, tasa.tasa),
    cuentas,
  };
}

/**
 * Inscripción completa en UNA transacción:
 *   1) representante (upsert por cédula) → 2) estudiante "Pendiente por Validación Administrativa"
 *   3) cuota de matrícula + referencia bancaria "Por Validar" a la tasa BCV del momento
 *   4) carpeta 'Nombre_Apellido_ID' en Drive con los 3 documentos → 5) COMMIT.
 * Si Drive falla, TODO se revierte (no quedan estudiantes sin expediente). Si el COMMIT fallara después de subir a Drive,
 * la carpeta se envía a la papelera (compensación).
 */
async function registrarInscripcion({ datos, archivos }, { bcvSvc = bcv, driveSvc = drive } = {}) {
  const tasa = await bcvSvc.obtenerTasa();
  const matricula = await parametros.matriculaUsd();
  let carpetaCreada = null;

  try {
    return await conTransaccion(async (tx) => {
      // Upsert atómico por cédula (UNIQUE): sin ventana de carrera entre SELECT e INSERT. El correo existente no se borra si llega vacío.
      const rep = await ejecutar(
        `INSERT INTO representantes (nombres, apellidos, cedula, email, telefono)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (cedula) DO UPDATE
            SET nombres = EXCLUDED.nombres, apellidos = EXCLUDED.apellidos,
                email = COALESCE(EXCLUDED.email, representantes.email), telefono = EXCLUDED.telefono
         RETURNING id`,
        // La cédula se guarda en mayúsculas: PostgreSQL distingue "v-123" de "V-123" y duplicaría al representante.
        [datos.representante_nombres, datos.representante_apellidos, datos.representante_cedula.toUpperCase(), datos.representante_email, datos.telefono],
        tx);
      const representanteId = rep.rows[0].id;

      const est = await ejecutar(
        `INSERT INTO estudiantes
           (representante_id, nombres, apellidos, cedula_identidad, fecha_nacimiento, grado_solicitado, colegio_procedencia, ultimo_grado_aprobado,
            tipo_sangre, alergias, condiciones_medicas, medicamentos, emergencia_nombre, emergencia_telefono)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         RETURNING id`,
        [
          representanteId, datos.alumno_nombres, datos.alumno_apellidos, datos.alumno_cedula ? datos.alumno_cedula.toUpperCase() : null,
          aFechaSql(datos.alumno_fecha_nacimiento), datos.grado_solicitado, datos.colegio_procedencia, datos.ultimo_grado_aprobado,
          datos.tipo_sangre, datos.alergias, datos.condiciones_medicas, datos.medicamentos, datos.emergencia_nombre, datos.emergencia_telefono,
        ], tx);
      const estudianteId = est.rows[0].id;

      const cuota = await ejecutar(
        `INSERT INTO cuotas (estudiante_id, tipo, concepto, monto_usd, fecha_vencimiento)
         VALUES ($1, 'MATRICULA', 'Matrícula inicial', $2, $3)
         RETURNING id`,
        [estudianteId, matricula, aFechaSql(hoyCaracas())], tx);
      const cuotaId = cuota.rows[0].id;

      const pago = await pagos.declararReferencia({
        estudianteId, cuotaId, referencia: datos.referencia_bancaria, metodo: datos.metodo_pago, tasa: tasa.tasa,
      }, tx);

      const expediente = await driveSvc.subirExpediente({
        estudianteId, nombres: datos.alumno_nombres, apellidos: datos.alumno_apellidos, archivos,
      });
      carpetaCreada = expediente.carpetaId;

      await ejecutar(
        'UPDATE estudiantes SET drive_folder_id = $2, drive_folder_url = $3 WHERE id = $1',
        [estudianteId, expediente.carpetaId, expediente.carpetaUrl], tx);
      for (const d of expediente.documentos) {
        await ejecutar(
          `INSERT INTO documentos_estudiante (estudiante_id, tipo, nombre_archivo, mime_type, tamano_bytes, drive_file_id, drive_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [estudianteId, d.tipo, d.nombre, d.mime, d.bytes, d.fileId, d.url], tx);
      }

      return {
        estudiante_id: estudianteId,
        estatus: 'Pendiente por Validación Administrativa',
        carpeta_drive: expediente.carpetaUrl,
        referencia: datos.referencia_bancaria,
        metodo_pago: datos.metodo_pago,
        monto_usd: matricula,
        monto_bs: pago.montoBs,
        tasa_bcv: tasa.tasa,
        tasa_desactualizada: tasa.desactualizada,
      };
    });
  } catch (err) {
    // Compensación: si la transacción falló DESPUÉS de crear la carpeta (p. ej. error en el COMMIT), no dejar huérfanos.
    if (carpetaCreada) await driveSvc.eliminarCarpeta(carpetaCreada);
    throw err;
  }
}

module.exports = { configPublica, registrarInscripcion };
