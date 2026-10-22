'use strict';
const jwt = require('jsonwebtoken');
const cfg = require('../config/env');
const { e } = require('../errors/AppError');

function firmarToken(usuario) {
  return jwt.sign({ sub: usuario.id, rol: usuario.rol, nombre: usuario.nombre }, cfg.jwt.secret, {
    algorithm: 'HS256',
    expiresIn: cfg.jwt.expiraEn,
  });
}

/** Exige `Authorization: Bearer <jwt>`. Fija req.usuario = { id, rol, nombre }. */
function requireAuth(req, _res, next) {
  const cabecera = req.get('authorization') || '';
  const m = /^Bearer\s+(.+)$/i.exec(cabecera);
  if (!m) return next(e.noAutenticado());
  try {
    const p = jwt.verify(m[1], cfg.jwt.secret, { algorithms: ['HS256'] });
    req.usuario = { id: Number(p.sub), rol: p.rol, nombre: p.nombre };
    return next();
  } catch (err) {
    return next(e.noAutenticado(err.name === 'TokenExpiredError' ? 'La sesión expiró. Inicia sesión de nuevo.' : 'Token inválido.'));
  }
}

/** requireRol('admin') o requireRol('admin','secretaria'). */
function requireRol(...roles) {
  return (req, _res, next) => {
    if (!req.usuario) return next(e.noAutenticado());
    if (!roles.includes(req.usuario.rol)) return next(e.prohibido());
    return next();
  };
}

module.exports = { firmarToken, requireAuth, requireRol };
