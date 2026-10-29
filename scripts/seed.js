'use strict';
/**
 * scripts/seed.js — Población de datos de PRUEBA multi-sede (PostgreSQL / Supabase).
 *
 *   node scripts/seed.js            # sembrar (idempotente: re-ejecutarlo no duplica nada)
 *   node scripts/seed.js --reset    # borra SOLO las filas de prueba y vuelve a sembrar
 *
 * Usa el pool nativo del proyecto (config/db.js → `pg`, TLS de Supabase, variables DB_*) con marcadores POSICIONALES ($1, $2, …).
 * Todo ocurre en UNA transacción (`conTransaccion`): ante cualquier error hay ROLLBACK y se imprime un error JSON estable.
 *
 * Qué certifica:
 *   · 2 sedes, 2 secretarias (cada una atada a su sede) y 1 admin consolidado (rol 'admin', sede_id NULL = SuperAdmin).
 *   · 5 estudiantes con sus representantes: 3 al día ('Activo') y 2 morosos (cuotas Pendiente con vencimiento pasado, como
 *     calcula vw_estudiantes_estado) + referencias 'Por Validar' en la bandeja de auditoría.
 *   · sede_id se OMITE a propósito en cuotas y pagos_referencias: lo debe heredar el trigger fn_heredar_sede_estudiante (006).
 *   · Verificación final: herencia de sede, estado dinámico de la vista, aislamiento por sede con el MISMO predicado que usa la
 *     aplicación (`($n::int IS NULL OR x.sede_id = $n::int)`) y RLS activo / sin privilegios para anon y authenticated.
 *
 * Seguridad: se niega a correr con NODE_ENV=production salvo SEED_ALLOW_PROD=1. Contraseña de las cuentas de prueba:
 * SEED_PASSWORD (>= 12 caracteres) o, si no se define, una aleatoria que se muestra UNA vez al crear las cuentas.
 * `--reset` jamás borra una sede que tenga datos ajenos al seed (estudiantes, usuarios, cuotas, egresos, pagos, cuentas, invitaciones).
 */
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const cfg = require('../config/env');
const { ejecutar, conTransaccion, closePool } = require('../config/db');

const DOMINIO = '@seed.bma.test';
const SEDES = ['Sede Acarigua', 'Sede Barquisimeto'];
const TASA_PRUEBA = 36.5; // Bs. por US$ (valor ficticio para las referencias de prueba)
// Roles de la API REST de Supabase y lecturas de prueba (constantes literales: nada de SQL armado con datos).
const ROLES_API = { anon: 'SET LOCAL ROLE anon', authenticated: 'SET LOCAL ROLE authenticated' };
const LECTURAS_RLS = {
  cuotas: 'SELECT COUNT(*)::int AS n FROM cuotas',
  estudiantes: 'SELECT COUNT(*)::int AS n FROM estudiantes',
  pagos_referencias: 'SELECT COUNT(*)::int AS n FROM pagos_referencias',
};

// Un día de offset negativo = vencida. Moroso ⇔ cuota Pendiente / En Revisión con vencimiento anterior a hoy (hora de Caracas).
const ALUMNOS = [
  {
    sede: SEDES[0], esperado: 'Activo',
    rep: { nombres: 'Carlos', apellidos: 'Rojas', cedula: 'V-90000001', email: `carlos.rojas${DOMINIO}`, telefono: '04145550001' },
    est: { nombres: 'Valeria', apellidos: 'Rojas', nacimiento: '2017-03-14', grado: '3er Grado' },
    cuotas: [
      { tipo: 'MATRICULA', concepto: 'Matrícula 2026-2027 (prueba)', monto: 120, dias: -60, estado: 'Pagada' },
      { tipo: 'MENSUALIDAD', concepto: 'Mensualidad Octubre 2026 (prueba)', monto: 80, dias: -5, estado: 'Pagada' },
      { tipo: 'MENSUALIDAD', concepto: 'Mensualidad Noviembre 2026 (prueba)', monto: 80, dias: 25, estado: 'Pendiente' },
    ],
  },
  {
    sede: SEDES[0], esperado: 'Moroso',
    rep: { nombres: 'Marisol', apellidos: 'Pérez', cedula: 'V-90000002', email: `marisol.perez${DOMINIO}`, telefono: '04245550002' },
    est: { nombres: 'Mateo', apellidos: 'Pérez', nacimiento: '2015-08-02', grado: '5to Grado' },
    cuotas: [
      { tipo: 'MATRICULA', concepto: 'Matrícula 2026-2027 (prueba)', monto: 120, dias: -75, estado: 'Pagada' },
      { tipo: 'MENSUALIDAD', concepto: 'Mensualidad Septiembre 2026 (prueba)', monto: 80, dias: -40, estado: 'Pendiente' },
      { tipo: 'MENSUALIDAD', concepto: 'Mensualidad Octubre 2026 (prueba)', monto: 80, dias: -10, estado: 'En Revisión' },
    ],
    pago: { cuota: 2, metodo: 'ZELLE', referencia: 'SEED-ZL-000201', monto: 80 },
  },
  {
    sede: SEDES[0], esperado: 'Moroso',
    rep: { nombres: 'José', apellidos: 'Díaz', cedula: 'V-90000003', email: `jose.diaz${DOMINIO}`, telefono: '04125550003' },
    est: { nombres: 'Sofía', apellidos: 'Díaz', nacimiento: '2019-11-21', grado: '1er Grado' },
    cuotas: [
      { tipo: 'MATRICULA', concepto: 'Matrícula 2026-2027 (prueba)', monto: 120, dias: -70, estado: 'Pagada' },
      { tipo: 'MENSUALIDAD', concepto: 'Mensualidad Octubre 2026 (prueba)', monto: 80, dias: -15, estado: 'Pendiente' },
    ],
  },
  {
    sede: SEDES[1], esperado: 'Activo',
    rep: { nombres: 'Andrea', apellidos: 'Gómez', cedula: 'V-90000004', email: `andrea.gomez${DOMINIO}`, telefono: '04165550004' },
    est: { nombres: 'Daniel', apellidos: 'Gómez', nacimiento: '2016-05-30', grado: '4to Grado' },
    cuotas: [
      { tipo: 'MATRICULA', concepto: 'Matrícula 2026-2027 (prueba)', monto: 130, dias: -55, estado: 'Pagada' },
      { tipo: 'MENSUALIDAD', concepto: 'Mensualidad Octubre 2026 (prueba)', monto: 85, dias: -3, estado: 'Pagada' },
      { tipo: 'MENSUALIDAD', concepto: 'Mensualidad Noviembre 2026 (prueba)', monto: 85, dias: 27, estado: 'Pendiente' },
    ],
  },
  {
    sede: SEDES[1], esperado: 'Moroso',
    rep: { nombres: 'Luis', apellidos: 'Herrera', cedula: 'V-90000005', email: `luis.herrera${DOMINIO}`, telefono: '04265550005' },
    est: { nombres: 'Camila', apellidos: 'Herrera', nacimiento: '2018-01-09', grado: '2do Grado' },
    cuotas: [
      { tipo: 'MATRICULA', concepto: 'Matrícula 2026-2027 (prueba)', monto: 130, dias: -80, estado: 'Pagada' },
      { tipo: 'MENSUALIDAD', concepto: 'Mensualidad Septiembre 2026 (prueba)', monto: 85, dias: -45, estado: 'Pendiente' },
      { tipo: 'MENSUALIDAD', concepto: 'Mensualidad Octubre 2026 (prueba)', monto: 85, dias: -12, estado: 'En Revisión' },
    ],
    pago: { cuota: 2, metodo: 'BINANCE', referencia: 'SEED-BN-000503', monto: 85 },
  },
];

const ADMINS = [
  { nombre: 'Secretaria Acarigua (prueba)', email: `secretaria.acarigua${DOMINIO}`, rol: 'secretaria', sede: SEDES[0] },
  { nombre: 'Secretaria Barquisimeto (prueba)', email: `secretaria.barquisimeto${DOMINIO}`, rol: 'secretaria', sede: SEDES[1] },
  { nombre: 'SuperAdmin Consolidado (prueba)', email: `superadmin${DOMINIO}`, rol: 'admin', sede: null },
];

// detalle (VARCHAR 500) con el MISMO formato tipado que compone frontend/src/configuracion.ts.
const CUENTAS = [
  { sede: null, metodo: 'PAYPAL', titular: 'Brilliant Minds Academy (prueba)', detalle: `pagos${DOMINIO}` },
  { sede: SEDES[0], metodo: 'ZELLE', titular: 'BMA Acarigua (prueba)', detalle: `acarigua${DOMINIO}` },
  { sede: SEDES[1], metodo: 'PAGO_MOVIL', titular: 'BMA Barquisimeto (prueba)', detalle: 'Banco 0102 · Tel 04145559999 · Cédula/RIF J000000000' },
];

// ── Utilidades ────────────────────────────────────────────────────────────────────────────────

/**
 * Arreglo JS → literal de arreglo de PostgreSQL ('{"a","b"}'). Se envía como UN parámetro de texto y la consulta lo castea
 * (`= ANY($1::text[])`, `$2::int[]`), de modo que no depende de cómo cada cliente serialice los arreglos.
 */
const arregloPg = (items) => `{${items.map((x) => `"${String(x).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`).join(',')}}`;

/** Error de cualquier origen (incluido `pg`) → objeto JSON estable. Nunca incluye parámetros ni credenciales. */
function errorJson(err) {
  return {
    ok: false,
    error: {
      codigo: (err && err.code) || 'SEED_ERROR',
      mensaje: (err && err.message) || String(err),
      detalle: (err && err.detail) || null,
      tabla: (err && err.table) || null,
      restriccion: (err && err.constraint) || null,
    },
  };
}

function contrasenaDePrueba() {
  const dada = process.env.SEED_PASSWORD;
  if (dada) {
    if (dada.length < 12) throw new Error('SEED_PASSWORD debe tener al menos 12 caracteres.');
    return { valor: dada, generada: false };
  }
  return { valor: crypto.randomBytes(14).toString('base64url'), generada: true };
}

async function uno(texto, params, tx) {
  const r = await ejecutar(texto, params, tx);
  return r.rows[0] || null;
}

/** Busca la fila; si no existe, inserta. Devuelve `{ id, creado }`. */
async function buscarOCrear(tx, textoBuscar, paramsBuscar, textoInsertar, paramsInsertar) {
  const hallada = await uno(textoBuscar, paramsBuscar, tx);
  if (hallada) return { id: hallada.id, creado: false };
  const nueva = await uno(textoInsertar, paramsInsertar, tx);
  if (nueva) return { id: nueva.id, creado: true };
  // ON CONFLICT DO NOTHING no devolvió fila: otra sesión la creó entre la búsqueda y el INSERT → releer.
  const otra = await uno(textoBuscar, paramsBuscar, tx);
  if (!otra) throw new Error('seed: la fila no existe tras ON CONFLICT DO NOTHING.');
  return { id: otra.id, creado: false };
}

// ── Reset (solo filas de prueba, en orden de dependencia) ─────────────────────────────────────

async function reset(tx) {
  const cedulasEst = arregloPg(ALUMNOS.map((a) => a.rep.cedula));
  // SQL literal en cada sentencia (sin ${…}): el estudiante de prueba se identifica por la cédula de su representante.
  await ejecutar(
    `DELETE FROM pagos_referencias WHERE estudiante_id IN (
       SELECT e.id FROM estudiantes AS e JOIN representantes AS r ON r.id = e.representante_id WHERE r.cedula = ANY($1::text[]))`,
    [cedulasEst], tx);
  await ejecutar(
    `DELETE FROM notificaciones_whatsapp WHERE estudiante_id IN (
       SELECT e.id FROM estudiantes AS e JOIN representantes AS r ON r.id = e.representante_id WHERE r.cedula = ANY($1::text[]))`,
    [cedulasEst], tx);
  await ejecutar(
    `DELETE FROM cuotas WHERE estudiante_id IN (
       SELECT e.id FROM estudiantes AS e JOIN representantes AS r ON r.id = e.representante_id WHERE r.cedula = ANY($1::text[]))`,
    [cedulasEst], tx);
  await ejecutar(
    `DELETE FROM estudiantes WHERE id IN (
       SELECT e.id FROM estudiantes AS e JOIN representantes AS r ON r.id = e.representante_id WHERE r.cedula = ANY($1::text[]))`,
    [cedulasEst], tx);
  await ejecutar('DELETE FROM representantes WHERE cedula = ANY($1::text[])', [cedulasEst], tx);
  await ejecutar('DELETE FROM usuarios_admin WHERE email LIKE $1', [`%${DOMINIO}`], tx);
  await ejecutar('DELETE FROM cuentas_pago WHERE detalle LIKE $1 OR titular LIKE $2', [`%${DOMINIO}`, '% (prueba)'], tx);
  // Una sede solo se borra si NADA ajeno al seed depende de ella (no se destruyen datos reales con el mismo nombre).
  await ejecutar(
    `DELETE FROM sedes AS s
      WHERE s.nombre = ANY($1::text[])
        AND NOT EXISTS (SELECT 1 FROM estudiantes WHERE sede_id = s.id)
        AND NOT EXISTS (SELECT 1 FROM usuarios_admin WHERE sede_id = s.id)
        AND NOT EXISTS (SELECT 1 FROM cuotas WHERE sede_id = s.id)
        AND NOT EXISTS (SELECT 1 FROM egresos WHERE sede_id = s.id)
        AND NOT EXISTS (SELECT 1 FROM pagos_referencias WHERE sede_id = s.id)
        AND NOT EXISTS (SELECT 1 FROM cuentas_pago WHERE sede_id = s.id)
        AND NOT EXISTS (SELECT 1 FROM invitaciones_inscripcion WHERE sede_id = s.id)`,
    [arregloPg(SEDES)], tx);
}

// ── Siembra ───────────────────────────────────────────────────────────────────────────────────

async function sembrar(tx, clave) {
  const resumen = { creados: {}, existentes: {} };
  const contar = (tabla, creado) => {
    const g = creado ? resumen.creados : resumen.existentes;
    g[tabla] = (g[tabla] || 0) + 1;
  };

  // 1) Sedes (UNIQUE sede.nombre)
  const sedeId = {};
  for (const nombre of SEDES) {
    const r = await buscarOCrear(tx,
      'SELECT id FROM sedes WHERE nombre = $1', [nombre],
      'INSERT INTO sedes (nombre) VALUES ($1) ON CONFLICT (nombre) DO NOTHING RETURNING id', [nombre]);
    sedeId[nombre] = r.id;
    contar('sedes', r.creado);
  }

  // 2) Usuarios del panel: 2 secretarias (sede fija) + 1 admin consolidado (sede_id NULL). UNIQUE email.
  const hash = await bcrypt.hash(clave, 12);
  for (const a of ADMINS) {
    const r = await buscarOCrear(tx,
      'SELECT id FROM usuarios_admin WHERE email = $1', [a.email],
      `INSERT INTO usuarios_admin (nombre, email, password_hash, rol, sede_id)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING RETURNING id`,
      [a.nombre, a.email, hash, a.rol, a.sede ? sedeId[a.sede] : null]);
    contar('usuarios_admin', r.creado);
  }

  // 3) Matrícula de prueba: la migración 003 la deja en 0.00 (inscripciones bloqueadas). Se fija SOLO si el valor actual es <= 0;
  //    una matrícula ya configurada por la academia no se toca. (CASE evita castear valores no numéricos.)
  const p = await ejecutar(
    `INSERT INTO parametros (clave, valor) VALUES ($1, $2)
     ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor, actualizado_en = NOW()
      WHERE CASE WHEN parametros.valor ~ '^[0-9]+(\.[0-9]+)?$' THEN parametros.valor::numeric <= 0 ELSE FALSE END`,
    ['MATRICULA_USD', '120.00'], tx);
  contar('parametros', p.rowCount > 0);

  // 4) Cuentas de cobro: común (sede_id NULL) + por sede. Sin UNIQUE en la tabla → verificación previa.
  for (const c of CUENTAS) {
    const sid = c.sede ? sedeId[c.sede] : null;
    const r = await buscarOCrear(tx,
      'SELECT id FROM cuentas_pago WHERE metodo = $1 AND titular = $2 AND sede_id IS NOT DISTINCT FROM $3::int', [c.metodo, c.titular, sid],
      'INSERT INTO cuentas_pago (metodo, titular, detalle, activa, sede_id) VALUES ($1, $2, $3, TRUE, $4) RETURNING id',
      [c.metodo, c.titular, c.detalle, sid]);
    contar('cuentas_pago', r.creado);
  }

  // 5) Representantes → estudiantes → cuotas → referencias de pago
  const estudiantes = [];
  for (const a of ALUMNOS) {
    const rep = await buscarOCrear(tx,
      'SELECT id FROM representantes WHERE cedula = $1', [a.rep.cedula],
      `INSERT INTO representantes (nombres, apellidos, cedula, email, telefono)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (cedula) DO NOTHING RETURNING id`,
      [a.rep.nombres, a.rep.apellidos, a.rep.cedula, a.rep.email, a.rep.telefono]);
    contar('representantes', rep.creado);

    // `estudiantes` no hereda sede (el trigger 006 es solo de cuotas/pagos): se asigna de forma explícita.
    const est = await buscarOCrear(tx,
      `SELECT id FROM estudiantes
        WHERE representante_id = $1 AND nombres = $2 AND apellidos = $3 AND fecha_nacimiento = $4::date`,
      [rep.id, a.est.nombres, a.est.apellidos, a.est.nacimiento],
      `INSERT INTO estudiantes (representante_id, nombres, apellidos, fecha_nacimiento, grado_solicitado, estatus_academico, sede_id)
       VALUES ($1, $2, $3, $4::date, $5, 'Activo', $6)
       ON CONFLICT (representante_id, nombres, apellidos, fecha_nacimiento) DO NOTHING RETURNING id`,
      [rep.id, a.est.nombres, a.est.apellidos, a.est.nacimiento, a.est.grado, sedeId[a.sede]]);
    contar('estudiantes', est.creado);
    estudiantes.push({ id: est.id, esperado: a.esperado, sede: a.sede });

    // Cuotas SIN sede_id: la hereda el trigger fn_heredar_sede_estudiante.
    const cuotaIds = [];
    for (const q of a.cuotas) {
      const cu = await buscarOCrear(tx,
        'SELECT id FROM cuotas WHERE estudiante_id = $1 AND concepto = $2 AND estado <> $3', [est.id, q.concepto, 'Anulada'],
        `INSERT INTO cuotas (estudiante_id, tipo, concepto, monto_usd, fecha_vencimiento, estado)
         VALUES ($1, $2, $3, $4::numeric, ((NOW() AT TIME ZONE 'America/Caracas')::date + $5::int), $6)
         RETURNING id`,
        [est.id, q.tipo, q.concepto, q.monto, q.dias, q.estado]);
      cuotaIds.push(cu.id);
      contar('cuotas', cu.creado);
    }

    // Referencia en la bandeja de auditoría ('Por Validar'); la cuota asociada ya está 'En Revisión'. Sin sede_id (trigger).
    if (a.pago) {
      const pg = await buscarOCrear(tx,
        'SELECT id FROM pagos_referencias WHERE metodo_pago = $1 AND referencia = $2 AND estado <> $3', [a.pago.metodo, a.pago.referencia, 'Rechazada'],
        `INSERT INTO pagos_referencias (cuota_id, estudiante_id, referencia, metodo_pago, monto_usd, tasa_bcv, monto_bs, estado)
         VALUES ($1, $2, $3, $4, $5::numeric, $6::numeric, ROUND($5::numeric * $6::numeric, 2), 'Por Validar')
         RETURNING id`,
        [cuotaIds[a.pago.cuota], est.id, a.pago.referencia, a.pago.metodo, a.pago.monto, TASA_PRUEBA]);
      contar('pagos_referencias', pg.creado);
    }
  }
  return { resumen, estudiantes, sedeId };
}

// ── Verificación (si algo falla → ROLLBACK de todo) ───────────────────────────────────────────

async function verificar(tx, { estudiantes, sedeId }) {
  const ids = estudiantes.map((e) => e.id);
  const idsPg = arregloPg(ids);
  const checks = [];
  const registrar = (nombre, ok, detalle = null) => checks.push({ comprobacion: nombre, ok, detalle });

  const nSede = async (texto, params) => Number((await uno(texto, params, tx)).n);

  registrar('cuotas heredan sede_id del estudiante (trigger 006)',
    (await nSede(
      `SELECT COUNT(*)::int AS n FROM cuotas AS c JOIN estudiantes AS e ON e.id = c.estudiante_id
        WHERE c.estudiante_id = ANY($1::int[]) AND COALESCE(c.sede_id, 0) <> COALESCE(e.sede_id, 0)`, [idsPg])) === 0);
  registrar('pagos_referencias heredan sede_id del estudiante (trigger 006)',
    (await nSede(
      `SELECT COUNT(*)::int AS n FROM pagos_referencias AS p JOIN estudiantes AS e ON e.id = p.estudiante_id
        WHERE p.estudiante_id = ANY($1::int[]) AND COALESCE(p.sede_id, 0) <> COALESCE(e.sede_id, 0)`, [idsPg])) === 0);

  // Estado dinámico: Moroso ⇔ cuota vencida sin pagar; el resto 'Activo' (vw_estudiantes_estado).
  const vista = await ejecutar('SELECT id, estado_dinamico FROM vw_estudiantes_estado WHERE id = ANY($1::int[])', [idsPg], tx);
  const dinamico = new Map(vista.rows.map((r) => [r.id, r.estado_dinamico]));
  const malos = estudiantes.filter((e) => dinamico.get(e.id) !== e.esperado).map((e) => ({ id: e.id, esperado: e.esperado, real: dinamico.get(e.id) || null }));
  registrar('estado dinámico: 3 Activo + 2 Moroso', malos.length === 0, malos.length ? malos : null);

  // Aislamiento: el MISMO predicado de la aplicación para cada alcance (entero = secretaria, NULL = consolidado).
  const ver = (sede) => nSede(
    `SELECT COUNT(DISTINCT c.estudiante_id)::int AS n FROM cuotas AS c
      WHERE c.estudiante_id = ANY($2::int[]) AND ($1::int IS NULL OR c.sede_id = $1::int)`,
    [sede, idsPg]);
  const enA = estudiantes.filter((e) => e.sede === SEDES[0]).length;
  const enB = estudiantes.filter((e) => e.sede === SEDES[1]).length;
  registrar(`secretaria Acarigua ve solo sus ${enA} estudiantes`, (await ver(sedeId[SEDES[0]])) === enA);
  registrar(`secretaria Barquisimeto ve solo sus ${enB} estudiantes`, (await ver(sedeId[SEDES[1]])) === enB);
  registrar(`consolidado (sede_id NULL) ve los ${ids.length}`, (await ver(null)) === ids.length);

  // Cuentas visibles por sede = comunes + propias (misma consulta que parametros.service.cuentasActivas).
  const cuentas = async (sede) => nSede(
    `SELECT COUNT(*)::int AS n FROM cuentas_pago WHERE activa = TRUE AND titular LIKE $2 AND (sede_id IS NULL OR sede_id = $1::int)`,
    [sede, '% (prueba)']);
  registrar('portal público: sede Acarigua = 1 común + 1 propia', (await cuentas(sedeId[SEDES[0]])) === 2);
  registrar('portal público: sede Barquisimeto = 1 común + 1 propia', (await cuentas(sedeId[SEDES[1]])) === 2);
  registrar('sin invitación (sede NULL) solo las comunes', (await cuentas(null)) === 1);

  registrar('usuarios: secretarias con sede y admin consolidado sin sede',
    (await nSede(
      `SELECT COUNT(*)::int AS n FROM usuarios_admin
        WHERE email LIKE $1 AND ((rol = 'secretaria' AND sede_id IS NULL) OR (rol = 'admin' AND sede_id IS NOT NULL))`, [`%${DOMINIO}`])) === 0);

  // RLS (004/006), prueba FUNCIONAL: se asume el rol de la API REST de Supabase y se intenta leer. Debe fallar con 42501
  // (REVOKE) o devolver 0 filas (RLS sin políticas). Cada intento va en un SAVEPOINT y se revierte (el SET LOCAL ROLE no persiste).
  // Si el rol no existe (PostgreSQL común, no Supabase) la comprobación no aplica y se informa como tal.
  const exposiciones = [];
  let aplicable = false;
  for (const [rol, setRol] of Object.entries(ROLES_API)) {
    for (const [tabla, lectura] of Object.entries(LECTURAS_RLS)) {
      await ejecutar('SAVEPOINT bma_rls', [], tx);
      try {
        await ejecutar(setRol, [], tx);
        aplicable = true;
        const n = Number((await uno(lectura, [], tx)).n);
        if (n > 0) exposiciones.push(`${rol} lee ${n} fila(s) de ${tabla}`);
      } catch (err) {
        if (err && err.code === '22023') break; // el rol no existe en este servidor → no aplica
        if (!err || err.code !== '42501') throw err; // cualquier error distinto de "permiso denegado" es un fallo real
      } finally {
        await ejecutar('ROLLBACK TO SAVEPOINT bma_rls', [], tx);
      }
    }
  }
  registrar(aplicable ? 'RLS: anon/authenticated no leen cuotas, estudiantes ni pagos_referencias' : 'RLS: roles anon/authenticated inexistentes (PostgreSQL común) — no aplica',
    exposiciones.length === 0, exposiciones.length ? exposiciones : null);

  return checks;
}

// ── Main ──────────────────────────────────────────────────────────────────────────────────────

async function main() {
  if (cfg.esProduccion && process.env.SEED_ALLOW_PROD !== '1') {
    throw new Error('Seed bloqueado con NODE_ENV=production. Define SEED_ALLOW_PROD=1 solo si es intencional.');
  }
  const haceReset = process.argv.includes('--reset');
  const clave = contrasenaDePrueba();

  const salida = await conTransaccion(async (tx) => {
    if (haceReset) await reset(tx);
    const sembrado = await sembrar(tx, clave.valor);
    const checks = await verificar(tx, sembrado);
    const fallidas = checks.filter((c) => !c.ok);
    if (fallidas.length) {
      const err = new Error(`Verificación fallida: ${fallidas.map((c) => c.comprobacion).join(' | ')}`);
      err.code = 'SEED_VERIFICACION';
      err.detail = JSON.stringify(fallidas);
      throw err; // → ROLLBACK
    }
    return { ...sembrado.resumen, checks };
  });

  const salidaOk = { ok: true, reset: haceReset, ...salida };
  if (clave.generada && (salida.creados.usuarios_admin || 0) > 0) {
    salidaOk.credenciales_prueba = { aviso: 'Se muestran una sola vez. Define SEED_PASSWORD para fijarlas.', usuarios: ADMINS.map((a) => a.email), contrasena: clave.valor };
  }
  console.log(JSON.stringify(salidaOk, null, 2));
}

main()
  .catch((err) => {
    console.error(JSON.stringify(errorJson(err), null, 2));
    process.exitCode = 1;
  })
  .finally(() => closePool());
