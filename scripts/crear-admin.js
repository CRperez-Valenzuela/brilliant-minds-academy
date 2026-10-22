'use strict';
// Crea (o reactiva) el primer usuario administrador SIN pasar contraseñas por el chat ni por el código:
//   ADMIN_NOMBRE="..." ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run crear-admin
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const { ejecutar, closePool } = require('../config/db');

async function main() {
  const { ADMIN_NOMBRE = 'Administrador', ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error('Define ADMIN_EMAIL y ADMIN_PASSWORD en el entorno.');
  if (ADMIN_PASSWORD.length < 12) throw new Error('ADMIN_PASSWORD debe tener al menos 12 caracteres.');
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  // Upsert atómico por la restricción UNIQUE del correo: si existe, solo se actualiza la clave/nombre y se reactiva (el rol no se toca).
  await ejecutar(
    `INSERT INTO usuarios_admin (nombre, email, password_hash, rol)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email) DO UPDATE
        SET password_hash = EXCLUDED.password_hash, nombre = EXCLUDED.nombre, activo = TRUE`,
    [ADMIN_NOMBRE, ADMIN_EMAIL.trim().toLowerCase(), hash]);
  console.log(`Administrador listo: ${ADMIN_EMAIL}`);
}

main()
  .catch((err) => { console.error(err.message); process.exitCode = 1; })
  .finally(() => closePool());
