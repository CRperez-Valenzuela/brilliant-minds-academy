'use strict';
/**
 * Bot de envío masivo automático — módulo premium WHATSAPP_AUTOMATICO.
 *
 * Una vez al día (hora de Caracas, WHATSAPP_CRON_HORA) barre la base y despacha por la API de WhatsApp, de forma SECUENCIAL
 * y con una pausa de 1,5 s entre envíos (anti-baneo de Meta):
 *   1) PREVENTIVA : estudiantes Activos cuya próxima cuota Pendiente vence en 3–5 días (VENTANA_PREVENTIVA).
 *   2) MOROSIDAD  : estudiantes Morosos con cuotas vencidas en estado 'Pendiente' (las que ya tienen una referencia
 *                   'En Revisión' no se cobran de nuevo).
 * Cada alerta pasa por notificaciones.generarAlerta({ enviar: true }): la misma lógica ya probada del envío manual (reglas de
 * ventana, tasa BCV, enlace del portal, plantilla) que deja la fila en notificaciones_whatsapp como ENVIADA o FALLIDA.
 *
 * Garantías del ciclo:
 *   - Candado premium: si el módulo no está habilitado (o su prueba de 15 días venció) el ciclo no envía nada.
 *   - Idempotente: una PREVENTIVA se envía una sola vez por cuota; la MOROSIDAD no se repite al mismo estudiante antes de
 *     WHATSAPP_CRON_MOROSIDAD_CADA_DIAS (7). Relanzar el ciclo el mismo día no duplica mensajes.
 *   - Un solo ciclo a la vez entre instancias: arrendamiento (lease) en la tabla `parametros`; funciona detrás del pooler
 *     de Supabase en modo transacción (no usa locks de sesión) y caduca solo si el proceso muere.
 *   - Cortafuegos: se aborta ante una falla sistémica (tasa BCV no disponible, WhatsApp sin configurar) o tras
 *     WHATSAPP_CRON_MAX_FALLOS_SEGUIDOS fallos consecutivos, y se limita a WHATSAPP_CRON_MAX_ENVIOS por ciclo.
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
const { guard: guardGlobal } = require('../modules/premium/guard');
const notificacionesGlobal = require('../services/notificaciones.service');
const { bcv: bcvGlobal } = require('../services/bcv.service');
const { whatsapp: whatsappGlobal } = require('../services/whatsapp.service');

const MODULO = 'WHATSAPP_AUTOMATICO';
const CLAVE_LEASE = 'WHATSAPP_CRON_LEASE';
const OFFSET_CARACAS_MS = 4 * 3600_000;
const MS_DIA = 86_400_000;
const REFRESCO_TASA_MS = 60_000;
const RENOVAR_LEASE_CADA = 25;

// Errores de reglas de negocio: el estado del estudiante cambió entre la consulta masiva y el envío → se omite sin contar como fallo.
const CODIGOS_OMITIR = new Set(['ESTADO_NO_APLICA', 'SIN_CUOTA_PROXIMA', 'FUERA_DE_VENTANA_PREVENTIVA', 'ESTUDIANTE_NO_MOROSO', 'PAGO_EN_REVISION', 'NO_ENCONTRADO']);
// Fallas sistémicas: reintentar con el siguiente estudiante fallaría igual → se corta el ciclo.
const CODIGOS_ABORTAR = new Set(['TASA_BCV_DESACTUALIZADA', 'TASA_BCV_NO_DISPONIBLE', 'WHATSAPP_NO_CONFIGURADO']);

const esperarReal = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

// ───────────────────────── Consultas masivas (PostgreSQL, parámetros posicionales) ─────────────────────────

/**
 * Activos con la próxima cuota Pendiente (>= hoy) dentro de la ventana [hoy+min, hoy+max] y sin PREVENTIVA ya enviada para esa cuota.
 * Misma definición de "próxima cuota" que notificaciones.prepararPreventiva: la de menor vencimiento ≥ hoy por estudiante.
 */
const SQL_CANDIDATOS_PREVENTIVA = `
  SELECT p.estudiante_id, p.cuota_id, p.fecha_vencimiento
    FROM (
      SELECT DISTINCT ON (c.estudiante_id) c.estudiante_id, c.id AS cuota_id, c.fecha_vencimiento
        FROM cuotas c
        JOIN vw_estudiantes_estado v ON v.id = c.estudiante_id
       WHERE c.estado = $5::text AND c.fecha_vencimiento >= $1::date AND v.estado_dinamico = $6::text
       ORDER BY c.estudiante_id, c.fecha_vencimiento, c.id
    ) p
   WHERE p.fecha_vencimiento BETWEEN ($1::date + $2::int) AND ($1::date + $3::int)
     AND NOT EXISTS (SELECT 1 FROM notificaciones_whatsapp n
                      WHERE n.cuota_id = p.cuota_id AND n.tipo = $7::text AND n.estado = $8::text)
   ORDER BY p.fecha_vencimiento, p.estudiante_id
   LIMIT $4::int`;

/**
 * Morosos con al menos una cuota vencida en estado Pendiente (si todas están En Revisión no aparecen) y sin cobro ENVIADO
 * dentro de los últimos N días.
 */
const SQL_CANDIDATOS_MOROSIDAD = `
  SELECT v.id AS estudiante_id, MIN(c.fecha_vencimiento) AS vencida_desde
    FROM vw_estudiantes_estado v
    JOIN cuotas c ON c.estudiante_id = v.id AND c.estado = $4::text AND c.fecha_vencimiento < $1::date
   WHERE v.estado_dinamico = $5::text
     AND NOT EXISTS (SELECT 1 FROM notificaciones_whatsapp n
                      WHERE n.estudiante_id = v.id AND n.tipo = $6::text AND n.estado = $7::text
                        AND n.creado_en > NOW() - ($2::int * INTERVAL '1 day'))
   GROUP BY v.id
   ORDER BY MIN(c.fecha_vencimiento), v.id
   LIMIT $3::int`;

async function candidatosPreventiva({ hoy, ventana, limite, db = { ejecutar } }) {
  const r = await db.ejecutar(SQL_CANDIDATOS_PREVENTIVA, [aFechaSql(hoy), ventana.min, ventana.max, limite, 'Pendiente', 'Activo', 'PREVENTIVA', 'ENVIADA']);
  return r.rows;
}

async function candidatosMorosidad({ hoy, cadaDias, limite, db = { ejecutar } }) {
  const r = await db.ejecutar(SQL_CANDIDATOS_MOROSIDAD, [aFechaSql(hoy), cadaDias, limite, 'Pendiente', 'Moroso', 'MOROSIDAD', 'ENVIADA']);
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

const renovarLease = (db, titular) =>
  db.ejecutar('UPDATE parametros SET actualizado_en = NOW() WHERE clave = $1 AND valor = $2', [CLAVE_LEASE, titular]);

const liberarLease = (db, titular) =>
  db.ejecutar('DELETE FROM parametros WHERE clave = $1 AND valor = $2', [CLAVE_LEASE, titular]);

// ───────────────────────── Utilidades puras ─────────────────────────

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
      if (estado.intentos % RENOVAR_LEASE_CADA === 0) await renovarLease(db, estado.titular).catch((e) => logError('No se pudo renovar el arrendamiento:', e.message));

      const parcial = resumen[item.tipo.toLowerCase()];
      try {
        const r = await notificaciones.generarAlerta(
          { tipo: item.tipo, estudianteId: item.estudiante_id, enviar: true, usuarioId: null },
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
        parcial.fallidas += 1;
        estado.fallosSeguidos += 1;
        logError(`${item.tipo} FALLIDA estudiante=${item.estudiante_id}: ${codigo || 'ERROR'} ${(err && err.detalles && err.detalles.motivo) || (err && err.message)}`);
        if (CODIGOS_ABORTAR.has(codigo)) { resumen.abortado = codigo; return; }
        if (estado.fallosSeguidos >= config.maxFallosSeguidos) { resumen.abortado = 'DEMASIADOS_FALLOS_SEGUIDOS'; return; }
      }
    }
  }

  /** Un ciclo completo. Nunca lanza por un envío individual; sí propaga errores de infraestructura (base caída) al planificador. */
  async function ejecutarCiclo() {
    const inicio = ahora();
    const resumen = {
      estado: 'COMPLETADO', motivo: null, abortado: null, fecha: hoyCaracas(inicio),
      preventiva: { candidatos: 0, enviadas: 0, fallidas: 0, omitidas: 0 },
      morosidad: { candidatos: 0, enviadas: 0, fallidas: 0, omitidas: 0 },
      duracion_ms: 0,
    };

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
      const hoy = resumen.fecha;
      const limite = config.maxEnviosPorCiclo;
      const preventivas = await candidatosPreventiva({ hoy, ventana: notificaciones.VENTANA_PREVENTIVA, limite, db });
      const morosos = await candidatosMorosidad({ hoy, cadaDias: config.morosidadCadaDias, limite, db });
      resumen.preventiva.candidatos = preventivas.length;
      resumen.morosidad.candidatos = morosos.length;
      log(`Ciclo ${hoy}: ${preventivas.length} preventivas + ${morosos.length} por morosidad (tope ${limite}).`);

      const lista = [
        ...preventivas.map((c) => ({ tipo: 'PREVENTIVA', estudiante_id: c.estudiante_id })),
        ...morosos.map((c) => ({ tipo: 'MOROSIDAD', estudiante_id: c.estudiante_id })),
      ];
      await procesar(lista, resumen, { intentos: 0, llamoAMeta: false, fallosSeguidos: 0, titular });
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

module.exports = { crearCronWhatsapp, cron, msHastaProximaEjecucion, bcvDelCiclo, candidatosPreventiva, candidatosMorosidad, MODULO, CLAVE_LEASE };

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
