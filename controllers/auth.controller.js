'use strict';
const bcrypt = require('bcryptjs');
const { ejecutar } = require('../config/db');
const { e } = require('../errors/AppError');
const { firmarToken } = require('../middlewares/auth');
const { validar } = require('../utils/validar');
const { asyncHandler, ok } = require('../utils/http');

// Hash real calculado al arrancar: se compara igual cuando el correo no existe, para no revelar por tiempo de respuesta qué usuarios existen.
const HASH_SENTINELA = bcrypt.hashSync('sentinela-no-es-una-clave-real', 12);

const login = asyncHandler(async (req, res) => {
  const { email, password } = validar(req.body, { email: { tipo: 'email', requerido: true, max: 160 }, password: { requerido: true, max: 200 } });
  // `validar` ya normaliza el correo a minúsculas y crear-admin lo guarda así (PostgreSQL compara con distinción de mayúsculas).
  const r = await ejecutar('SELECT id, nombre, email, password_hash, rol, sede_id FROM usuarios_admin WHERE email = $1 AND activo = TRUE', [email]);
  const u = r.rows[0];
  const coincide = await bcrypt.compare(password, u ? u.password_hash : HASH_SENTINELA);
  if (!u || !coincide) throw e.noAutenticado('Correo o contraseña incorrectos.');
  ok(res, { token: firmarToken(u), usuario: { id: u.id, nombre: u.nombre, email: u.email, rol: u.rol, sede_id: u.sede_id } });
});

const me = asyncHandler(async (req, res) => ok(res, { usuario: req.usuario }));

module.exports = { login, me };
