'use strict';
const { AppError } = require('../errors/AppError');

/**
 * Limitador en memoria por IP (ventana fija). Suficiente para una sola instancia;
 * con varias réplicas hay que moverlo a Redis o a la capa de Vercel/WAF.
 */
function crearLimitador({ ventanaMs = 15 * 60_000, max = 10, codigo = 'DEMASIADAS_SOLICITUDES', mensaje = 'Demasiadas solicitudes. Espera unos minutos.', soloFallos = false } = {}) {
  const cubetas = new Map();
  const limpieza = setInterval(() => {
    const ahora = Date.now();
    for (const [k, v] of cubetas) if (v.reinicia <= ahora) cubetas.delete(k);
  }, Math.min(ventanaMs, 60_000));
  limpieza.unref();

  return function limitador(req, res, next) {
    const ahora = Date.now();
    const clave = req.ip || 'desconocida';
    let c = cubetas.get(clave);
    if (!c || c.reinicia <= ahora) {
      c = { n: 0, reinicia: ahora + ventanaMs };
      cubetas.set(clave, c);
    }
    if (c.n >= max) {
      const espera = Math.max(1, Math.ceil((c.reinicia - ahora) / 1000));
      return next(new AppError(429, codigo, mensaje).conCabeceras({ 'Retry-After': String(espera) }));
    }
    if (soloFallos) {
      res.on('finish', () => { if (res.statusCode >= 400) c.n += 1; });
    } else {
      c.n += 1;
    }
    next();
  };
}

module.exports = { crearLimitador };
