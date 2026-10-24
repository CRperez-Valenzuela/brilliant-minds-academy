'use strict';
// Crea (o reactiva) el primer usuario administrador SIN pasar contraseñas por el chat ni por el código:
//   ADMIN_NOMBRE="..." ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run crear-admin
// Multi-sede (opcional): ADMIN_ROL=secretaria ADMIN_SEDE_ID=<id> crea un usuario atado a una sede. Sin ADMIN_SEDE_ID el usuario
// tiene acceso consolidado (SuperAdmin) y solo el rol 'admin' puede quedar sin sede (una secretaria sin sede no puede operar).
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const { ejecutar, closePool } = require('../config/db');

async function main() {
  const { ADMIN_NOMBRE = 'Administrador', ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_ROL = 'admin', ADMIN_SEDE_ID } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error('Define ADMIN_EMAIL y ADMIN_PASSWORD en el entorno.');
  if (ADMIN_PASSWORD.length < 12) throw new Error('ADMIN_PASSWORD debe tener al menos 12 caracteres.');
  if (!['admin', 'secretaria'].includes(ADMIN_ROL)) throw new Error("ADMIN_ROL debe ser 'admin' o 'secretaria'.");
  const sedeId = ADMIN_SEDE_ID ? Number(ADMIN_SEDE_ID) : null;
  if (ADMIN_SEDE_ID && (!Number.isInteger(sedeId) || sedeId <= 0)) throw new Error('ADMIN_SEDE_ID debe ser un entero positivo.');
  if (ADMIN_ROL === 'secretaria' && !sedeId) throw new Error('Una secretaria requiere ADMIN_SEDE_ID (la sede en la que opera).');
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  // Upsert atómico por la restricción UNIQUE del correo: si existe, solo se actualiza la clave/nombre y se reactiva (el rol no se toca).
  await ejecutar(
    `INSERT INTO usuarios_admin (nombre, email, password_hash, rol, sede_id)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (email) DO UPDATE
        SET password_hash = EXCLUDED.password_hash, nombre = EXCLUDED.nombre, activo = TRUE,
            sede_id = COALESCE(EXCLUDED.sede_id, usuarios_admin.sede_id)`,
    [ADMIN_NOMBRE, ADMIN_EMAIL.trim().toLowerCase(), hash, ADMIN_ROL, sedeId]);
  console.log(`Administrador listo: ${ADMIN_EMAIL}`);
}

main()
  .catch((err) => { console.error(err.message); process.exitCode = 1; })
  .finally(() => closePool());
