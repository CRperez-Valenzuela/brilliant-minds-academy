'use strict';
const path = require('node:path');
const express = require('express');
const { requestId } = require('./middlewares/requestId');
const { seguridad } = require('./middlewares/seguridad');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const { api, fachada } = require('./routes');
const cfg = require('./config/env');

function crearApp() {
  const app = express();
  app.disable('x-powered-by');
  if (cfg.esProduccion) app.set('trust proxy', 1); // detrás del proxy de Vercel/Nginx: req.ip real para los limitadores

  app.use(requestId);
  app.use(seguridad);
  app.use(express.json({ limit: '100kb' })); // JSON malformado → errorHandler responde 400 JSON_INVALIDO

  // Rutas públicas de marketing (Fachada Web, premium) y API
  app.use('/ir', fachada);
  app.use('/api', api);
  app.use('/api', notFound); // cualquier /api/* inexistente → 404 JSON (nunca HTML)

  // Frontends estáticos (sin datos sensibles; la seguridad vive en /api/*)
  const pub = path.join(__dirname, 'public');
  // Recursos con hash generados por Vite (frontend/ → public/assets): inmutables, caché larga.
  app.use('/assets', express.static(path.join(pub, 'assets'), { immutable: true, maxAge: '1y', index: false }));
  app.use('/admin', express.static(path.join(pub, 'admin')));
  app.use('/admisiones', express.static(path.join(pub, 'admisiones')));
  app.get('/portal/:token', (_req, res) => res.sendFile(path.join(pub, 'portal', 'index.html')));
  app.get('/', (_req, res) => res.redirect('/admisiones'));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = { crearApp };
