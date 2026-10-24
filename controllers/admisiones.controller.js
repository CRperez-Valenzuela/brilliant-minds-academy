'use strict';
const multer = require('multer');
const cfg = require('../config/env');
const { AppError, e } = require('../errors/AppError');
const { validar } = require('../utils/validar');
const { sanitizarTelefono } = require('../utils/telefono');
const { detectarTipo } = require('../utils/archivos');
const { Semaforo } = require('../utils/semaforo');
const { asyncHandler, ok } = require('../utils/http');
const admisiones = require('../services/admisiones.service');
const invitaciones = require('../services/invitaciones.service');

const METODOS = ['ZELLE', 'BINANCE', 'PAYPAL', 'PAGO_MOVIL'];
const CEDULA = { patron: /^[A-Za-z0-9.-]{4,20}$/, mensajePatron: 'Solo letras, números, puntos y guiones (4 a 20).' };

const REGLAS = {
  alumno_nombres: { requerido: true, max: 100 },
  alumno_apellidos: { requerido: true, max: 100 },
  alumno_cedula: { max: 20, ...CEDULA },
  alumno_fecha_nacimiento: { tipo: 'fechaPasada', requerido: true, min: '1990-01-01' },
  // Con invitación el nivel lo fija el servidor (nivel_asignado) y el campo puede no llegar: la obligatoriedad se evalúa en prepararInscripcion.
  grado_solicitado: { max: 60 },
  invitacion: { max: 48, patron: /^[a-f0-9]{48}$/, mensajePatron: 'El enlace de invitación no es válido.' },
  colegio_procedencia: { max: 150 },
  ultimo_grado_aprobado: { max: 60 },
  tipo_sangre: { tipo: 'enum', valores: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
  alergias: { max: 500 },
  condiciones_medicas: { max: 500 },
  medicamentos: { max: 500 },
  emergencia_nombre: { max: 150 },
  representante_nombres: { requerido: true, max: 100 },
  representante_apellidos: { requerido: true, max: 100 },
  representante_cedula: { requerido: true, ...CEDULA },
  representante_email: { tipo: 'email', max: 160 },
  referencia_bancaria: { requerido: true, patron: /^[A-Za-z0-9-]{4,40}$/, mensajePatron: 'La referencia debe tener de 4 a 40 caracteres (letras, números o guiones, sin espacios).' },
  metodo_pago: { tipo: 'enum', valores: METODOS, requerido: true },
};

const DOCUMENTOS = [
  { campo: 'foto_carnet', tipo: 'FOTO_CARNET', permitidos: ['image/jpeg', 'image/png'] },
  { campo: 'cedula_identidad', tipo: 'CEDULA_IDENTIDAD', permitidos: ['image/jpeg', 'image/png', 'application/pdf'] },
  { campo: 'acta_nacimiento', tipo: 'ACTA_NACIMIENTO', permitidos: ['image/jpeg', 'image/png', 'application/pdf'] },
];

/** Valida campos + teléfonos (unificados sin espacios) + 3 documentos. Acumula TODOS los errores en un solo 422. */
function prepararInscripcion(body, files) {
  const detalles = [];
  let datos = {};
  try {
    datos = validar(body, REGLAS);
  } catch (err) {
    if (err instanceof AppError) detalles.push(...err.detalles); else throw err;
  }

  // Sin invitación el nivel lo elige la familia (obligatorio). Se lee del cuerpo crudo: si `validar` falló, `datos` está vacío y no debe duplicar errores.
  if (!body.invitacion && !String(body.grado_solicitado ?? '').trim()) detalles.push({ campo: 'grado_solicitado', mensaje: 'Es obligatorio.' });

  const unir = (campo, ...partes) => {
    try {
      return sanitizarTelefono(...partes);
    } catch (err) {
      detalles.push({ campo, mensaje: err.detalles?.[0]?.mensaje || 'Teléfono inválido.' });
      return null;
    }
  };
  // Se aceptan fragmentos (código + número) o un solo campo; en ambos casos se guarda UNA cadena sin espacios.
  datos.telefono = body.telefono || body.telefono_numero
    ? unir('telefono', body.telefono_codigo || '', body.telefono || body.telefono_numero)
    : (detalles.push({ campo: 'telefono', mensaje: 'Es obligatorio.' }), null);
  datos.emergencia_telefono = body.emergencia_telefono ? unir('emergencia_telefono', body.emergencia_telefono_codigo || '', body.emergencia_telefono) : null;

  const archivos = [];
  for (const d of DOCUMENTOS) {
    const f = files && files[d.campo] && files[d.campo][0];
    if (!f) { detalles.push({ campo: d.campo, mensaje: 'El documento es obligatorio.' }); continue; }
    const real = detectarTipo(f.buffer);
    if (!real || !d.permitidos.includes(real.mime)) {
      detalles.push({ campo: d.campo, mensaje: `Formato no permitido. Usa: ${d.permitidos.map((m) => m.split('/')[1].toUpperCase()).join(', ')}.` });
      continue;
    }
    archivos.push({ tipo: d.tipo, buffer: f.buffer, mime: real.mime, ext: real.ext });
  }

  if (detalles.length) throw e.validacion(detalles);
  return { datos, archivos };
}

// ── Cargas simultáneas: tope de concurrencia (RAM de buffers + transacciones abiertas durante la subida a Drive) ──
const semaforo = new Semaforo(cfg.admisiones.concurrenciaMax);
function limitarConcurrencia(_req, res, next) {
  const liberar = semaforo.intentar();
  if (!liberar) {
    return next(new AppError(503, 'SERVIDOR_OCUPADO', 'Hay muchas inscripciones en proceso. Intenta de nuevo en unos segundos.').conCabeceras({ 'Retry-After': '5' }));
  }
  res.on('close', liberar);
  return next();
}

const cargaArchivos = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: cfg.admisiones.maxArchivoMb * 1024 * 1024, files: 3, fields: 40, fieldSize: 16 * 1024 },
}).fields(DOCUMENTOS.map((d) => ({ name: d.campo, maxCount: 1 })));

const config = asyncHandler(async (_req, res) => ok(res, await admisiones.configPublica()));

/** GET /api/public/admisiones/invitacion/:token → sede, cuentas de cobro de la sede y nivel_asignado (bloqueado). 410 si el enlace no sirve. */
const invitacion = asyncHandler(async (req, res) => ok(res, await admisiones.configInvitacion(req.params.token)));

const inscribir = asyncHandler(async (req, res) => {
  const { datos, archivos } = prepararInscripcion(req.body || {}, req.files);
  // Con enlace de invitación: se resuelve en el servidor (sede + nivel). Lo que el cliente haya puesto en el campo de nivel se descarta.
  const inv = datos.invitacion ? await invitaciones.resolver(datos.invitacion) : null;
  const resultado = await admisiones.registrarInscripcion({ datos, archivos, invitacion: inv });
  ok(res, resultado, 201);
});

module.exports = { config, invitacion, inscribir, limitarConcurrencia, cargaArchivos, prepararInscripcion };
