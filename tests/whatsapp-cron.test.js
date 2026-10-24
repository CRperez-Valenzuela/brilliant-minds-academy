'use strict';
require('./helpers/entorno');
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { AppError, e } = require('../errors/AppError');
const { crearCronWhatsapp, msHastaProximaEjecucion, bcvDelCiclo } = require('../cron/whatsappCron');

const HORA = Date.parse('2026-10-23T12:00:00-04:00');
const CONFIG = { activo: true, hora: '08:00', delayMs: 1500, maxEnviosPorCiclo: 400, morosidadCadaDias: 7, maxFallosSeguidos: 5, arrendamientoMin: 120 };
const rs = (...filas) => ({ rows: filas, rowCount: filas.length });

/**
 * Arma el bot con dobles. `resultados[estudianteId]` = 'ok' | AppError | Error. Cada envío queda en `eventos`
 * junto con las pausas (`esperar`), para comprobar el orden secuencial y el delay.
 */
function armar({ preventivas = [], morosos = [], resultados = {}, modulo = { habilitado: true }, configurado = true, lease = true, config = {} } = {}) {
  const eventos = [];
  const sql = [];
  const db = {
    ejecutar: async (texto, params) => {
      sql.push({ texto, params });
      const maximo = Math.max(0, ...[...texto.matchAll(/\$(\d+)/g)].map((m) => Number(m[1])));
      assert.equal(params.length, maximo, `parámetros posicionales: usa $1..$${maximo}, recibió ${params.length}`);
      if (/INSERT INTO parametros/.test(texto)) return lease ? rs({ clave: 'x' }) : rs();
      if (/FROM \(\s*SELECT DISTINCT ON/.test(texto)) return rs(...preventivas);
      if (/GROUP BY v\.id/.test(texto)) return rs(...morosos);
      return rs();
    },
  };
  const guard = { evaluar: async () => modulo };
  const notificaciones = {
    VENTANA_PREVENTIVA: { min: 3, max: 5 },
    generarAlerta: async ({ tipo, estudianteId, enviar, usuarioId }) => {
      eventos.push(`envio:${tipo}:${estudianteId}`);
      assert.equal(enviar, true);
      assert.equal(usuarioId, null, 'el bot no se atribuye a ningún usuario del panel');
      const r = resultados[estudianteId] ?? 'ok';
      if (r !== 'ok') throw r;
      return { notificacion_id: 1000 + estudianteId, estado: 'ENVIADA' };
    },
  };
  const pausas = [];
  const bot = crearCronWhatsapp({
    db, guard, notificaciones, bcv: { obtenerTasa: async () => ({ tasa: 36.5, desactualizada: false }) },
    whatsapp: { configurado: () => configurado },
    config: { ...CONFIG, ...config },
    esperar: async (ms) => { pausas.push(ms); eventos.push(`pausa:${ms}`); },
    ahora: () => HORA, log: () => {}, logError: () => {},
  });
  return { bot, eventos, pausas, sql };
}

const prev = (...ids) => ids.map((estudiante_id) => ({ estudiante_id, cuota_id: estudiante_id * 10, fecha_vencimiento: '2026-10-27' }));
const mor = (...ids) => ids.map((estudiante_id) => ({ estudiante_id, vencida_desde: '2026-10-01' }));
const metaFalla = () => new AppError(502, 'WHATSAPP_ENVIO_FALLIDO', 'Meta rechazó', { motivo: 'Meta 131047' });

test('ciclo: preventivas primero, luego morosidad; envío SECUENCIAL con pausa de 1,5 s entre mensajes (no antes del primero ni después del último)', async () => {
  const { bot, eventos, pausas } = armar({ preventivas: prev(1, 2), morosos: mor(3) });
  const r = await bot.ejecutarCiclo();
  assert.deepEqual(eventos, ['envio:PREVENTIVA:1', 'pausa:1500', 'envio:PREVENTIVA:2', 'pausa:1500', 'envio:MOROSIDAD:3']);
  assert.deepEqual(pausas, [1500, 1500]);
  assert.equal(r.estado, 'COMPLETADO');
  assert.deepEqual(r.preventiva, { candidatos: 2, enviadas: 2, fallidas: 0, omitidas: 0 });
  assert.deepEqual(r.morosidad, { candidatos: 1, enviadas: 1, fallidas: 0, omitidas: 0 });
});

test('un envío FALLIDO se cuenta, el ciclo continúa con el siguiente y respeta igualmente la pausa', async () => {
  const { bot, eventos } = armar({ preventivas: prev(1, 2, 3), resultados: { 2: metaFalla() } });
  const r = await bot.ejecutarCiclo();
  assert.deepEqual(eventos.filter((x) => x.startsWith('envio')), ['envio:PREVENTIVA:1', 'envio:PREVENTIVA:2', 'envio:PREVENTIVA:3']);
  assert.equal(eventos.filter((x) => x === 'pausa:1500').length, 2);
  assert.deepEqual([r.preventiva.enviadas, r.preventiva.fallidas, r.estado], [2, 1, 'COMPLETADO']);
});

test('reglas de negocio (el estudiante cambió desde la consulta) se OMITEN: no cuentan como fallo ni gastan pausa', async () => {
  const { bot, pausas } = armar({ preventivas: prev(1, 2), morosos: mor(3), resultados: { 1: e.reglaNegocio('FUERA_DE_VENTANA_PREVENTIVA', 'x'), 3: e.reglaNegocio('PAGO_EN_REVISION', 'x') } });
  const r = await bot.ejecutarCiclo();
  assert.deepEqual([r.preventiva.omitidas, r.preventiva.enviadas, r.morosidad.omitidas], [1, 1, 1]);
  assert.deepEqual(pausas, [1500], 'la pausa solo se aplica tras un envío real a Meta (antes del 3.º intento); las omitidas previas no la generan');
  assert.equal(r.estado, 'COMPLETADO');
});

test('cortafuegos: tras 5 fallos seguidos se aborta; un éxito intermedio reinicia la cuenta', async () => {
  const fallos = Object.fromEntries([1, 2, 3, 4, 5, 6, 7].map((i) => [i, metaFalla()]));
  let { bot, eventos } = armar({ preventivas: prev(1, 2, 3, 4, 5, 6, 7), resultados: fallos });
  let r = await bot.ejecutarCiclo();
  assert.equal(r.estado, 'ABORTADO');
  assert.equal(r.abortado, 'DEMASIADOS_FALLOS_SEGUIDOS');
  assert.equal(eventos.filter((x) => x.startsWith('envio')).length, 5, 'no se intentó a los restantes');

  ({ bot, eventos } = armar({ preventivas: prev(1, 2, 3, 4, 5, 6, 7, 8, 9), resultados: { 1: metaFalla(), 2: metaFalla(), 3: metaFalla(), 4: metaFalla(), 6: metaFalla(), 7: metaFalla() } }));
  r = await bot.ejecutarCiclo();
  assert.equal(r.estado, 'COMPLETADO');
  assert.equal(r.preventiva.fallidas, 6);
});

test('falla sistémica (tasa BCV caída / WhatsApp sin configurar durante el ciclo) → aborta de inmediato', async () => {
  for (const codigo of ['TASA_BCV_DESACTUALIZADA', 'TASA_BCV_NO_DISPONIBLE', 'WHATSAPP_NO_CONFIGURADO']) {
    const { bot, eventos } = armar({ preventivas: prev(1, 2, 3), resultados: { 1: e.noDisponible(codigo, 'x') } });
    const r = await bot.ejecutarCiclo();
    assert.deepEqual([r.estado, r.abortado], ['ABORTADO', codigo]);
    assert.equal(eventos.filter((x) => x.startsWith('envio')).length, 1);
  }
});

test('tope por ciclo (WHATSAPP_CRON_MAX_ENVIOS) y el LIMIT viaja a la consulta', async () => {
  const { bot, eventos, sql } = armar({ preventivas: prev(1, 2, 3, 4), config: { maxEnviosPorCiclo: 3 } });
  const r = await bot.ejecutarCiclo();
  assert.equal(eventos.filter((x) => x.startsWith('envio')).length, 3);
  assert.equal(r.abortado, 'LIMITE_POR_CICLO');
  const consulta = sql.find((s) => /DISTINCT ON/.test(s.texto));
  assert.equal(consulta.params[3], 3);
});

test('candado premium: módulo deshabilitado o prueba vencida → no consulta candidatos ni envía', async () => {
  for (const modulo of [{ habilitado: false, motivo: 'DESHABILITADO' }, { habilitado: false, vencida: true, motivo: 'PRUEBA_EXPIRADA' }]) {
    const { bot, eventos, sql } = armar({ preventivas: prev(1), modulo });
    const r = await bot.ejecutarCiclo();
    assert.deepEqual([r.estado, r.motivo], ['OMITIDO', modulo.motivo]);
    assert.equal(eventos.length, 0);
    assert.equal(sql.length, 0, 'ni siquiera toma el arrendamiento');
  }
});

test('WhatsApp sin configurar → ciclo omitido sin crear notificaciones', async () => {
  const { bot, eventos, sql } = armar({ preventivas: prev(1), configurado: false });
  const r = await bot.ejecutarCiclo();
  assert.deepEqual([r.estado, r.motivo, eventos.length, sql.length], ['OMITIDO', 'WHATSAPP_NO_CONFIGURADO', 0, 0]);
});

test('arrendamiento: si otra instancia ya corre el bot, este ciclo no envía; si no, se libera siempre (incluso tras un error)', async () => {
  let { bot, eventos } = armar({ preventivas: prev(1), lease: false });
  const r = await bot.ejecutarCiclo();
  assert.deepEqual([r.estado, r.motivo, eventos.length], ['OMITIDO', 'OTRA_INSTANCIA_EN_CURSO', 0]);

  const normal = armar({ preventivas: prev(1) });
  await normal.bot.ejecutarCiclo();
  const liberar = normal.sql.filter((s) => /^\s*DELETE FROM parametros/.test(s.texto));
  assert.equal(liberar.length, 1);
  assert.equal(liberar[0].params[0], 'WHATSAPP_CRON_LEASE');

  // Si la consulta de candidatos revienta, el error se propaga pero el arrendamiento se libera.
  const sql = [];
  const bot2 = crearCronWhatsapp({
    db: { ejecutar: async (texto, params) => { sql.push(texto); if (/DISTINCT ON/.test(texto)) throw new Error('db caída'); return rs({ clave: 'x' }); } },
    guard: { evaluar: async () => ({ habilitado: true }) }, notificaciones: { VENTANA_PREVENTIVA: { min: 3, max: 5 }, generarAlerta: async () => ({}) },
    bcv: {}, whatsapp: { configurado: () => true }, config: CONFIG, esperar: async () => {}, ahora: () => HORA, log: () => {}, logError: () => {},
  });
  await assert.rejects(bot2.ejecutarCiclo(), /db caída/);
  assert.ok(sql.some((t) => /^\s*DELETE FROM parametros/.test(t)));
});

test('las consultas masivas son PostgreSQL con parámetros posicionales y reglas correctas (sin T-SQL)', async () => {
  const { bot, sql } = armar({});
  await bot.ejecutarCiclo();
  const p = sql.find((s) => /DISTINCT ON/.test(s.texto));
  const m = sql.find((s) => /GROUP BY v\.id/.test(s.texto));
  assert.deepEqual(p.params, ['2026-10-23', 3, 5, 400, 'Pendiente', 'Activo', 'PREVENTIVA', 'ENVIADA']);
  assert.deepEqual(m.params, ['2026-10-23', 7, 400, 'Pendiente', 'Moroso', 'MOROSIDAD', 'ENVIADA']);
  assert.match(p.texto, /BETWEEN \(\$1::date \+ \$2::int\) AND \(\$1::date \+ \$3::int\)/);
  assert.match(p.texto, /NOT EXISTS[\s\S]*n\.cuota_id = p\.cuota_id/, 'una PREVENTIVA por cuota');
  assert.match(m.texto, /c\.estado = \$4::text AND c\.fecha_vencimiento < \$1::date/, 'solo cuotas vencidas en Pendiente (no En Revisión)');
  assert.match(m.texto, /n\.creado_en > NOW\(\) - \(\$2::int \* INTERVAL '1 day'\)/);
  assert.ok(!/\b(TOP|GETDATE|DATEADD|ISNULL|dbo\.|@\w+)\b/i.test(p.texto + m.texto));
});

test('la tasa BCV se consulta fresca como mucho una vez por minuto durante el ciclo', async () => {
  let t = 0; const llamadas = [];
  const w = bcvDelCiclo({ obtenerTasa: async (o) => { llamadas.push(o.fresca); return { tasa: 36, desactualizada: false }; } }, () => t, 60_000);
  await w.obtenerTasa(); t = 10_000; await w.obtenerTasa(); t = 59_999; await w.obtenerTasa(); t = 60_000; await w.obtenerTasa();
  assert.deepEqual(llamadas, [true, false, false, true]);
  // una tasa desactualizada no cuenta como fresca: el siguiente intento vuelve a consultar la fuente
  const llam2 = []; let t2 = 0;
  const w2 = bcvDelCiclo({ obtenerTasa: async (o) => { llam2.push(o.fresca); return { tasa: 36, desactualizada: true }; } }, () => t2, 60_000);
  await w2.obtenerTasa(); t2 = 1000; await w2.obtenerTasa();
  assert.deepEqual(llam2, [true, true]);
});

test('planificador: próxima ejecución a la hora de Caracas (UTC-4), siempre dentro de las próximas 24 h', () => {
  const ms = (iso, hora) => msHastaProximaEjecucion(hora, Date.parse(iso));
  assert.equal(ms('2026-10-23T07:00:00-04:00', '08:00'), 3_600_000); // faltan 60 min → hoy
  assert.equal(ms('2026-10-23T09:00:00-04:00', '08:00'), 23 * 3_600_000); // ya pasó → mañana
  assert.equal(ms('2026-10-23T08:00:00-04:00', '08:00'), 24 * 3_600_000); // justo ahora → mañana (no doble ejecución)
  assert.equal(ms('2026-10-23T23:30:00-04:00', '00:15'), 45 * 60_000); // cruce de medianoche
  assert.equal(ms('2026-10-24T03:30:00Z', '23:59'), 29 * 60_000); // 23:30 Caracas → 29 min
});

test('iniciar() programa el ciclo diario y detener() lo cancela y espera al envío en curso', async () => {
  const temporizadores = [];
  const setOriginal = global.setTimeout; const clearOriginal = global.clearTimeout;
  global.setTimeout = (fn, ms) => { const h = { fn, ms, unref() {}, cancelado: false }; temporizadores.push(h); return h; };
  global.clearTimeout = (h) => { if (h) h.cancelado = true; };
  try {
    const { bot } = armar({ modulo: { habilitado: false, motivo: 'DESHABILITADO' } });
    bot.iniciar();
    assert.equal(temporizadores.length, 1);
    assert.equal(temporizadores[0].ms, msHastaProximaEjecucion('08:00', HORA));
    bot.iniciar(); // idempotente
    assert.equal(temporizadores.length, 1);
    await bot.detener();
    assert.equal(temporizadores[0].cancelado, true);
  } finally { global.setTimeout = setOriginal; global.clearTimeout = clearOriginal; }
});

test('el bot usa el servicio de notificaciones real (cero lógica de envío duplicada) y server.js lo enlaza', () => {
  const raiz = path.resolve(__dirname, '..');
  const fuente = fs.readFileSync(path.join(raiz, 'cron', 'whatsappCron.js'), 'utf8');
  assert.match(fuente, /require\('\.\.\/services\/notificaciones\.service'\)/);
  assert.match(fuente, /generarAlerta\(/);
  assert.ok(!/axios|graph\.facebook/.test(fuente), 'el cron no habla con Meta directamente');
  const server = fs.readFileSync(path.join(raiz, 'server.js'), 'utf8');
  assert.match(server, /cronWhatsapp\.iniciar\(\)/);
  assert.match(server, /cronWhatsapp\.detener\(\)/);
});
