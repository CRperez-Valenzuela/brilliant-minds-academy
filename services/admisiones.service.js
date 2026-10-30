'use strict';
const { ejecutar, conTransaccion } = require('../config/db');
const { e } = require('../errors/AppError');
const { hoyCaracas, aFechaSql } = require('../utils/fechas');
const { usdABs } = require('../utils/dinero');
const { bcv } = require('./bcv.service');
const { drive } = require('./drive.service');
const parametros = require('./parametros.service');
const pagos = require('./pagos.service');
const invitaciones = require('./invitaciones.service');

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
 * Configuración del formulario para un enlace de invitación: nivel BLINDADO (`nivel_asignado`), sede y las cuentas de cobro de ESA sede.
 * El token se valida en cada llamada (un solo uso, vigencia, sede activa); la respuesta no incluye datos de otras sedes.
 */
async function configInvitacion(token, { bcvSvc = bcv } = {}) {
  const inv = await invitaciones.resolver(token);
  const [matricula, tasa, cuentas] = await Promise.all([parametros.matriculaUsd(), bcvSvc.obtenerTasa(), parametros.cuentasActivas(undefined, inv.sede_id)]);
  return {
    sede: { id: inv.sede_id, nombre: inv.sede },
    nivel_asignado: inv.nivel_asignado,
    matricula_usd: matricula,
    tasa_bcv: tasa.tasa,
    tasa_desactualizada: tasa.desactualizada,
    matricula_bs: usdABs(matricula, tasa.tasa),
    cuentas,
  };
}

/**
 * Inscripción completa en UNA transacción:
 *   1) representante (upsert por cédula; si ya existía, sus datos de contacto NO se sobrescriben: ver el comentario del upsert) → 2) estudiante "Pendiente por Validación Administrativa"
 *   3) cuota de matrícula + referencia bancaria "Por Validar" a la tasa BCV del momento
 *   4) carpeta 'Nombre_Apellido_ID' en Drive con los 3 documentos → 5) COMMIT.
 * Con `invitacion` ({ id, sede_id, nivel_asignado } ya resuelta por el controlador) el SERVIDOR impone el nivel y la sede (se ignora el
 * grado enviado por el cliente) y consume el enlace de forma atómica en esta misma transacción.
 * Si Drive falla, TODO se revierte (no quedan estudiantes sin expediente). Si la transacción falla después de subir a Drive
 * (error en una consulta posterior o en el COMMIT), la carpeta se envía a la papelera (compensación) para no dejar huérfanos.
 */
async function registrarInscripcion({ datos, archivos, invitacion = null }, { bcvSvc = bcv, driveSvc = drive } = {}) {
  const gradoSolicitado = invitacion ? invitacion.nivel_asignado : datos.grado_solicitado;
  const sedeId = invitacion ? invitacion.sede_id : null;
  const tasa = await bcvSvc.obtenerTasa();
  const matricula = await parametros.matriculaUsd();
  let carpetaCreada = null;
  let estudianteIdCreado = null;
  let resultado = null;
  let callbackTerminado = false; // true = solo faltaba el COMMIT: si algo falla ya, el resultado en la base es ambiguo
  let representanteConTelefonoEnRevision = null; // id del representante cuyo teléfono nuevo quedó retenido (se avisa tras el COMMIT)

  try {
    const confirmada = await conTransaccion(async (tx) => {
      // El enlace se consume PRIMERO: si otro envío lo usó entre tanto, falla aquí (410) antes de tocar Drive ni crear nada.
      if (invitacion) await invitaciones.consumir(tx, invitacion.id);

      // Upsert atómico por cédula (UNIQUE): sin ventana de carrera entre SELECT e INSERT.
      // Blindaje anti-suplantación (H2): el formulario es PÚBLICO, así que si la cédula ya existe NO puede reescribir sus datos de
      // contacto. El correo guardado manda (solo se rellena si estaba vacío) y un teléfono distinto NO se aplica: queda en
      // `telefono_pendiente` hasta que la administración lo apruebe, porque a `telefono` llegan los enlaces privados del portal.
      const rep = await ejecutar(
        `INSERT INTO representantes (nombres, apellidos, cedula, email, telefono)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (cedula) DO UPDATE
            SET nombres = EXCLUDED.nombres, apellidos = EXCLUDED.apellidos,
                email = COALESCE(representantes.email, EXCLUDED.email),
                telefono_pendiente = CASE WHEN representantes.telefono IS DISTINCT FROM EXCLUDED.telefono
                                          THEN EXCLUDED.telefono ELSE representantes.telefono_pendiente END,
                telefono_pendiente_en = CASE WHEN representantes.telefono IS DISTINCT FROM EXCLUDED.telefono
                                             THEN NOW() ELSE representantes.telefono_pendiente_en END
         RETURNING id, (telefono_pendiente IS NOT NULL) AS telefono_en_revision`,
        // La cédula se guarda en mayúsculas: PostgreSQL distingue "v-123" de "V-123" y duplicaría al representante.
        [datos.representante_nombres, datos.representante_apellidos, datos.representante_cedula.toUpperCase(), datos.representante_email, datos.telefono],
        tx);
      const representanteId = rep.rows[0].id;
      if (rep.rows[0].telefono_en_revision === true) representanteConTelefonoEnRevision = representanteId;

      const est = await ejecutar(
        `INSERT INTO estudiantes
           (representante_id, nombres, apellidos, cedula_identidad, fecha_nacimiento, grado_solicitado, colegio_procedencia, ultimo_grado_aprobado,
            tipo_sangre, alergias, condiciones_medicas, medicamentos, emergencia_nombre, emergencia_telefono, sede_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         RETURNING id`,
        [
          representanteId, datos.alumno_nombres, datos.alumno_apellidos, datos.alumno_cedula ? datos.alumno_cedula.toUpperCase() : null,
          aFechaSql(datos.alumno_fecha_nacimiento), gradoSolicitado, datos.colegio_procedencia, datos.ultimo_grado_aprobado,
          datos.tipo_sangre, datos.alergias, datos.condiciones_medicas, datos.medicamentos, datos.emergencia_nombre, datos.emergencia_telefono,
          sedeId,
        ], tx);
      const estudianteId = est.rows[0].id;
      estudianteIdCreado = estudianteId;
      if (invitacion) await invitaciones.vincularEstudiante(tx, invitacion.id, estudianteId);

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
        sede_id: sedeId,
        grado_solicitado: gradoSolicitado,
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
    // Solo tras el COMMIT: si la transacción se hubiera revertido, este aviso afirmaría algo que no quedó guardado.
    // Va únicamente al log del servidor (con ids, sin teléfonos): la respuesta pública NO revela que la cédula ya existía.
    if (representanteConTelefonoEnRevision !== null) {
      console.warn(`[admisiones] Representante ${representanteConTelefonoEnRevision}: el formulario trajo un teléfono distinto; se conserva el verificado y el nuevo queda PENDIENTE de aprobación (estudiante ${estudianteIdCreado}).`);
    }
    return confirmada;
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

module.exports = { configPublica, configInvitacion, registrarInscripcion };
