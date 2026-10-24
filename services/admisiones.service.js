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
 * Si Drive falla, TODO se revierte (no quedan estudiantes sin expediente). Si la transacción falla después de subir a Drive
 * (error en una consulta posterior o en el COMMIT), la carpeta se envía a la papelera (compensación) para no dejar huérfanos.
 */
async function registrarInscripcion({ datos, archivos }, { bcvSvc = bcv, driveSvc = drive } = {}) {
  const tasa = await bcvSvc.obtenerTasa();
  const matricula = await parametros.matriculaUsd();
  let carpetaCreada = null;
  let estudianteIdCreado = null;
  let resultado = null;
  let callbackTerminado = false; // true = solo faltaba el COMMIT: si algo falla ya, el resultado en la base es ambiguo

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
      estudianteIdCreado = estudianteId;

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

      resultado = {
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
      callbackTerminado = true;
      return resultado;
    });
  } catch (err) {
    if (!carpetaCreada) throw err; // nada que compensar en Drive (la subida se limpia a sí misma si falla)

    // Falla DENTRO de la transacción (consulta, duplicado, cuota…): el ROLLBACK es seguro → la carpeta no tiene dueño.
    // Falla en el COMMIT: el servidor pudo haber confirmado antes de caerse la conexión. No se destruye un expediente
    // cuyo estudiante sí quedó inscrito: primero se verifica en la base.
    if (callbackTerminado) {
      const persistida = await inscripcionPersistida(estudianteIdCreado, carpetaCreada);
      if (persistida === true) {
        console.error(`[admisiones] El COMMIT reportó error pero la inscripción ${estudianteIdCreado} sí quedó registrada; se conserva su carpeta.`);
        return resultado;
      }
      if (persistida === null) {
        console.error(`[admisiones] REVISIÓN MANUAL: no se pudo confirmar si la inscripción ${estudianteIdCreado} se guardó; se conserva la carpeta Drive ${carpetaCreada}.`);
        throw err;
      }
    }
    await compensarDrive(driveSvc, carpetaCreada);
    throw err;
  }
}

/** ¿Quedó el estudiante enlazado a esa carpeta? true/false, o null si la base no pudo responder (estado desconocido). */
async function inscripcionPersistida(estudianteId, carpetaId) {
  try {
    const r = await ejecutar('SELECT 1 FROM estudiantes WHERE id = $1 AND drive_folder_id = $2', [estudianteId, carpetaId]);
    return r.rowCount > 0;
  } catch (err) {
    console.error('[admisiones] No se pudo verificar la inscripción tras el fallo del COMMIT:', err.message);
    return null;
  }
}

/** Compensación en Drive. Nunca lanza: un fallo aquí no puede tapar el error original que recibe el cliente (JSON de errorHandler). */
async function compensarDrive(driveSvc, carpetaId) {
  try {
    const limpia = await driveSvc.eliminarCarpeta(carpetaId);
    if (limpia === false) console.error(`[admisiones] CARPETA HUÉRFANA en Drive; requiere limpieza manual: ${carpetaId}`);
  } catch (errLimpieza) {
    console.error(`[admisiones] La compensación en Drive falló (carpeta ${carpetaId}):`, errLimpieza.message);
  }
}

module.exports = { configPublica, registrarInscripcion };
