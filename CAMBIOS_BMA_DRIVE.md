# CAMBIOS_BMA_DRIVE — Robustecimiento de Drive y compensación transaccional

**Proyecto:** Brilliant Minds Academy · Core Base · **Rama:** `development` · **Agente:** Arquitecto Principal, Astra Digital Solutions
**Base de datos:** PostgreSQL (Supabase) con `pg`; consultas parametrizadas `$1, $2…`. Sin sintaxis MSSQL, sin dependencias nuevas, sin migraciones.

## Auditoría previa (qué ya cumplía en el repositorio)

| Requisito | Estado antes | Dónde |
|---|---|---|
| Buffers de `multer.memoryStorage()` → `Readable.from([buffer])` → `drive.files.create` | ✅ ya existía | `drive.service.js`, `admisiones.controller.js` |
| Carpeta `Nombre_Apellido_ID` saneada (anti path-traversal) | ✅ ya existía | `utils/archivos.js` (`nombreCarpeta`, sin cambios) |
| `supportsAllDrives: true` | ✅ ya existía | `drive.service.js` |
| `eliminarCarpeta` + compensación en el `catch` | ⚠️ existía, con huecos | ver abajo |

## Huecos reales corregidos

1. **Subidas en vuelo al limpiar.** `Promise.all` rechazaba al primer fallo y mandaba la carpeta a la papelera mientras otros documentos aún se subían. Ahora `Promise.allSettled`: se espera a que todas terminen y recién entonces se limpia.
2. **Limpieza frágil.** `eliminarCarpeta` no reintentaba y trataba igual un 404 que un 503. Ahora: reintentos con espera exponencial solo ante fallos transitorios (red, 408, 429, 5xx); **404 = éxito** (ya no existe); 401/403/400 no se reintentan. **Nunca lanza** y devuelve `true/false`.
3. **Error original tapado.** Si `eliminarCarpeta` lanzaba dentro del `catch` de `admisiones.service.js`, el cliente recibía el error de la limpieza. Ahora `compensarDrive()` aísla cualquier fallo y registra `CARPETA HUÉRFANA` si quedó algo por limpiar manualmente.
4. **COMMIT ambiguo (riesgo de pérdida de datos).** Si la conexión caía durante el COMMIT, el servidor pudo haber confirmado igual; la compensación habría mandado a la papelera la carpeta de un estudiante ya inscrito. Ahora, solo cuando falla *después* de completar el callback, se verifica con `SELECT 1 FROM estudiantes WHERE id = $1 AND drive_folder_id = $2`:
   - **no persistió** → carpeta a la papelera, se propaga el error (ROLLBACK ya ocurrió);
   - **sí persistió** → se conserva el expediente y se devuelve la inscripción;
   - **no se pudo verificar** → se conserva la carpeta (mejor un huérfano que perder datos) y se registra `REVISIÓN MANUAL`.
5. **Sin tope de tiempo.** Las llamadas a Drive ocurren con una transacción de `pg` abierta; ahora llevan `timeout` (`GOOGLE_DRIVE_TIMEOUT_MS`, 60000 por defecto).
6. **Defensa en profundidad.** `subirExpediente` valida `estudianteId` entero positivo, buffers no vacíos y `tipo/ext` saneados con `segmentoSeguro`, y que exista carpeta padre configurada. `Readable.from([buffer], { objectMode: false })` para un stream de bytes real.

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `services/drive.service.js` | Reescrito: `allSettled`, `eliminarCarpeta` con reintentos/404/no-throw, `timeout`, validación de entrada, `supportsAllDrives: true` en las 3 llamadas (`create` carpeta, `create` archivo, `update` papelera). Firma pública intacta: `{ subirExpediente, eliminarCarpeta }`. |
| `services/admisiones.service.js` | `registrarInscripcion`: detección de COMMIT ambiguo, `inscripcionPersistida()` y `compensarDrive()` (nunca lanza). El contrato de retorno no cambia. |
| `config/env.js` | Nuevo `drive.timeoutMs` ← `GOOGLE_DRIVE_TIMEOUT_MS` (entero ≥ 0, defecto 60000). |
| `.env.example` | Documenta `GOOGLE_DRIVE_TIMEOUT_MS`. |
| `tests/helpers/entorno.js` | El doble de BD admite `db.fallarCommit` para simular un COMMIT caído tras ejecutar el callback. |
| `tests/admisiones.test.js` | +5 pruebas: COMMIT fallido (no persistió / sí persistió / verificación imposible), limpieza que lanza, limpieza que devuelve `false`. |

## Archivos creados

| Archivo | Contenido |
|---|---|
| `tests/drive.test.js` | 9 pruebas con un cliente de Drive falso que **consume el stream** como lo haría `googleapis`: bytes exactos, `supportsAllDrives` en cada creación, nombre `María_Pérez_10`, saneamiento (`../../etc/passwd` → `etcpasswd`), espera de subidas en vuelo antes de limpiar, política de reintentos, validación de entrada. |
| `CAMBIOS_BMA_DRIVE.md` | Este resumen. |
| `bma-drive.patch` | Parche con todos los cambios anteriores (`git apply bma-drive.patch`). |

## Verificación

| Verificación | Resultado |
|---|---|
| `npm test` (incluye auditoría estática SQL↔esquema y que cada `$n` tenga su parámetro) | **68 pasan · 0 fallan** · 34 omitidas (integración) |
| Búsqueda de sintaxis MSSQL (`mssql`, `@p1`, `TOP (`, `GETDATE`, `.recordset`…) en los archivos tocados | Sin coincidencias |
| Manejo de errores JSON | Las fallas de Drive siguen siendo `AppError 502 DRIVE_ERROR`; la compensación nunca altera el error que llega al `errorHandler` |

## Límites honestos

- **No se ejecutó contra Google Drive real ni contra Supabase/PostgreSQL real.** Las 34 pruebas de `npm run test:integracion` se omiten sin `PG_TEST_PORT`; conviene correrlas en `development` antes de fusionar. La verificación de COMMIT ambiguo está cubierta por el doble de BD, no por un corte real de conexión.
- **Riesgo residual:** si Drive crea la carpeta pero la respuesta se pierde (timeout), el servicio no conoce su `id` y no puede limpiarla. La mitigación sería un barrido por nombre (`Nombre_Apellido_ID` es único por el ID del estudiante); no se implementó para no ampliar el alcance ni los permisos de la cuenta de servicio.
- La subida a Drive sigue ocurriendo **dentro** de la transacción (el ID del estudiante, necesario para el nombre de la carpeta, solo existe tras el `INSERT`). Por eso el tope de concurrencia (`ADMISIONES_CONCURRENCIA_MAX`) y el nuevo `timeout` son importantes.
