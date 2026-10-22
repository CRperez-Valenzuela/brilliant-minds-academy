'use strict';
// Crea (o reactiva) el primer usuario administrador SIN pasar contraseñas por el chat ni por el código:
//   ADMIN_NOMBRE="..." ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run crear-admin
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const { getPool, closePool, sql } = require('../config/db');

async function main() {
  const { ADMIN_NOMBRE = 'Administrador', ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error('Define ADMIN_EMAIL y ADMIN_PASSWORD en el entorno.');
  if (ADMIN_PASSWORD.length < 12) throw new Error('ADMIN_PASSWORD debe tener al menos 12 caracteres.');
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const pool = await getPool();
  await pool.request()
    .input('nombre', sql.NVarChar(120), ADMIN_NOMBRE)
    .input('email', sql.NVarChar(160), ADMIN_EMAIL.trim().toLowerCase())
    .input('hash', sql.NVarChar(100), hash)
    .query(`MERGE dbo.usuarios_admin AS t
            USING (SELECT @email AS email) AS s ON t.email = s.email
            WHEN MATCHED THEN UPDATE SET password_hash = @hash, nombre = @nombre, activo = 1
            WHEN NOT MATCHED THEN INSERT (nombre, email, password_hash, rol) VALUES (@nombre, @email, @hash, N'admin');`);
  console.log(`Administrador listo: ${ADMIN_EMAIL}`);
}

main()
  .catch((err) => { console.error(err.message); process.exitCode = 1; })
  .finally(() => closePool());
