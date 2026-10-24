# CAMBIOS_BMA_MULTISEDE — Multi-sede e invitaciones con nivel blindado (sobre la prueba Premium y el cron ya existentes)

**Proyecto:** Brilliant Minds Academy · **Base:** `origin/development` @ `7ac5aaa` · **Agente:** Arquitecto Principal, Astra Digital Solutions
**Motor:** PostgreSQL 15+ / Supabase (`pg` nativo, parámetros posicionales `$1…$n`, errores JSON estables). Sin residuos de MSSQL.

> **Reconciliación con `development`:** la rama ya traía la prueba Premium de 15 días (`005_premium_prueba.sql`, `guard.js`, `prueba.service.js`) y el bot de WhatsApp (`cron/whatsappCron.js`). Esta entrega **no los duplica**: conserva los de la rama y los extiende (acceso solo consolidado a la activación de la prueba; cron despachado sede por sede). Las migraciones nuevas son la **006** y la **007**.

## Verificación realizada

| Verificación | Resultado |
|---|---|
| `npm test` sin base de datos | 155 pruebas: 107 OK · 0 fallos · 48 omitidas (integración) |
| `PG_TEST_PORT=… npm test` contra **PostgreSQL 16 real** | **155/155** (incluye migraciones 001–007 aplicadas dos veces, RLS con roles `anon`/`authenticated`, aislamiento por sede, invitaciones, cron por sede) |
| Frontend: `tsc --noEmit` sobre `frontend/src` | 0 errores (salvo `vite.config.ts`: `vite` no se pudo instalar aquí) |
| Auditoría estática | 0 `dbo.` / `GETDATE` / `ISNULL(`; el SQL nuevo usa solo `$n` y los tests comprueban que el arreglo de parámetros coincide con el `$n` máximo |

**Límites honestos**
- `pg` real, `vite` y `tailwindcss` **no se pudieron instalar** (registro de npm inaccesible): la integración usó `tests/helpers/pg-minimo.js`. No se probó contra Supabase en la nube ni con TLS.
- **`public/` NO se regeneró** (salida de Vite con hashes). Ejecuta `npm run frontend:install && npm run frontend:build` para que `public/` incluya los cambios de `frontend/src` (bloqueo del nivel y botón de prueba). Las clases `bg-slate-100 pointer-events-none select-none` ya existen en el CSS compilado.

## Decisiones y desviaciones respecto al enunciado

| Enunciado | Qué se hizo y por qué |
|---|---|
| `dbo.sedes`, `dbo.invitaciones_inscripcion` | Esquema **`public`**: `dbo.` es MSSQL y Supabase usa `public`. |
| Cambiar `public/admisiones/index.html` | Es salida compilada: el cambio está en `frontend/src/admisiones.ts`; hay que recompilar. |
| Nivel «bloqueado» con Tailwind | Las clases son solo señal visual. **El servidor impone nivel y sede**: ignora el grado enviado y usa `nivel_asignado`; el enlace es de un solo uso y se consume de forma atómica. |
| `sede_id` NULL = consolidado | Solo para `rol = 'admin'`. **Fail-closed:** una secretaria sin sede recibe `403 SEDE_NO_ASIGNADA`. |
| Filtro `WHERE sede_id = $n` | `($n::int IS NULL OR x.sede_id = $n::int)` con el parámetro siempre enlazado. Un dato con `sede_id` NULL solo lo ve el consolidado. |
| Personal, horas, nómina, configuración, Excel contable | Sin sede → solo consolidado. Egresos y balance sí respetan la sede. |
| Prueba de 15 días | Se mantiene la de `development` (`expira_prueba_en`, bloqueo automático en `guard.js`). Añadido: `POST /api/premium/activar-prueba` exige además **acceso consolidado** (admin sin sede). |
| Cron por sede, 8:00 Caracas | Se extiende `cron/whatsappCron.js`: por cada sede **activa** corre Preventiva → Morosidad y al final los estudiantes **sin sede**. Una sede desactivada no recibe mensajes. El resumen añade `por_sede`. Se mantienen pausa de 1,5 s, lease entre instancias, cortafuegos y candado premium. |

**Operación inicial:** tras migrar, lo existente queda con `sede_id` NULL (solo visible en consolidado; el cron lo atiende en el último ámbito). Para asignarlo: crear sedes (`POST /api/sedes`), `UPDATE estudiantes SET sede_id = …` y reasignar secretarias (`ADMIN_ROL=secretaria ADMIN_SEDE_ID=<id> npm run crear-admin`). El JWT lleva `sede_id`: un cambio de sede se aplica al volver a iniciar sesión (≤ 8 h).

## Migraciones creadas (idempotentes, una transacción por archivo)

| Archivo | Contenido |
|---|---|
| `database/migrations/006_multisede.sql` | Tabla `sedes`; `sede_id` NULLABLE + FK + índices en `usuarios_admin`, `estudiantes`, `cuotas`, `egresos`, `pagos_referencias`, `cuentas_pago`; trigger `fn_heredar_sede_estudiante` (`search_path` fijo, `REVOKE` a PUBLIC); relleno de lo existente; `vw_estudiantes_estado` con `sede_id` al final; RLS + REVOKE de `sedes`. |
| `database/migrations/007_invitaciones_inscripcion.sql` | `invitaciones_inscripcion` (`token_hash CHAR(64)` único, `sede_id`, `nivel_asignado`, `estado` Pendiente/Usada/Revocada, `expira_en`, `estudiante_id`, `usada_en`) + RLS/REVOKE. |

## Archivos creados

| Archivo | Para qué |
|---|---|
| `utils/alcance.js` | `alcanceDe(usuario)` (fail-closed) y `requireConsolidado`. |
| `services/sedes.service.js`, `controllers/sedes.controller.js` | Sedes (listar/crear/activar) e invitaciones (crear/listar/revocar). |
| `services/invitaciones.service.js` | Token de 48 hex (SHA-256 en BD), `resolver`, `consumir` atómico, `revocar`. |
| `tests/multisede.test.js` | Cron por sede (SQL posicional, orden de ámbitos), alcance, JWT con sede, formulario con invitación. |
| `CAMBIOS_BMA_MULTISEDE.md` | Este resumen. |

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `cron/whatsappCron.js` | Consultas con ámbito de sede (`$9` / `$8`), ciclo por sede + «sin sede», `por_sede` en el resumen. |
| `modules/premium/premium.routes.js` | `activar-prueba` añade `requireConsolidado`. |
| `middlewares/auth.js`, `controllers/auth.controller.js` | `sede_id` en login, JWT y `req.usuario`. |
| `services/crm`, `facturacion`, `pagos`, `contabilidad`, `notificaciones`, `exportacion`, `parametros`, `portal` | Parámetro `sedeId` y predicado de sede. |
| `controllers/crm`, `facturacion`, `contabilidad`, `notificaciones`, `exportaciones`, `configuracion` | Resuelven `alcanceDe(req.usuario)`; cuentas de cobro con `sede_id`. |
| `services/admisiones.service.js`, `controllers/admisiones.controller.js` | `configInvitacion`, inscripción con `invitacion` (nivel y sede del servidor, consumo atómico), `GET /api/public/admisiones/invitacion/:token`. |
| `routes/index.js` | Rutas de sedes e invitaciones, ruta pública de invitación, `soloConsolidado` donde corresponde. |
| `scripts/crear-admin.js` | `ADMIN_ROL` y `ADMIN_SEDE_ID` opcionales. |
| `middlewares/errorHandler.js` | Oculta tokens de invitación/portal en logs 5xx. |
| `frontend/src/admisiones.ts`, `admin.ts`, `types/index.ts` | Nivel bloqueado con invitación; botón de prueba solo para consolidado (usa `expira_prueba_en`, `prueba_utilizada`). |
| `tests/schema-consistencia.test.js`, `integracion.pg.test.js`, `facturacion-tablero.test.js`, `premium-prueba.test.js`, `whatsapp-cron.test.js` | ALTER TABLE en el parser, RLS en 19 tablas, pruebas de integración multi-sede/invitaciones/cron por sede; las dos últimas ajustadas al nuevo middleware y al parámetro de sede. |

## Contratos nuevos de la API

- `GET /api/public/admisiones/invitacion/:token` → `{ sede, nivel_asignado, matricula_usd, tasa_bcv, matricula_bs, tasa_desactualizada, cuentas[] }` · `410 INVITACION_NO_VALIDA`.
- `POST /api/public/admisiones` acepta `invitacion` (el grado enviado se descarta).
- `POST /api/invitaciones` `{ nivel_asignado, dias?, sede_id? }` (el `enlace` se muestra una sola vez) · `GET /api/invitaciones` · `POST /api/invitaciones/:id/revocar`.
- `GET|POST /api/sedes` · `POST /api/sedes/:id/activar|desactivar` (consolidado).
- Errores nuevos: `403 SEDE_NO_ASIGNADA`, `409 SEDE_DUPLICADA`, `422 SEDE_INACTIVA`, `409 INVITACION_NO_REVOCABLE`.
