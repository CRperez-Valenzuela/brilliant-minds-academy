'use strict';
const { sql, ejecutar, conTransaccion } = require('../config/db');
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
      const rep = await ejecutar(
        `MERGE dbo.representantes WITH (HOLDLOCK) AS t
         USING (SELECT @cedula AS cedula) AS s ON t.cedula = s.cedula
         WHEN MATCHED THEN UPDATE SET nombres = @nombres, apellidos = @apellidos, email = @email, telefono = @telefono
         WHEN NOT MATCHED THEN INSERT (nombres, apellidos, cedula, email, telefono) VALUES (@nombres, @apellidos, @cedula, @email, @telefono)
         OUTPUT inserted.id;`,
        {
          cedula: [sql.NVarChar(20), datos.representante_cedula], nombres: [sql.NVarChar(100), datos.representante_nombres],
          apellidos: [sql.NVarChar(100), datos.representante_apellidos], email: [sql.NVarChar(160), datos.representante_email],
          telefono: [sql.NVarChar(20), datos.telefono],
        }, tx);
      const representanteId = rep.recordset[0].id;

      const est = await ejecutar(
        `INSERT INTO dbo.estudiantes
           (representante_id, nombres, apellidos, cedula_identidad, fecha_nacimiento, grado_solicitado, colegio_procedencia, ultimo_grado_aprobado,
            tipo_sangre, alergias, condiciones_medicas, medicamentos, emergencia_nombre, emergencia_telefono)
         OUTPUT inserted.id
         VALUES (@rep, @nombres, @apellidos, @cedula, @nac, @grado, @colegio, @ultimo, @sangre, @alergias, @condiciones, @medicamentos, @emNombre, @emTel)`,
        {
          rep: [sql.Int, representanteId], nombres: [sql.NVarChar(100), datos.alumno_nombres], apellidos: [sql.NVarChar(100), datos.alumno_apellidos],
          cedula: [sql.NVarChar(20), datos.alumno_cedula], nac: [sql.Date, aFechaSql(datos.alumno_fecha_nacimiento)],
          grado: [sql.NVarChar(60), datos.grado_solicitado], colegio: [sql.NVarChar(150), datos.colegio_procedencia],
          ultimo: [sql.NVarChar(60), datos.ultimo_grado_aprobado], sangre: [sql.NVarChar(5), datos.tipo_sangre],
          alergias: [sql.NVarChar(500), datos.alergias], condiciones: [sql.NVarChar(500), datos.condiciones_medicas],
          medicamentos: [sql.NVarChar(500), datos.medicamentos], emNombre: [sql.NVarChar(150), datos.emergencia_nombre],
          emTel: [sql.NVarChar(20), datos.emergencia_telefono],
        }, tx);
      const estudianteId = est.recordset[0].id;

      const cuota = await ejecutar(
        `INSERT INTO dbo.cuotas (estudiante_id, tipo, concepto, monto_usd, fecha_vencimiento)
         OUTPUT inserted.id
         VALUES (@est, N'MATRICULA', N'Matrícula inicial', @monto, @hoy)`,
        { est: [sql.Int, estudianteId], monto: [sql.Decimal(10, 2), matricula], hoy: [sql.Date, aFechaSql(hoyCaracas())] }, tx);
      const cuotaId = cuota.recordset[0].id;

      const pago = await pagos.declararReferencia({
        estudianteId, cuotaId, referencia: datos.referencia_bancaria, metodo: datos.metodo_pago, tasa: tasa.tasa,
      }, tx);

      const expediente = await driveSvc.subirExpediente({
        estudianteId, nombres: datos.alumno_nombres, apellidos: datos.alumno_apellidos, archivos,
      });
      carpetaCreada = expediente.carpetaId;

      await ejecutar(
        `UPDATE dbo.estudiantes SET drive_folder_id = @fid, drive_folder_url = @furl WHERE id = @id`,
        { id: [sql.Int, estudianteId], fid: [sql.NVarChar(100), expediente.carpetaId], furl: [sql.NVarChar(300), expediente.carpetaUrl] }, tx);
      for (const d of expediente.documentos) {
        await ejecutar(
          `INSERT INTO dbo.documentos_estudiante (estudiante_id, tipo, nombre_archivo, mime_type, tamano_bytes, drive_file_id, drive_url)
           VALUES (@est, @tipo, @nombre, @mime, @bytes, @fid, @url)`,
          {
            est: [sql.Int, estudianteId], tipo: [sql.NVarChar(20), d.tipo], nombre: [sql.NVarChar(200), d.nombre], mime: [sql.NVarChar(100), d.mime],
            bytes: [sql.Int, d.bytes], fid: [sql.NVarChar(100), d.fileId], url: [sql.NVarChar(300), d.url],
          }, tx);
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
