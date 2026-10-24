'use strict';
const cfg = require('./config/env');
const { crearApp } = require('./app');
const { closePool, getPool } = require('./config/db');
const { cron: cronWhatsapp } = require('./cron/whatsappCron');

const app = crearApp();
const server = app.listen(cfg.puerto, () => {
  console.log(`Brilliant Minds Academy · Core Base escuchando en http://localhost:${cfg.puerto}`);
  console.log(`  Admisiones: /admisiones   Panel: /admin   Salud: /api/health`);
  // Verifica la base al arrancar (no bloquea el servidor: /api/health/db informa el estado después).
  getPool().then(() => console.log('  Base de datos PostgreSQL (Supabase) conectada.')).catch((e) => console.error('  ⚠ PostgreSQL no disponible:', e.message));
  // Bot de WhatsApp (módulo premium): corre a diario; cada ciclo comprueba que el módulo esté habilitado.
  if (cfg.whatsappCron.activo) cronWhatsapp.iniciar();
});

// Un rechazo no manejado jamás debe tumbar el proceso en silencio ni dejarlo en estado inconsistente.
process.on('unhandledRejection', (r) => console.error('[unhandledRejection]', r));
process.on('uncaughtException', (err) => { console.error('[uncaughtException]', err); shutdown(1); });

let cerrando = false;
function shutdown(codigo = 0) {
  if (cerrando) return;
  cerrando = true;
  console.log('Cerrando servidor…');
  const forzar = setTimeout(() => process.exit(codigo || 1), 10_000);
  forzar.unref();
  server.close(async () => {
    await cronWhatsapp.detener().catch(() => undefined); // termina el mensaje en curso antes de cerrar la base
    await closePool().catch(() => undefined);
    process.exit(codigo);
  });
}
process.on('SIGTERM', () => shutdown(0));
process.on('SIGINT', () => shutdown(0));
