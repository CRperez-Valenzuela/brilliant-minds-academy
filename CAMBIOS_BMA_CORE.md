# CAMBIOS_BMA_CORE — Migración de la capa de datos a PostgreSQL (Supabase)

**Proyecto:** Brilliant Minds Academy · Core Base (US$750) · **Rama:** `development` · **Agente:** Arquitecto Principal, Astra Digital Solutions

El sistema **ya no usa Microsoft SQL Server**. Toda la capa de datos corre sobre PostgreSQL (Supabase) con el paquete nativo `pg`.

## Verificación realizada

| Verificación | Resultado |
|---|---|
| `npm test` (pruebas unitarias + auditoría estática SQL↔código, sin red) | 54/54 |
| `npm run test:integracion` contra un **PostgreSQL 16 real** (migraciones x2, scripts, servicios, concurrencia, RLS, exportación) | 34/34 |
| Migraciones 001–004 aplicadas dos veces (idempotencia) y con roles `anon`/`authenticated` simulados | OK |

**Límite honesto:** el paquete `pg` real no se pudo instalar en el entorno de trabajo (el registro de npm estaba bloqueado). La integración se ejecutó con `tests/helpers/pg-minimo.js`, un cliente del protocolo PostgreSQL (Parse/Bind/Execute, parámetros posicionales como `pg`). **No se probó contra Supabase en la nube ni con TLS.** Tras `npm install`, `npm run test:integracion` usa automáticamente el `pg` real (con `PG_TEST_PORT` apuntando a un Postgres local; nunca a producción).

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `config/db.js` | Reescrito: `Pool` de `pg` (`DB_SERVER`→host, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`), TLS, `statement_timeout`, listener de errores del pool, `conTransaccion` (BEGIN/COMMIT/ROLLBACK, cliente siempre devuelto o destruido), `ejecutar(texto, params[], cliente)` → `{rows, rowCount}`, `ejecutarScript` para DDL. Type parsers: DATE→texto `YYYY-MM-DD`, INT8 y NUMERIC→number. |
| `config/env.js`, `.env.example` | Puerto 5432; `DB_SSL`, `DB_SSL_CA_PATH`, `DB_SSL_REJECT_UNAUTHORIZED` en lugar de `DB_ENCRYPT`/`DB_TRUST_SERVER_CERT`. |
| `database/migrations/001_core_base.sql` | PostgreSQL puro: `SERIAL/BIGSERIAL`, `VARCHAR/TEXT`, `NUMERIC`, `BOOLEAN`, `TIMESTAMPTZ DEFAULT NOW()`, `CREATE TABLE/INDEX IF NOT EXISTS`, índices parciales, `CHECK` con regex. Nuevo índice único parcial `ux_cuotas_mensualidad_concepto`. |
| `database/migrations/002_vistas.sql` | `CREATE OR REPLACE VIEW … WITH (security_invoker = true)`; "hoy" = `NOW() AT TIME ZONE 'America/Caracas'`; `LATERAL` + `FILTER`. |
| `database/migrations/003_modulos_premium.sql` | Semillas con `ON CONFLICT … DO NOTHING` (no pisa módulos habilitados). |
| `database/migrations/004_seguridad_supabase.sql` | **Nuevo.** RLS en las 17 tablas (sin políticas) y `REVOKE` a `anon`/`authenticated`: la API REST de Supabase no puede leer nada. Lista explícita de tablas. |
| `scripts/migrate.js` | Una transacción por archivo, `pg_advisory_xact_lock`, registro en `schema_migrations`. |
| `scripts/crear-admin.js` | `INSERT … ON CONFLICT (email) DO UPDATE`. |
| `services/admisiones.service.js` | `INSERT … ON CONFLICT (cedula) DO UPDATE … RETURNING id`; `$1…$n`. |
| `services/pagos.service.js` | `UPDATE … RETURNING`, `FOR UPDATE`, bandeja con `LIMIT/OFFSET`; **corrección**: `declararReferencia` sin transacción ahora abre la suya. |
| `services/contabilidad.service.js` | Upsert de nómina en una sola sentencia `ON CONFLICT (personal_id, periodo) DO UPDATE … WHERE estado='Calculada'`. |
| `services/crm`, `facturacion`, `portal`, `notificaciones`, `parametros`, `bcv`, `exportacion` `.service.js` | Misma conversión (`$n`, `RETURNING`, `LIMIT`, `to_char`, `COALESCE`, `ILIKE`). |
| `modules/premium/guard.js`, `controllers/auth|configuracion.controller.js`, `routes/index.js`, `server.js` | `$n` y `{rows}`. |
| `middlewares/errorHandler.js` | Mapeo por SQLSTATE: 23505 (con `err.constraint`), 23503, 23502, 23514, 22xxx, 40P01/40001, 57014, 08/28/53/57P0x y errores de red. No expone SQL ni `detail`. |
| `utils/fechas.js` | `aFechaSql` devuelve la cadena `YYYY-MM-DD` (un `Date` se corría un día según la zona del proceso); `aInstanteSql` para `TIMESTAMPTZ`. |
| `package.json` | `pg` entra, `mssql` sale; script `test:integracion`. |
| `tests/*` | Fake `db` con contrato `{rows,rowCount}` que **verifica que el número de `$n` coincide con los parámetros**; test estático reescrito para PostgreSQL; nueva integración. |

## Archivos creados

`database/migrations/004_seguridad_supabase.sql`, `tests/integracion.pg.test.js`, `tests/helpers/pg-minimo.js`, `tests/helpers/entorno-integracion.js`.

## Diferencias de comportamiento MSSQL → PostgreSQL que se trataron

- **Mayúsculas:** SQL Server comparaba sin distinguirlas; PostgreSQL sí. Se normalizan a MAYÚSCULAS cédulas y referencias bancarias al guardar (si no, `v-123` y `V-123` serían dos personas, y `ref-1`/`REF-1` esquivarían el índice único). El correo del login ya iba en minúsculas. La búsqueda del CRM usa `ILIKE` (no ignora tildes: requeriría la extensión `unaccent`).
- **Parámetros nulos:** `($1::int IS NULL OR col = $1::int)` — sin el cast PostgreSQL no infiere el tipo.
- **Carreras:** `MERGE … HOLDLOCK` → `ON CONFLICT`; `UPDLOCK` → `FOR UPDATE`; idempotencia de mensualidades por índice único parcial.

## Revisión (code-review) — hallazgos

1. **Corregido:** en el portal, una referencia duplicada dejaba la cuota atascada en "En Revisión" (reclamo y `INSERT` no eran atómicos). Probado en integración.
2. **Corregido:** `Date` como parámetro DATE podía guardar el día anterior; ahora se pasa texto.
3. **Riesgo abierto (decisión de negocio):** el formulario público actualiza nombre y teléfono de un representante existente si se envía su cédula. Alguien podría redirigir los WhatsApp de otra familia. Recomendación: no sobrescribir el teléfono sin validación del administrador.
4. **Operativo:** la subida a Drive ocurre con la transacción abierta (retiene una conexión unos segundos); `ADMISIONES_CONCURRENCIA_MAX` (4) debe ser menor que `DB_POOL_MAX`.

## Pasos para tu entorno

1. `npm install` (instala `pg`).
2. En `.env`: `DB_SERVER`, `DB_PORT=5432`, `DB_NAME=postgres`, `DB_USER` (con el Session pooler es `postgres.<ref>`), `DB_PASSWORD`, `DB_SSL=true` y, para verificar el certificado, `DB_SSL_CA_PATH` con la CA descargada de Supabase.
3. `npm run migrate` y luego `ADMIN_EMAIL=… ADMIN_PASSWORD=… npm run crear-admin`.
4. Código heredado `src/` y `sql/` (Clínica): sin cambios; se recomienda eliminarlo del repositorio.
