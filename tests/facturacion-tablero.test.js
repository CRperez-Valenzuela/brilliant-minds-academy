'use strict';
const { db } = require('./helpers/entorno');
const test = require('node:test');
const assert = require('node:assert/strict');
const facturacion = require('../services/facturacion.service');
const ctrl = require('../controllers/facturacion.controller');
const { normalizar } = require('../middlewares/errorHandler');
const { limitesPeriodo, periodoActual } = require('../utils/fechas');

const rs = (...filas) => ({ rows: filas, rowCount: filas.length });

const CLAVES_CONTRATO = ['periodo', 'cobrado', 'saldos_vencidos', 'cuentas_pendientes', 'referencias_por_validar', 'cobrado_por_dia'];

/** Base simulada del tablero: responde a las dos consultas y mide cuántas viajan a la vez. */
function programarTablero({ kpi, dias = [] } = {}) {
  db.reiniciar();
  const estado = { enVuelo: 0, maxEnVuelo: 0 };
  db.handler = async (texto) => {
    estado.enVuelo += 1;
    estado.maxEnVuelo = Math.max(estado.maxEnVuelo, estado.enVuelo);
    await new Promise((r) => setImmediate(r)); // cede el turno: si fueran secuenciales, enVuelo nunca llegaría a 2
    estado.enVuelo -= 1;
    if (/AS cobrado_usd/.test(texto)) {
      return rs(kpi || { cobrado_usd: 0, cobrado_n: 0, vencido_usd: 0, vencido_n: 0, pendiente_usd: 0, pendiente_n: 0, por_validar_n: 0 });
    }
    if (/GROUP BY 1/.test(texto)) return rs(...dias);
    return rs();
  };
  return estado;
}

/** Simula (req, res, next) de Express para invocar el handler del controlador directamente. */
async function invocar(handler, query = {}) {
  const salida = { status: null, cuerpo: null, error: null };
  const res = { status(c) { salida.status = c; return this; }, json(b) { salida.cuerpo = b; return this; } };
  await new Promise((resolve) => {
    const next = (err) => { salida.error = err || null; resolve(); };
    const original = res.json.bind(res);
    res.json = (b) => { original(b); resolve(); return res; };
    handler({ query }, res, next);
  });
  return salida;
}

test('tablero: devuelve exactamente el contrato (sin campos extra) con importes numéricos', async () => {
  programarTablero({
    kpi: { cobrado_usd: 150.3, cobrado_n: 3, vencido_usd: 80, vencido_n: 2, pendiente_usd: 45.5, pendiente_n: 1, por_validar_n: 4 },
    dias: [{ dia: '2026-10-02', monto_usd: 100.1 }, { dia: '2026-10-15', monto_usd: 50.2 }],
  });
  const r = await facturacion.tablero('2026-10');
  assert.deepEqual(Object.keys(r), CLAVES_CONTRATO);
  assert.deepEqual(r, {
    periodo: '2026-10',
    cobrado: { monto_usd: 150.3, cantidad: 3 },
    saldos_vencidos: { monto_usd: 80, cantidad: 2 },
    cuentas_pendientes: { monto_usd: 45.5, cantidad: 1 },
    referencias_por_validar: 4,
    cobrado_por_dia: [{ dia: '2026-10-02', monto_usd: 100.1 }, { dia: '2026-10-15', monto_usd: 50.2 }],
  });
});

test('tablero: sin movimientos devuelve ceros y un arreglo vacío (nunca null)', async () => {
  programarTablero();
  const r = await facturacion.tablero('2026-01');
  assert.equal(r.cobrado.monto_usd, 0);
  assert.equal(r.saldos_vencidos.cantidad, 0);
  assert.deepEqual(r.cobrado_por_dia, []);
});

test('tablero: dos consultas parametrizadas ($1…$n posicionales, sin concatenar datos) y en paralelo', async () => {
  const estado = programarTablero();
  await facturacion.tablero('2026-10');
  assert.equal(db.llamadas.length, 2);
  assert.equal(estado.maxEnVuelo, 2, 'las consultas del tablero deben viajar a la vez (Promise.all)');

  const [kpi, porDia] = db.llamadas;
  assert.ok(Array.isArray(kpi.params) && kpi.params.length === 5);
  assert.ok(Array.isArray(porDia.params) && porDia.params.length === 2);
  // Los datos viajan SOLO como parámetros: el texto SQL no contiene fechas ni importes incrustados.
  for (const l of db.llamadas) assert.doesNotMatch(l.texto, /\d{4}-\d{2}-\d{2}/);
  // Barras diarias: SUM por día calendario de Caracas con AT TIME ZONE nativo de PostgreSQL.
  assert.match(porDia.texto, /SUM\(monto_usd\)/);
  assert.match(porDia.texto, /revisado_en AT TIME ZONE 'America\/Caracas'/);
  assert.match(porDia.texto, /GROUP BY 1\s+ORDER BY dia/);
  assert.doesNotMatch(porDia.texto, /\b(DATETIME2|GETDATE|ISNULL|TOP\s+\d+)\b/i); // sin rastros de T-SQL
});

test('tablero: el intervalo del mes son instantes UTC a medianoche de Caracas (UTC-4), sin desfase de fechas', async () => {
  programarTablero();
  await facturacion.tablero('2026-10');
  const { params } = db.llamadas[0];
  assert.equal(params[0], '2026-10-01T04:00:00.000Z'); // 2026-10-01 00:00 en Caracas
  assert.equal(params[1], '2026-11-01T04:00:00.000Z');
  assert.equal(params[2], '2026-10-01');
  assert.equal(params[3], '2026-10-31');
  assert.match(params[4], /^\d{4}-\d{2}-\d{2}$/);
  // Un cobro revisado el 30/sep a las 22:30 en Caracas (= 2026-10-01T02:30Z) pertenece a septiembre, no a octubre.
  const lim = limitesPeriodo('2026-10');
  assert.ok(Date.parse('2026-10-01T02:30:00Z') < lim.inicioUtc.getTime());
});

test('controlador tablero: sobre { ok:true, data } con el período de la query', async () => {
  programarTablero();
  const r = await invocar(ctrl.tablero, { periodo: '2026-09' });
  assert.equal(r.error, null);
  assert.equal(r.status, 200);
  assert.equal(r.cuerpo.ok, true);
  assert.deepEqual(Object.keys(r.cuerpo), ['ok', 'data']);
  assert.deepEqual(Object.keys(r.cuerpo.data), CLAVES_CONTRATO);
  assert.equal(r.cuerpo.data.periodo, '2026-09');
});

test('controlador tablero: sin período usa el mes en curso en hora de Caracas', async () => {
  programarTablero();
  const r = await invocar(ctrl.tablero, {});
  assert.equal(r.cuerpo.data.periodo, periodoActual());
  assert.match(r.cuerpo.data.periodo, /^\d{4}-(0[1-9]|1[0-2])$/);
});

test('controlador tablero: período inválido → AppError 422 VALIDACION (formato JSON de errores del Core)', async () => {
  for (const periodo of ['2026-13', '2026-1', 'octubre', '2026-10-01', ['2026-10', '2026-11'], { a: 1 }]) {
    programarTablero();
    const r = await invocar(ctrl.tablero, { periodo });
    assert.equal(r.cuerpo, null, `no debe responder datos para ${JSON.stringify(periodo)}`);
    const n = normalizar(r.error);
    assert.equal(n.status, 422);
    assert.equal(n.codigo, 'VALIDACION');
    assert.deepEqual(n.detalles, [{ campo: 'periodo', mensaje: 'Formato AAAA-MM.' }]);
    assert.equal(db.llamadas.length, 0, 'un período inválido no debe tocar la base de datos');
  }
});

test('controlador tablero: un fallo de PostgreSQL llega al errorHandler (no se traga ni expone SQL)', async () => {
  db.reiniciar();
  db.handler = async () => { throw Object.assign(new Error('canceling statement due to statement timeout'), { code: '57014', severity: 'ERROR' }); };
  const r = await invocar(ctrl.tablero, { periodo: '2026-10' });
  const n = normalizar(r.error);
  assert.equal(n.status, 504);
  assert.equal(n.codigo, 'BASE_DATOS_TIMEOUT');
  assert.doesNotMatch(JSON.stringify(n), /SELECT|pagos_referencias/);
});
