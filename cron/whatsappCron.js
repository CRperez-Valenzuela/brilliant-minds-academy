'use strict';
/**
 * Bot de envío masivo automático — módulo premium WHATSAPP_AUTOMATICO.
 *
 * Una vez al día (hora de Caracas, WHATSAPP_CRON_HORA) el bot se despierta, mira el calendario y —solo si hoy toca— barre la base (sede por sede, y al final los estudiantes sin sede) y despacha por la API de WhatsApp, de forma SECUENCIAL
 * y con una pausa de 1,5 s entre envíos (anti-baneo de Meta).
 *
 * «Regla de los 10 días» (utils/calendario-cobranza.js): la mensualidad se paga SOLO del día 1 al 10 de cada mes.
 *   1) PREVENTIVA : 1 o 2 días antes del inicio del mes entrante (los dos últimos días del mes). Estudiantes Activos con una cuota
 *                   Pendiente que vence en la ventana de pago del mes que llega (días 1–10); el mensaje lleva el enlace seguro con token del portal.
 *   2) MOROSIDAD  : a partir del día 11. Estudiantes Morosos con cuotas vencidas en estado 'Pendiente' (las que ya tienen una referencia
 *                   'En Revisión' no se cobran de nuevo). Durante los días 1–10 no se declara ni se cobra mora.
 *   Los demás días el ciclo termina enseguida como 'OMITIDO' (FUERA_DE_CALENDARIO_COBRANZA) sin tocar la base: es seguro lanzarlo a diario.
 * Cada alerta pasa por notificaciones.generarAlerta({ enviar: true }): la misma lógica ya probada del envío manual (tasa BCV, enlace
 * del portal, plantilla; la preventiva se valida en modo MES_ENTRANTE) que deja la fila en notificaciones_whatsapp como ENVIADA o FALLIDA.
 *
 * Garantías del ciclo:
 *   - Candado premium: si el módulo no está habilitado (o su prueba de 15 días venció) el ciclo no envía nada.
 *   - Idempotente: una PREVENTIVA se envía una sola vez por cuota (los dos días de su ventana sirven de reintento si algo falló el primero);
 *     la MOROSIDAD no se repite al mismo estudiante antes de WHATSAPP_CRON_MOROSIDAD_CADA_DIAS (7). Relanzar el ciclo el mismo día no duplica mensajes.
 *   - Sin duplicados por caídas (H4): una fila 'GENERADA' creada por el bot (creado_por NULL) se trata como «en vuelo». Si el
 *     proceso murió (o falló el UPDATE a 'ENVIADA') después de llamar a Meta, esa fila bloquea el reenvío en vez de duplicarlo.
 *     Las 'GENERADA' creadas por un usuario del panel (borradores para enviar a mano) NO bloquean.
 *   - Un solo ciclo a la vez entre instancias: arrendamiento (lease) en la tabla `parametros`; funciona detrás del pooler
 *     de Supabase en modo transacción (no usa locks de sesión) y caduca solo si el proceso muere. Si el proceso se congela y otra
 *     instancia toma el lease, la renovación lo detecta (rowCount) y este ciclo se aborta con 'LEASE_PERDIDO' (H3).
 *   - Cortafuegos con clasificación de fallas de Meta (H1):
 *       · del DESTINATARIO (131026 no entregable, 131047 fuera de ventana…): la fila queda 'FALLIDA' en el histórico, el ciclo
 *         sigue y NO suma a `fallosSeguidos` (un padre sin WhatsApp no es una avería);
 *       · SISTÉMICAS (190 token vencido, 132001 plantilla inexistente, tasa BCV caída, WhatsApp sin configurar…): se aborta ya;
 *       · desconocidas / de red: cuentan para WHATSAPP_CRON_MAX_FALLOS_SEGUIDOS (comportamiento conservador previo).
 *     Además se limita a WHATSAPP_CRON_MAX_ENVIOS por ciclo.
 *   - Enfriamiento por estudiante: no se reintenta a quien acumule >= 3 'FALLIDA' del mismo tipo en los últimos 7 días.
 *   - La tasa BCV se consulta fresca como mucho una vez por minuto durante el ciclo (no una vez por mensaje).
 *
 * Uso:
 *   - Dentro del servidor: server.js llama a `cron.iniciar()` si WHATSAPP_CRON_ACTIVO=true (por defecto, solo en producción).
 *   - Un solo ciclo (cron del sistema, Render/Railway cron job, GitHub Actions):  npm run cron:whatsapp
 *   - Proceso independiente con su propio planificador:                          npm run cron:whatsapp:daemon
 */
const os = require('node:os');
const cfg = require('../config/env');
const { ejecutar, closePool } = require('../config/db');
const { hoyCaracas, aFechaSql } = require('../utils/fechas');
const { calendarioCobranza } = require('../utils/calendario-cobranza');
const { guard: guardGlobal } = require('../modules/premium/guard');
const notificacionesGlobal = require('../services/notificaciones.service');
const { bcv: bcvGlobal } = require('../services/bcv.service');
const { whatsapp: whatsappGlobal, CLASE_FALLA } = require('../services/whatsapp.service');

const MODULO = 'WHATSAPP_AUTOMATICO';
// Constante del servicio real (no de la instancia inyectada): los dobles de prueba solo sustituyen el envío, no esta regla.
const { MODO_PREVENTIVA } = notificacionesGlobal;
const CLAVE_LEASE = 'WHATSAPP_CRON_LEASE';
const OFFSET_CARACAS_MS = 4 * 3600_000;
const MS_DIA = 86_400_000;
const REFRESCO_TASA_MS = 60_000;
const RENOVAR_LEASE_CADA = 25;
// Enfriamiento por estudiante: con `maxFallidas` filas 'FALLIDA' del mismo tipo dentro de los últimos `dias` días no se reintenta.
const ENFRIAMIENTO = Object.freeze({ dias: 7, maxFallidas: 3 });

// Errores de reglas de negocio: el estado del estudiante cambió entre la consulta masiva y el envío → se omite sin contar como fallo.
const CODIGOS_OMITIR = new Set(['ESTADO_NO_APLICA', 'SIN_CUOTA_PROXIMA', 'FUERA_DE_VENTANA_PREVENTIVA', 'ESTUDIANTE_NO_MOROSO', 'PAGO_EN_REVISION', 'NO_ENCONTRADO']);
// Motivo con el que el ciclo se omite cuando hoy no es día de preventiva (1–2 días antes del mes entrante) ni de morosidad (desde el día 11).
const MOTIVO_FUERA_DE_CALENDARIO = 'FUERA_DE_CALENDARIO_COBRANZA';
// Fallas sistémicas: reintentar con el siguiente estudiante fallaría igual → se corta el ciclo.
const CODIGOS_ABORTAR = new Set(['TASA_BCV_DESACTUALIZADA', 'TASA_BCV_NO_DISPONIBLE', 'WHATSAPP_NO_CONFIGURADO']);

const esperarReal = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

// ───────────────────────── Consultas masivas (PostgreSQL, parámetros posicionales) ─────────────────────────

/**
 * Activos con una cuota Pendiente que vence dentro de la ventana de pago del mes entrante [$2, $3] (días 1 a 10) y sin PREVENTIVA ya enviada
 * para esa cuota. Por estudiante se toma la de menor vencimiento dentro de la ventana, igual que notificaciones.prepararPreventivaMesEntrante.
 * `$1` (hoy) se conserva como guarda: jamás se avisa de un vencimiento ya pasado.
 *   · «Ya enviada» incluye la fila 'GENERADA' creada por el bot ($10, creado_por NULL): está «en vuelo» o quedó huérfana tras una caída
 *     entre la llamada a Meta y el UPDATE a 'ENVIADA'; reenviar duplicaría el mensaje (H4). Los borradores 'GENERADA' del panel no cuentan.
 *   · Enfriamiento: se excluye al estudiante con >= $13 filas $11 ('FALLIDA') de este tipo en los últimos $12 días (H1).
 */
const SQL_CANDIDATOS_PREVENTIVA = `
  SELECT p.estudiante_id, p.cuota_id, p.fecha_vencimiento
    FROM (
      SELECT DISTINCT ON (c.estudiante_id) c.estudiante_id, c.id AS cuota_id, c.fecha_vencimiento
        FROM cuotas c
        JOIN vw_estudiantes_estado v ON v.id = c.estudiante_id
       WHERE c.estado = $5::text AND c.fecha_vencimiento >= $1::date AND c.fecha_vencimiento BETWEEN $2::date AND $3::date
         AND v.estado_dinamico = $6::text
         AND (($9::int IS NOT NULL AND v.sede_id = $9::int) OR ($9::int IS NULL AND v.sede_id IS NULL))
       ORDER BY c.estudiante_id, c.fecha_vencimiento, c.id
    ) p
   WHERE NOT EXISTS (SELECT 1 FROM notificaciones_whatsapp n
                      WHERE n.cuota_id = p.cuota_id AND n.tipo = $7::text
                        AND (n.estado = $8::text OR (n.estado = $10::text AND n.creado_por IS NULL)))
     AND (SELECT COUNT(*) FROM notificaciones_whatsapp f
           WHERE f.estudiante_id = p.estudiante_id AND f.tipo = $7::text AND f.estado = $11::text
             AND f.creado_en > NOW() - ($12::int * INTERVAL '1 day')) < $13::int
   ORDER BY p.fecha_vencimiento, p.estudiante_id
   LIMIT $4::int`;

/**
 * Morosos con al menos una cuota vencida en estado Pendiente (si todas están En Revisión no aparecen) y sin cobro ENVIADO
 * dentro de los últimos N días. Solo se consulta a partir del día 11 de cada mes (ejecutarCiclo): la ventana de pago (días 1–10) no genera mora. Igual que en la preventiva: la 'GENERADA' del bot ($9) cuenta como cobro en vuelo dentro de esa misma
 * ventana (H4) y el estudiante con >= $12 'FALLIDA' ($10) de MOROSIDAD en los últimos $11 días queda en enfriamiento (H1).
 */
const SQL_CANDIDATOS_MOROSIDAD = `
  SELECT v.id AS estudiante_id, MIN(c.fecha_vencimiento) AS vencida_desde
    FROM vw_estudiantes_estado v
    JOIN cuotas c ON c.estudiante_id = v.id AND c.estado = $4::text AND c.fecha_vencimiento < $1::date
   WHERE v.estado_dinamico = $5::text
     AND (($8::int IS NOT NULL AND v.sede_id = $8::int) OR ($8::int IS NULL AND v.sede_id IS NULL))
     AND NOT EXISTS (SELECT 1 FROM notificaciones_whatsapp n
                      WHERE n.estudiante_id = v.id AND n.tipo = $6::text
                        AND (n.estado = $7::text OR (n.estado = $9::text AND n.creado_por IS NULL))
                        AND n.creado_en > NOW() - ($2::int * INTERVAL '1 day'))
     AND (SELECT COUNT(*) FROM notificaciones_whatsapp f
           WHERE f.estudiante_id = v.id AND f.tipo = $6::text AND f.estado = $10::text
             AND f.creado_en > NOW() - ($11::int * INTERVAL '1 day')) < $12::int
   GROUP BY v.id
   ORDER BY MIN(c.fecha_vencimiento), v.id
   LIMIT $3::int`;

/**
 * `ventana` = { desde, hasta } ('YYYY-MM-DD'): la ventana de pago del mes entrante (ver calendarioCobranza). Solo tiene sentido llamarla
 * los días de preventiva; la comprobación del calendario la hace ejecutarCiclo().
 * `sedeId` entero → solo los estudiantes de esa sede; `null` → solo los que NO tienen sede asignada (datos anteriores a la
 * migración multi-sede). Cada sede se procesa por separado: ver ejecutarCiclo().
 */
async function candidatosPreventiva({ hoy, ventana, limite, sedeId = null, enfriamiento = ENFRIAMIENTO, db = { ejecutar } }) {
  const r = await db.ejecutar(SQL_CANDIDATOS_PREVENTIVA, [
    aFechaSql(hoy), aFechaSql(ventana.desde), aFechaSql(ventana.hasta), limite, 'Pendiente', 'Activo', 'PREVENTIVA', 'ENVIADA', sedeId,
    'GENERADA', 'FALLIDA', enfriamiento.dias, enfriamiento.maxFallidas]);
  return r.rows;
}

async function candidatosMorosidad({ hoy, cadaDias, limite, sedeId = null, enfriamiento = ENFRIAMIENTO, db = { ejecutar } }) {
  const r = await db.ejecutar(SQL_CANDIDATOS_MOROSIDAD, [
    aFechaSql(hoy), cadaDias, limite, 'Pendiente', 'Moroso', 'MOROSIDAD', 'ENVIADA', sedeId,
    'GENERADA', 'FALLIDA', enfriamiento.dias, enfriamiento.maxFallidas]);
  return r.rows;
}

// ───────────────────────── Arrendamiento entre instancias ─────────────────────────

async function adquirirLease(db, titular, minutos) {
  const r = await db.ejecutar(
    `INSERT INTO parametros (clave, valor) VALUES ($1, $2)
     ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor, actualizado_en = NOW()
       WHERE parametros.actualizado_en < NOW() - ($3::int * INTERVAL '1 minute')
     RETURNING clave`,
    [CLAVE_LEASE, titular, minutos]);
  return r.rowCount > 0;
}

/**
 * Renueva el arrendamiento SOLO si seguimos siendo el titular (valor = $2). Devuelve `true` si lo renovó y `false` si ya no es
 * nuestro (H3): el proceso se congeló más que el lease, caducó y otra instancia lo tomó. Quien llama debe abortar sin enviar más.
 */
async function renovarLease(db, titular) {
  const r = await db.ejecutar('UPDATE parametros SET actualizado_en = NOW() WHERE clave = $1 AND valor = $2', [CLAVE_LEASE, titular]);
  return r.rowCount > 0;
}

const liberarLease = (db, titular) =>
  db.ejecutar('DELETE FROM parametros WHERE clave = $1 AND valor = $2', [CLAVE_LEASE, titular]);

// ───────────────────────── Utilidades puras ─────────────────────────

/**
 * Clase de la falla (ver whatsapp.service). Solo se confía en `detalles.clase` cuando el error viene de un envío a Meta; cualquier
 * otra cosa (error de base, bug, error sin clase) es DESCONOCIDA y conserva el tratamiento conservador: cuenta para el cortafuegos.
 */
function claseDeFalla(err) {
  if (!err || err.codigo !== 'WHATSAPP_ENVIO_FALLIDO' || !err.detalles) return CLASE_FALLA.DESCONOCIDA;
  const c = err.detalles.clase;
  return c === CLASE_FALLA.DESTINATARIO || c === CLASE_FALLA.SISTEMICA ? c : CLASE_FALLA.DESCONOCIDA;
}

/** Motivo de aborto legible para el resumen: `META_SISTEMICA_190`, `META_SISTEMICA_132001` o `META_SISTEMICA_HTTP_401`. */
function etiquetaAbortoMeta(err) {
  const d = (err && err.detalles) || {};
  if (Number.isInteger(d.meta_codigo)) return `META_SISTEMICA_${d.meta_codigo}`;
  return d.http_status ? `META_SISTEMICA_HTTP_${d.http_status}` : 'META_SISTEMICA';
}

/** Milisegundos hasta la próxima ocurrencia de `hora` ('HH:MM', hora de Caracas). Siempre > 0 y <= 24 h. */
function msHastaProximaEjecucion(hora, ahoraMs = Date.now()) {
  const [h, m] = hora.split(':').map(Number);
  const caracas = ahoraMs - OFFSET_CARACAS_MS; // los campos UTC de este instante son la hora local de Caracas
  const d = new Date(caracas);
  let objetivo = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), h, m, 0, 0);
  if (objetivo <= caracas) objetivo += MS_DIA;
  return objetivo - caracas;
}

/** Envuelve el servicio BCV: consulta fresca como mucho cada `ttlMs`; entre medias reutiliza la última captura. */
function bcvDelCiclo(bcv, ahora, ttlMs = REFRESCO_TASA_MS) {
  let ultimaFresca = Number.NEGATIVE_INFINITY;
  return {
    async obtenerTasa() {
      const fresca = ahora() - ultimaFresca >= ttlMs;
      const t = await bcv.obtenerTasa({ fresca });
      if (fresca && !t.desactualizada) ultimaFresca = ahora();
      return t;
    },
  };
}

// ───────────────────────── Servicio ─────────────────────────

/**
 * Crea el bot. Todas las dependencias son inyectables (los tests usan dobles; en producción se usan los servicios reales).
 * Interfaz: ejecutarCiclo() → resumen · iniciar() / detener() → planificador diario.
 */
function crearCronWhatsapp({
  db = { ejecutar },
  guard = guardGlobal,
  notificaciones = notificacionesGlobal,
  bcv = bcvGlobal,
  whatsapp = whatsappGlobal,
  config = cfg.whatsappCron,
  esperar = esperarReal,
  ahora = () => Date.now(),
  log = (...a) => console.log('[whatsapp-cron]', ...a),
  logError = (...a) => console.error('[whatsapp-cron]', ...a),
} = {}) {
  let temporizador = null;
  let detenido = false;
  let enCurso = null;

  async function procesar(lista, resumen, estado) {
    const bcvCiclo = bcvDelCiclo(bcv, ahora);
    for (const item of lista) {
      if (detenido) { resumen.abortado = 'DETENIDO'; return; }
      if (resumen.abortado) return;
      if (estado.intentos >= config.maxEnviosPorCiclo) { resumen.abortado = 'LIMITE_POR_CICLO'; return; }
      if (estado.llamoAMeta) await esperar(config.delayMs); // pausa anti-baneo entre envíos consecutivos
      estado.llamoAMeta = false;
      estado.intentos += 1;
      if (estado.intentos % RENOVAR_LEASE_CADA === 0) {
        // H3: `true` = seguimos siendo el titular; `false` = otra instancia tomó el lease (este proceso estuvo congelado más de
        // `arrendamientoMin`) → se aborta ANTES de enviar este mensaje para no duplicar envíos con la otra instancia.
        // Un error transitorio de la base (`null`) no es evidencia de pérdida: se registra y se sigue, como antes.
        const vigente = await renovarLease(db, estado.titular).catch((err) => { logError('No se pudo renovar el arrendamiento:', err.message); return null; });
        if (vigente === false) {
          logError('El arrendamiento ya no es nuestro (otra instancia lo tomó); se aborta el ciclo sin enviar más mensajes.');
          resumen.abortado = 'LEASE_PERDIDO';
          return;
        }
      }

      const parcial = resumen[item.tipo.toLowerCase()];
      try {
        const r = await notificaciones.generarAlerta(
          { tipo: item.tipo, estudianteId: item.estudiante_id, enviar: true, usuarioId: null, modoPreventiva: MODO_PREVENTIVA.MES_ENTRANTE },
          { bcvSvc: bcvCiclo });
        estado.llamoAMeta = true;
        estado.fallosSeguidos = 0;
        parcial.enviadas += 1;
        log(`${item.tipo} ENVIADA estudiante=${item.estudiante_id} notificacion=${r.notificacion_id}`);
      } catch (err) {
        const codigo = err && err.codigo;
        if (CODIGOS_OMITIR.has(codigo)) {
          parcial.omitidas += 1;
          log(`${item.tipo} omitida estudiante=${item.estudiante_id}: ${codigo}`);
          continue;
        }
        if (codigo === 'WHATSAPP_ENVIO_FALLIDO') estado.llamoAMeta = true; // la solicitud sí llegó a Meta
        // La fila ya quedó 'FALLIDA' en notificaciones_whatsapp (la escribe notificaciones.generarAlerta antes de relanzar el error).
        const clase = claseDeFalla(err);
        parcial.fallidas += 1;
        logError(`${item.tipo} FALLIDA estudiante=${item.estudiante_id}: ${codigo || 'ERROR'}${clase === CLASE_FALLA.DESCONOCIDA ? '' : ` [${clase}]`} ${(err && err.detalles && err.detalles.motivo) || (err && err.message)}`);
        if (CODIGOS_ABORTAR.has(codigo)) { resumen.abortado = codigo; return; }
        // Falla sistémica de Meta (token vencido, plantilla inexistente…): cualquier envío siguiente fallaría igual → se corta ya.
        if (clase === CLASE_FALLA.SISTEMICA) { resumen.abortado = etiquetaAbortoMeta(err); return; }
        // Falla del destinatario (no entregable, fuera de ventana…): queda registrada, pero NO es una avería → no suma al cortafuegos.
        if (clase === CLASE_FALLA.DESTINATARIO) continue;
        estado.fallosSeguidos += 1;
        if (estado.fallosSeguidos >= config.maxFallosSeguidos) { resumen.abortado = 'DEMASIADOS_FALLOS_SEGUIDOS'; return; }
      }
    }
  }

  /** Un ciclo completo. Nunca lanza por un envío individual; sí propaga errores de infraestructura (base caída) al planificador. */
  async function ejecutarCiclo() {
    const inicio = ahora();
    const fecha = hoyCaracas(inicio);
    // Regla de los 10 días: qué bloques tocan hoy (hora de Caracas). Es aritmética pura: no consulta la base ni toma el arrendamiento.
    const calendario = calendarioCobranza(fecha);
    const resumen = {
      estado: 'COMPLETADO', motivo: null, abortado: null, fecha,
      calendario: { preventiva: calendario.preventiva, morosidad: calendario.morosidad },
      preventiva: { candidatos: 0, enviadas: 0, fallidas: 0, omitidas: 0 },
      morosidad: { candidatos: 0, enviadas: 0, fallidas: 0, omitidas: 0 },
      por_sede: [],
      duracion_ms: 0,
    };

    if (!calendario.preventiva && !calendario.morosidad) {
      log(`Ciclo omitido: ${fecha} no es día de preventiva (1–2 días antes del mes entrante) ni de morosidad (desde el día 11).`);
      return { ...resumen, estado: 'OMITIDO', motivo: MOTIVO_FUERA_DE_CALENDARIO };
    }

    const modulo = await guard.evaluar(MODULO, { fresco: true });
    if (!modulo.habilitado) {
      log(`Ciclo omitido: módulo ${MODULO} deshabilitado (${modulo.motivo || 'sin motivo'}).`);
      return { ...resumen, estado: 'OMITIDO', motivo: modulo.motivo || 'MODULO_DESHABILITADO' };
    }
    if (!whatsapp.configurado()) {
      logError('Ciclo omitido: falta WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID.');
      return { ...resumen, estado: 'OMITIDO', motivo: 'WHATSAPP_NO_CONFIGURADO' };
    }

    const titular = `${os.hostname()}:${process.pid}:${inicio}`;
    if (!(await adquirirLease(db, titular, config.arrendamientoMin))) {
      log('Ciclo omitido: otra instancia ya está ejecutando el bot.');
      return { ...resumen, estado: 'OMITIDO', motivo: 'OTRA_INSTANCIA_EN_CURSO' };
    }

    try {
      const hoy = fecha;
      const limite = config.maxEnviosPorCiclo;
      // Multi-sede: cada sede activa se despacha por separado (Preventiva y luego Morosidad) y al final los estudiantes sin
      // sede. Los contadores del resumen son la suma de todos los ámbitos; el detalle va en `por_sede`.
      const sedes = (await db.ejecutar('SELECT id, nombre FROM sedes WHERE activa = TRUE ORDER BY id', [])).rows;
      const ambitos = [...sedes.map((x) => ({ sedeId: x.id, nombre: x.nombre })), { sedeId: null, nombre: null }];
      const estado = { intentos: 0, llamoAMeta: false, fallosSeguidos: 0, titular };
      for (const ambito of ambitos) {
        if (resumen.abortado) break;
        // Solo se consulta el bloque que toca hoy: en los días 11–28 no hay preventiva y los dos últimos días del mes corren ambos.
        const preventivas = calendario.preventiva ? await candidatosPreventiva({ hoy, ventana: calendario.ventana, limite, sedeId: ambito.sedeId, db }) : [];
        const morosos = calendario.morosidad ? await candidatosMorosidad({ hoy, cadaDias: config.morosidadCadaDias, limite, sedeId: ambito.sedeId, db }) : [];
        resumen.preventiva.candidatos += preventivas.length;
        resumen.morosidad.candidatos += morosos.length;
        resumen.por_sede.push({ sede_id: ambito.sedeId, sede: ambito.nombre, preventiva: preventivas.length, morosidad: morosos.length });
        log(`Ciclo ${hoy} · ${ambito.nombre ?? 'sin sede'}: ${preventivas.length} preventivas + ${morosos.length} por morosidad (tope ${limite}).`);
        const lista = [
          ...preventivas.map((c) => ({ tipo: 'PREVENTIVA', estudiante_id: c.estudiante_id })),
          ...morosos.map((c) => ({ tipo: 'MOROSIDAD', estudiante_id: c.estudiante_id })),
        ];
        await procesar(lista, resumen, estado);
      }
      if (resumen.abortado) Object.assign(resumen, { estado: 'ABORTADO' });
    } finally {
      await liberarLease(db, titular).catch((e) => logError('No se pudo liberar el arrendamiento (caducará solo):', e.message));
      resumen.duracion_ms = ahora() - inicio;
    }
    log(`Ciclo ${resumen.estado}${resumen.abortado ? ` (${resumen.abortado})` : ''}: preventiva ${JSON.stringify(resumen.preventiva)} · morosidad ${JSON.stringify(resumen.morosidad)} · ${resumen.duracion_ms} ms`);
    return resumen;
  }

  function programar() {
    if (detenido) return;
    const ms = msHastaProximaEjecucion(config.hora, ahora());
    log(`Próxima ejecución en ${Math.round(ms / 60_000)} min (${config.hora} hora de Caracas).`);
    temporizador = setTimeout(async () => {
      enCurso = ejecutarCiclo().catch((err) => logError('El ciclo falló:', err.message));
      await enCurso;
      enCurso = null;
      programar();
    }, ms);
    if (typeof temporizador.unref === 'function') temporizador.unref(); // no impide cerrar el proceso (lo mantiene vivo el servidor HTTP)
  }

  function iniciar() {
    detenido = false;
    if (temporizador) return;
    programar();
  }

  /** Cancela el planificador y espera a que el envío en curso termine su mensaje actual. */
  async function detener() {
    detenido = true;
    if (temporizador) { clearTimeout(temporizador); temporizador = null; }
    if (enCurso) await enCurso;
  }

  return { ejecutarCiclo, iniciar, detener };
}

const cron = crearCronWhatsapp();

module.exports = { crearCronWhatsapp, cron, msHastaProximaEjecucion, bcvDelCiclo, candidatosPreventiva, candidatosMorosidad, MODULO, CLAVE_LEASE, ENFRIAMIENTO, MOTIVO_FUERA_DE_CALENDARIO };

// Ejecución directa: `node cron/whatsappCron.js` (un ciclo) o `node cron/whatsappCron.js --daemon` (planificador propio).
if (require.main === module) {
  const daemon = process.argv.includes('--daemon');
  if (daemon) {
    const parar = () => cron.detener().finally(() => closePool().finally(() => process.exit(0)));
    process.on('SIGTERM', parar);
    process.on('SIGINT', parar);
    cron.iniciar();
    setInterval(() => {}, 2 ** 30); // mantiene vivo el proceso independiente (el timer del planificador es unref)
  } else {
    cron.ejecutarCiclo()
      .then((r) => { process.exitCode = r.estado === 'ABORTADO' ? 2 : 0; })
      .catch((err) => { console.error('[whatsapp-cron] Ciclo fallido:', err.message); process.exitCode = 1; })
      .finally(() => closePool());
  }
}
