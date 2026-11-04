'use strict';
/**
 * Planilla de Inscripción oficial (MPPE) — validación y normalización de lo que NO es un campo suelto:
 *   · ficha médica del estudiante (¿alérgico?, ¿bajo tratamiento? + explicación),
 *   · estructura DUAL de representantes (Madre / Padre) con un representante PRINCIPAL (contacto de cobro y de WhatsApp),
 *   · personas autorizadas para retirar al menor (máximo 2).
 *
 * Interfaz pequeña a propósito: `normalizarPlanilla(body)` devuelve `{ valores, detalles }`. NUNCA lanza por datos inválidos (acumula
 * `detalles: [{campo, mensaje}]` para que el controlador devuelva UN solo 422 con todo) y NUNCA toca la base de datos.
 */
const { validar } = require('./validar');
const { AppError } = require('../errors/AppError');
const { sanitizarTelefono } = require('./telefono');
const { hoyCaracas } = require('./fechas');

const CEDULA = { patron: /^[A-Za-z0-9.-]{4,20}$/, mensajePatron: 'Solo letras, números, puntos y guiones (4 a 20).' };
const MAX_PERSONAS_AUTORIZADAS = 2;
const PROGENITORES = ['madre', 'padre'];
const ETIQUETA = { madre: 'la madre', padre: 'el padre' };
const SI_NO = { tipo: 'enum', valores: ['SI', 'NO'] };

/** Reglas declarativas (mismo validador que el resto del formulario) de los campos de texto de la planilla. */
const REGLAS_PLANILLA = {
  alumno_lugar_nacimiento: { max: 150 },
  alumno_lugar_estudio: { max: 150 },
  horario_preferido: { max: 50 },
  es_alergico: SI_NO,
  bajo_tratamiento: SI_NO,
  tratamiento_explicacion: { max: 500 },
  representante_principal: { tipo: 'enum', valores: ['MADRE', 'PADRE'] },
  ...Object.fromEntries(PROGENITORES.flatMap((p) => [
    [`${p}_nombres`, { max: 100 }],
    [`${p}_apellidos`, { max: 100 }],
    [`${p}_cedula`, { max: 20, ...CEDULA }],
    [`${p}_edad`, { tipo: 'entero', min: 14, max: 120 }],
    [`${p}_fecha_nacimiento`, { tipo: 'fechaPasada', min: '1900-01-01' }],
    [`${p}_direccion`, { max: 250 }],
    [`${p}_email`, { tipo: 'email', max: 100 }],
  ])),
};

const REGLAS_AUTORIZADA = { nombre: { max: 150 }, parentesco: { max: 50 } };

/** Años cumplidos a `hoy` ('AAAA-MM-DD' ambas). */
function edadEnAnios(nacimiento, hoy) {
  const [ny, nm, nd] = nacimiento.split('-').map(Number);
  const [hy, hm, hd] = hoy.split('-').map(Number);
  return hy - ny - (hm < nm || (hm === nm && hd < nd) ? 1 : 0);
}

const lleno = (v) => v !== undefined && v !== null && String(v).trim() !== '';

/**
 * @param {Record<string, unknown>} body  Cuerpo crudo (multipart ya parseado).
 * @param {{ hoy?: string }} [opciones]
 * @returns {{ valores: object, detalles: {campo: string, mensaje: string}[] }}
 *   `valores` trae SOLO claves nuevas de la planilla; el controlador las mezcla con las del formulario clásico.
 */
function normalizarPlanilla(body, { hoy = hoyCaracas() } = {}) {
  const src = body && typeof body === 'object' ? body : {};
  const detalles = [];
  // Campo por campo: `validar` lanza al primer lote de errores y dejaría TODO vacío, lo que inventaría faltantes en cascada
  // (p. ej. «madre_nombres es obligatorio» cuando solo falló la edad del padre).
  const v = {};
  for (const [campo, regla] of Object.entries(REGLAS_PLANILLA)) {
    try {
      Object.assign(v, validar({ [campo]: src[campo] }, { [campo]: regla }));
    } catch (e) {
      if (e instanceof AppError) detalles.push(...e.detalles); else throw e;
    }
  }
  const yaFallo = (campo) => detalles.some((d) => d.campo === campo);
  const err = (campo, mensaje) => { if (!yaFallo(campo)) detalles.push({ campo, mensaje }); };
  const telefono = (campo, ...partes) => {
    try { return sanitizarTelefono(...partes); } catch (e) {
      err(campo, e.detalles?.[0]?.mensaje || 'Teléfono inválido.');
      return null;
    }
  };

  // ── Ficha médica ─────────────────────────────────────────────────────────────────────────────
  const valores = {};
  const alergias = lleno(src.alergias) ? String(src.alergias).trim() : null;
  if (v.es_alergico === 'SI' && !alergias) err('alergias', 'Explica a qué es alérgico.');
  // «NO» manda sobre cualquier texto residual en `alergias`: lo aplica el controlador con este valor.
  valores.es_alergico = v.es_alergico ?? null;

  valores.bajo_tratamiento = v.bajo_tratamiento === 'SI';
  if (v.bajo_tratamiento === 'SI' && !v.tratamiento_explicacion) err('tratamiento_explicacion', 'Explica el tratamiento médico.');
  valores.tratamiento_explicacion = v.bajo_tratamiento === 'SI' ? (v.tratamiento_explicacion ?? null) : null;

  valores.lugar_nacimiento = v.alumno_lugar_nacimiento ?? null;
  valores.lugar_estudio = v.alumno_lugar_estudio ?? null;
  valores.horario_preferido = v.horario_preferido ?? null;

  // ── Madre y Padre ────────────────────────────────────────────────────────────────────────────
  const progenitor = {};
  for (const p of PROGENITORES) {
    const campos = ['nombres', 'apellidos', 'cedula', 'edad', 'fecha_nacimiento', 'direccion', 'email'];
    const f = Object.fromEntries(campos.map((c) => [c, v[`${p}_${c}`] ?? null]));
    const fijoCrudo = src[`${p}_telefono_fijo`];
    const movilCrudo = src[`${p}_telefono_movil`];
    f.telefono_fijo = lleno(fijoCrudo) ? telefono(`${p}_telefono_fijo`, fijoCrudo) : null;
    f.telefono_movil = lleno(movilCrudo) ? telefono(`${p}_telefono_movil`, movilCrudo) : null;
    // La edad se DEDUCE de la fecha de nacimiento cuando viene (una edad enviada a mano nunca contradice a la fecha).
    if (f.fecha_nacimiento) {
      const e = edadEnAnios(f.fecha_nacimiento, hoy);
      if (e < 14) err(`${p}_fecha_nacimiento`, `La fecha de nacimiento de ${ETIQUETA[p]} no es coherente (edad calculada: ${e}).`);
      else f.edad = e;
    }
    const algo = Object.values(f).some((x) => x !== null);
    progenitor[p] = { datos: f, presente: algo };
    if (algo) {
      if (!f.nombres) err(`${p}_nombres`, `Es obligatorio si se registra ${ETIQUETA[p]}.`);
      if (!f.apellidos) err(`${p}_apellidos`, `Es obligatorio si se registra ${ETIQUETA[p]}.`);
    }
  }

  // ── Representante principal (quien paga y recibe WhatsApp) ───────────────────────────────────
  const principal = v.representante_principal ?? null; // 'MADRE' | 'PADRE' | null (formulario clásico)
  if (principal !== null) {
    const clave = principal.toLowerCase();
    const f = progenitor[clave].datos;
    if (!f.nombres) err(`${clave}_nombres`, `Es obligatorio: ${ETIQUETA[clave]} es el representante principal.`);
    if (!f.apellidos) err(`${clave}_apellidos`, `Es obligatorio: ${ETIQUETA[clave]} es el representante principal.`);
    if (!f.cedula) err(`${clave}_cedula`, `Es obligatorio: ${ETIQUETA[clave]} es el representante principal.`);
    if (!f.telefono_movil) err(`${clave}_telefono_movil`, `Es obligatorio: por este WhatsApp llegan los avisos de cobro (${ETIQUETA[clave]} es el representante principal).`);
    valores.principal = {
      nombres: f.nombres, apellidos: f.apellidos, cedula: f.cedula, email: f.email, telefono: f.telefono_movil,
    };
  } else {
    valores.principal = null;
  }
  valores.madre = progenitor.madre.datos;
  valores.padre = progenitor.padre.datos;

  // ── Personas autorizadas a retirar al menor (hasta 2) ────────────────────────────────────────
  const personas = [];
  for (let i = 1; i <= MAX_PERSONAS_AUTORIZADAS; i += 1) {
    const crudo = { nombre: src[`autorizada_${i}_nombre`], telefono: src[`autorizada_${i}_telefono`], parentesco: src[`autorizada_${i}_parentesco`] };
    if (!Object.values(crudo).some(lleno)) continue; // fila vacía: no cuenta
    let limpio = {};
    try {
      limpio = validar({ nombre: crudo.nombre, parentesco: crudo.parentesco }, REGLAS_AUTORIZADA);
    } catch (e) {
      if (!(e instanceof AppError)) throw e;
      for (const d of e.detalles) err(`autorizada_${i}_${d.campo}`, d.mensaje);
    }
    if (!lleno(crudo.nombre)) err(`autorizada_${i}_nombre`, 'Nombre y apellido: es obligatorio.');
    if (!lleno(crudo.parentesco)) err(`autorizada_${i}_parentesco`, 'Parentesco: es obligatorio.');
    const tel = lleno(crudo.telefono) ? telefono(`autorizada_${i}_telefono`, crudo.telefono) : (err(`autorizada_${i}_telefono`, 'Teléfono: es obligatorio.'), null);
    personas.push({ nombre: limpio.nombre ?? null, telefono: tel, parentesco: limpio.parentesco ?? null });
  }
  if (lleno(src[`autorizada_${MAX_PERSONAS_AUTORIZADAS + 1}_nombre`])) {
    err(`autorizada_${MAX_PERSONAS_AUTORIZADAS + 1}_nombre`, `Solo se admiten ${MAX_PERSONAS_AUTORIZADAS} personas autorizadas.`);
  }
  valores.personas_autorizadas = personas;

  return { valores, detalles };
}

module.exports = { normalizarPlanilla, edadEnAnios, CEDULA, MAX_PERSONAS_AUTORIZADAS };
