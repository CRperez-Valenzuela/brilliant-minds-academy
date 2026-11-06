'use strict';
/**
 * Ingesta de producción: alumnos de la SEDE ESTE (Fundalara) desde el Excel de la academia.
 *
 *   node scripts/importar_este.js --archivo "/ruta/Datos_Academia_BMA_-_Sede_Este.xlsx" [--dry-run] [--vence AAAA-MM-DD] [--monto 25]
 *   (o IMPORT_ESTE_ARCHIVO=/ruta/archivo.xlsx)
 *
 * Los datos de menores y representantes NO viven en el repositorio: el script lee el archivo desde una ruta local y nunca imprime
 * nombres ni teléfonos (el informe solo cita hoja y fila). Reglas:
 *  - Cada alumno se ata RÍGIDAMENTE a la sede cuyo nombre es exactamente 'Sede Este' (debe existir: `npm run migrate` + seed o alta en Sedes).
 *  - Nivel = grupo del bloque de la hoja: Kids 1 A/B/C · Beginner A/B/C · Adultos. Un alumno sin nivel reconocible se omite y se informa.
 *  - Representante: se crea o reutiliza (mismo nombre + teléfono → una sola ficha para hermanos; un alumno «Adultos» sin representante es el suyo propio). El Excel no trae cédula: se asigna una
 *    PROVISIONAL determinista «IMP-XXXXXXXXXXXX» (única, estable entre ejecuciones) que la administración debe reemplazar por la real.
 *    Un representante ya existente conserva sus datos (el correo solo se rellena si estaba vacío).
 *  - El Excel trae edad, no fecha de nacimiento: se guarda una fecha APROXIMADA (1 de julio de [año de inscripción − edad]) y se informa el conteo.
 *  - Estudiante 'Activo' y cuota inicial de MATRÍCULA 'Pendiente' (monto = parámetro MATRICULA_USD o --monto; vence hoy + 30 días o --vence),
 *    creada una sola vez por estudiante: ejecutar el script dos veces no duplica nada.
 *  - Todo en UNA transacción (todo o nada). --dry-run ejecuta y revierte para ver el informe sin escribir.
 * SQL siempre con parámetros posicionales ($1, $2, …).
 */
require('dotenv').config({ path: require('node:path').resolve(__dirname, '..', '.env') });
const crypto = require('node:crypto');
const { ejecutar, conTransaccion, closePool } = require('../config/db');
const { hoyCaracas } = require('../utils/fechas');

const SEDE_ESTE = 'Sede Este';
const MAX_NOMBRE = 100;
const DIAS_VENCIMIENTO_POR_DEFECTO = 30;

// ── Parseo puro (sin base de datos; cubierto por tests/importar-este.test.js con datos sintéticos) ─────────────────────────────

const texto = (v) => {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object' && 'text' in v) return String(v.text).trim(); // celdas enriquecidas / hipervínculos de ExcelJS
  if (typeof v === 'object' && 'result' in v) return String(v.result ?? '').trim(); // fórmulas
  return String(v).trim();
};

const ARTICULOS = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'e']);

/** Colapsa espacios, quita caracteres de control y símbolos ajenos a un nombre; pasa a Título si venía todo en mayúsculas o minúsculas. */
function sanearNombre(crudo) {
  let s = texto(crudo).normalize('NFC').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/[^\p{L}\p{M}\s'.-]/gu, ' ').replace(/\s+/g, ' ').trim();
  if (s !== '' && (s === s.toUpperCase() || s === s.toLowerCase())) {
    s = s.toLowerCase().split(' ').map((p, i) => (i > 0 && ARTICULOS.has(p) ? p : p.charAt(0).toUpperCase() + p.slice(1))).join(' ');
  }
  return s.slice(0, MAX_NOMBRE).trim();
}

/** Nombre completo del representante → { nombres, apellidos }. 1 palabra: apellido «-»; 2: 1+1; 3: 1+2; 4 o más: mitad y mitad. Revisable luego en el CRM. */
function partirNombreCompleto(crudo) {
  const p = sanearNombre(crudo).split(' ').filter(Boolean);
  if (p.length === 0) return null;
  if (p.length === 1) return { nombres: p[0], apellidos: '-' };
  const corte = p.length === 2 ? 1 : p.length === 3 ? 1 : Math.ceil(p.length / 2);
  return { nombres: p.slice(0, corte).join(' '), apellidos: p.slice(corte).join(' ') };
}

/** Teléfono → solo dígitos, 10–15, sin espacios (CHECK de la base). Acepta «0414-1234567», «+58 414 1234567» y celulares sin el 0 inicial. null si no sirve. */
function sanearTelefono(crudo) {
  for (const trozo of texto(crudo).split(/[\/,;]|\sy\s/i)) {
    let d = trozo.replace(/\D/g, '');
    if (d.startsWith('58') && d.length === 12) d = `0${d.slice(2)}`;
    else if (d.length === 10 && d.startsWith('4')) d = `0${d}`;
    if (d.length >= 10 && d.length <= 15) return d;
  }
  return null;
}

function sanearCorreo(crudo) {
  const c = texto(crudo).split(/[\s;,]+/)[0]?.toLowerCase() ?? '';
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c) && c.length <= 160 ? c : null;
}

/** Fecha de inscripción (Date de Excel o texto «AAAA-MM-DD…») → año. */
function anioDeInscripcion(v, anioPorDefecto) {
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v.getUTCFullYear();
  const m = /^(\d{4})-\d{2}-\d{2}/.exec(texto(v));
  return m ? Number(m[1]) : anioPorDefecto;
}

/** Edad (número o «7 años») → entero 1–99, o null. */
function leerEdad(v) {
  const n = Number.parseInt(texto(v).replace(/\D/g, ''), 10);
  return Number.isInteger(n) && n >= 1 && n <= 99 ? n : null;
}

const fechaNacimientoAproximada = (anioInscripcion, edad) => `${anioInscripcion - edad}-07-01`;

/** Cédula PROVISIONAL determinista (≤ 20 caracteres): mismo representante + teléfono → misma cédula en cada ejecución. */
function cedulaProvisional(nombreCompleto, telefono) {
  const base = `${nombreCompleto.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()}|${telefono}`;
  return `IMP-${crypto.createHash('sha256').update(base).digest('hex').slice(0, 12).toUpperCase()}`;
}

const INICIO_BLOQUE = /^\s*\d+(?:\.\d+)?\s*\.?\s*(?:mi[eé]rcoles|s[aá]bado|teacher|personalizado)/i;

/** Texto de una celda de grupo → nivel oficial de la Sede Este, o null. */
function nivelDeTexto(t) {
  let m = /kids\s*1\s*\(?\s*([abc])\b/i.exec(t);
  if (m) return `Kids 1 ${m[1].toUpperCase()}`;
  m = /beginner\s*\(?\s*([abc])\b/i.exec(t);
  if (m) return `Beginner ${m[1].toUpperCase()}`;
  if (/adultos?/i.test(t)) return 'Adultos';
  return null;
}

function normalizarEncabezado(t) {
  return texto(t).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Matriz de una hoja (filas × columnas, índice 0) → alumnos y anomalías. Una hoja se organiza en BLOQUES de grupo: la celda de la columna A
 * que abre cada bloque («1.Miércoles y viernes», «3.1 Sábado»…) y las siguientes (nivel, profesor, horario) describen a todos los alumnos
 * hasta el próximo bloque. Devuelve { alumnos: [{ hoja, fila, nivel, apellidos, nombres, edad, anioInscripcion, representante, telefono, correo }], anomalias }.
 */
function leerHoja(matriz, nombreHoja, anioPorDefecto) {
  const anomalias = [];
  const iEnc = matriz.findIndex((f) => f.some((c) => normalizarEncabezado(c) === 'num') && f.some((c) => normalizarEncabezado(c).startsWith('apellido')));
  if (iEnc < 0) return { alumnos: [], anomalias: [{ hoja: nombreHoja, fila: 0, motivo: 'no se encontró la fila de encabezados (Num / Apellido(s))' }] };
  const col = {};
  matriz[iEnc].forEach((c, i) => {
    const h = normalizarEncabezado(c);
    if (h.startsWith('apellido')) col.apellidos = i;
    else if (h.startsWith('nombre(s)') || h === 'nombre(s)' || h === 'nombres') col.nombres = i;
    else if (h === 'edad') col.edad = i;
    else if (h.startsWith('fecha de inscripcion')) col.inscripcion = i;
    else if (h.startsWith('nombre del representante')) col.representante = i;
    else if (h.startsWith('telefono')) col.telefono = i;
    else if (h.startsWith('correo')) col.correo = i;
  });
  for (const k of ['apellidos', 'nombres', 'edad', 'representante', 'telefono']) {
    if (col[k] === undefined) return { alumnos: [], anomalias: [{ hoja: nombreHoja, fila: iEnc + 1, motivo: `falta la columna «${k}»` }] };
  }

  // 1) bloques de grupo: fila de inicio → nivel (primer texto de la columna A del bloque que nombre un nivel)
  const bloques = [];
  for (let i = iEnc + 1; i < matriz.length; i += 1) {
    const a = texto(matriz[i]?.[0]);
    if (a === '') continue;
    if (bloques.length === 0 || INICIO_BLOQUE.test(a)) bloques.push({ desde: i, nivel: null });
    const b = bloques[bloques.length - 1];
    b.nivel ??= nivelDeTexto(a);
  }
  const nivelDeFila = (i) => {
    let n = null;
    for (const b of bloques) if (b.desde <= i) n = b;
    return n ? n.nivel : null;
  };

  // 2) alumnos
  const alumnos = [];
  for (let i = iEnc + 1; i < matriz.length; i += 1) {
    const f = matriz[i] ?? [];
    const apellidos = sanearNombre(f[col.apellidos]);
    const nombres = sanearNombre(f[col.nombres]);
    if (apellidos === '' && nombres === '') continue;
    const fila = i + 1;
    const falla = (motivo) => anomalias.push({ hoja: nombreHoja, fila, motivo });
    if (apellidos === '' || nombres === '') { falla('alumno sin nombre o sin apellido'); continue; }
    const nivel = nivelDeFila(i);
    if (nivel === null) { falla('sin nivel reconocible en su bloque (¿grupo «Personalizado»?)'); continue; }
    const edad = leerEdad(f[col.edad]);
    if (edad === null) { falla('edad ausente o inválida'); continue; }
    let rep = partirNombreCompleto(f[col.representante]);
    if (rep === null && nivel === 'Adultos') rep = { nombres, apellidos }; // un adulto es su propio representante
    if (rep === null) { falla('sin nombre de representante'); continue; }
    const telefono = sanearTelefono(f[col.telefono]);
    if (telefono === null) { falla('teléfono del representante ausente o inválido (10–15 dígitos)'); continue; }
    alumnos.push({
      hoja: nombreHoja, fila, nivel, apellidos, nombres, edad,
      anioInscripcion: anioDeInscripcion(col.inscripcion === undefined ? null : f[col.inscripcion], anioPorDefecto),
      representante: rep, telefono, correo: col.correo === undefined ? null : sanearCorreo(f[col.correo]),
    });
  }
  return { alumnos, anomalias };
}

// ── Base de datos ($1…$n) ───────────────────────────────────────────────────────────────────────────────────────────────────────

async function importar(tx, alumnos, { vence, monto }) {
  const sede = (await ejecutar('SELECT id FROM sedes WHERE nombre = $1', [SEDE_ESTE], tx)).rows[0];
  if (!sede) throw new Error(`No existe la sede «${SEDE_ESTE}». Aplica las migraciones y crea la sede (seed o pantalla Sedes) antes de importar.`);
  const r = { representantesNuevos: 0, representantesExistentes: 0, estudiantesNuevos: 0, estudiantesExistentes: 0, cuotasNuevas: 0, cuotasExistentes: 0 };

  for (const a of alumnos) {
    const nombreRep = `${a.representante.nombres} ${a.representante.apellidos}`;
    const rep = (await ejecutar(
      `INSERT INTO representantes (nombres, apellidos, cedula, email, telefono)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (cedula) DO UPDATE SET email = COALESCE(representantes.email, EXCLUDED.email)
       RETURNING id, (xmax = 0) AS creado`,
      [a.representante.nombres, a.representante.apellidos, cedulaProvisional(nombreRep, a.telefono), a.correo, a.telefono], tx)).rows[0];
    if (rep.creado) r.representantesNuevos += 1; else r.representantesExistentes += 1;

    const fechaNac = fechaNacimientoAproximada(a.anioInscripcion, a.edad);
    let est = (await ejecutar(
      `INSERT INTO estudiantes (representante_id, nombres, apellidos, fecha_nacimiento, grado_solicitado, estatus_academico, sede_id)
       VALUES ($1, $2, $3, $4::date, $5, 'Activo', $6)
       ON CONFLICT (representante_id, nombres, apellidos, fecha_nacimiento) DO NOTHING
       RETURNING id`,
      [rep.id, a.nombres, a.apellidos, fechaNac, a.nivel, sede.id], tx)).rows[0];
    if (est) {
      r.estudiantesNuevos += 1;
    } else {
      // Ya existía: se relee su id (no se modifica nada de su ficha).
      est = (await ejecutar(
        'SELECT id FROM estudiantes WHERE representante_id = $1 AND nombres = $2 AND apellidos = $3 AND fecha_nacimiento = $4::date',
        [rep.id, a.nombres, a.apellidos, fechaNac], tx)).rows[0];
      r.estudiantesExistentes += 1;
    }

    // Cuota inicial: una sola MATRÍCULA vigente por estudiante (el trigger 006 le hereda la sede).
    const cuota = (await ejecutar(
      `INSERT INTO cuotas (estudiante_id, tipo, concepto, monto_usd, fecha_vencimiento)
       SELECT $1, 'MATRICULA', 'Matrícula inicial', $2::numeric, $3::date
        WHERE NOT EXISTS (SELECT 1 FROM cuotas WHERE estudiante_id = $1 AND tipo = 'MATRICULA' AND estado <> 'Anulada')
       RETURNING id`,
      [est.id, monto, vence], tx)).rows[0];
    if (cuota) r.cuotasNuevas += 1; else r.cuotasExistentes += 1;
  }
  return r;
}

// ── Línea de comandos ───────────────────────────────────────────────────────────────────────────────────────────────────────────

function leerArgumentos(argv, env) {
  const o = { archivo: env.IMPORT_ESTE_ARCHIVO || '', dryRun: false, vence: '', monto: '' };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--dry-run') o.dryRun = true;
    else if (a === '--archivo') o.archivo = argv[++i] || '';
    else if (a === '--vence') o.vence = argv[++i] || '';
    else if (a === '--monto') o.monto = argv[++i] || '';
    else throw new Error(`Argumento desconocido: ${a}`);
  }
  if (!o.archivo) throw new Error('Indica el Excel con --archivo "/ruta/archivo.xlsx" (o IMPORT_ESTE_ARCHIVO).');
  if (o.vence && !/^\d{4}-\d{2}-\d{2}$/.test(o.vence)) throw new Error('--vence debe tener el formato AAAA-MM-DD.');
  if (o.monto && !(Number(o.monto) > 0)) throw new Error('--monto debe ser un número mayor que 0.');
  return o;
}

function sumarDias(fechaIso, dias) {
  const d = new Date(`${fechaIso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

async function leerLibro(ruta, anioPorDefecto) {
  const ExcelJS = require('exceljs');
  const libro = new ExcelJS.Workbook();
  await libro.xlsx.readFile(ruta);
  const alumnos = [];
  const anomalias = [];
  for (const hoja of libro.worksheets) {
    const matriz = [];
    hoja.eachRow({ includeEmpty: true }, (fila, n) => {
      const celdas = [];
      for (let c = 1; c <= 12; c += 1) celdas.push(fila.getCell(c).value);
      matriz[n - 1] = celdas;
    });
    for (let i = 0; i < matriz.length; i += 1) matriz[i] ??= [];
    const l = leerHoja(matriz, hoja.name.trim(), anioPorDefecto);
    alumnos.push(...l.alumnos);
    anomalias.push(...l.anomalias);
  }
  return { alumnos, anomalias };
}

async function main() {
  const o = leerArgumentos(process.argv.slice(2), process.env);
  const hoy = hoyCaracas();
  const { alumnos, anomalias } = await leerLibro(o.archivo, Number(hoy.slice(0, 4)));
  const vence = o.vence || sumarDias(hoy, DIAS_VENCIMIENTO_POR_DEFECTO);
  let resultado;
  const SENTINELA = new Error('dry-run');
  try {
    await conTransaccion(async (tx) => {
      let monto = Number(o.monto);
      if (!(monto > 0)) {
        const p = (await ejecutar(`SELECT valor FROM parametros WHERE clave = 'MATRICULA_USD'`, [], tx)).rows[0];
        monto = Number(p?.valor);
      }
      if (!(monto > 0)) throw new Error('La matrícula no está configurada (MATRICULA_USD <= 0): configúrala en el panel o pasa --monto.');
      resultado = await importar(tx, alumnos, { vence, monto });
      if (o.dryRun) throw SENTINELA;
    });
  } catch (e) {
    if (e !== SENTINELA) throw e;
  }
  console.log(JSON.stringify({
    modo: o.dryRun ? 'dry-run (nada se escribió)' : 'importado', sede: SEDE_ESTE, leidos: alumnos.length + anomalias.length,
    aImportar: alumnos.length, omitidos: anomalias.length, ...resultado,
    fechasNacimientoAproximadas: alumnos.length, cedulasProvisionales: resultado.representantesNuevos, vencimientoMatricula: vence,
    omitidosDetalle: anomalias, // solo hoja, fila y motivo: sin datos personales
  }, null, 2));
}

module.exports = {
  sanearNombre, partirNombreCompleto, sanearTelefono, sanearCorreo, leerEdad, fechaNacimientoAproximada, cedulaProvisional, nivelDeTexto,
  leerHoja, leerArgumentos, importar, SEDE_ESTE,
};

if (require.main === module) {
  main().catch((err) => { console.error(err.message); process.exitCode = 1; }).finally(() => closePool());
}
