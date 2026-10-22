'use strict';

/** Envuelve handlers async para que cualquier rechazo llegue al errorHandler JSON (Express 4 no lo hace solo). */
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const ok = (res, data, status = 200, extra = {}) => res.status(status).json({ ok: true, data, ...extra });

module.exports = { asyncHandler, ok };
