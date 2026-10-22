# CAMBIOS_BMA_CORE.md — Brilliant Minds Academy · Core Base (Astra Digital Solutions)

Repositorio auditado: `CRperez-Valenzuela/brilliant-minds-academy`, rama `development` (commit `913bb9a`). Sesión sin permiso de push: los cambios están en el árbol de trabajo y se entregan como `.zip` y `.patch`.

## 1. Estado de verificación (lo que SÍ y NO se ejecutó)

| Verificación | Resultado |
|---|---|
| `node --check` en todo el JS nuevo (incluido el JS de las 3 páginas) | OK |
| `npm test` → 50 pruebas (`node --test`, sin dependencias de red) | **50 / 50 OK** |
| Auditoría estática SQL ↔ código (tablas, columnas de INSERT/UPDATE, columnas de la vista, literales de estado vs `CHECK`, enums, SQL parametrizado, `;` antes de `ELSE`, nombres de constraint únicos) | OK |
| `npm install` | **No ejecutado**: el proxy del entorno bloquea `registry.npmjs.org` (403). No se esquivó. |
| Arranque real de Express / pruebas HTTP | **No ejecutado** (depende de `npm install`) |
| Migraciones contra un SQL Server real | **No ejecutado** (sin SQL Server ni daemon Docker en el entorno). El T-SQL se revisó a mano y con el test estático, pero **debe correrse una vez** con `npm run migrate`. |
| Google Drive, Meta WhatsApp, API BCV reales | **No ejecutados**: se probaron con dobles inyectados (flujo, rollback, compensación). |

Defectos que el bucle de revisión detectó y corrigió antes de entregar: `;` antes de `ELSE` en un lote T-SQL de nómina (reescrito con `BEGIN…END`), rama de compensación duplicada y `MERGE` sin `HOLDLOCK` en `admisiones.service.js`, hash "sentinela" de login inventado (ahora es un bcrypt real), teléfono `+58` + `0414…` que dejaba un `0` de troncal duplicado, `Content-Disposition` de `.xlsx` que sobrevivía a un error JSON, y un valor esperado erróneo en un test (el código era correcto).

## 2. Auditoría del repositorio recibido (Astra Health → BMA)

El repo está a medias: `package.json` ya es de BMA (mssql, exceljs, googleapis, multer) pero **todo el código es de la Clínica Echeverría**.

Hallazgos críticos:
- **Conflicto de base de datos:** `src/db.ts` es PostgreSQL/Supabase (`pg`, "Reemplaza a db.js (mssql)"), las migraciones `sql/migrations/*` son Postgres, y `sql/schema.sql` es MSSQL de clínica. El requisito es **MSSQL**.
- **`src/server.js` no arranca:** importa `./routes/webhook`, `./routes/auth.routes`, `./routes/adminApi`, `./routes/citaManual.routes`, `./routes/horarioDoctor.pg`, que **no existen** en el repo; además requiere `express-session`, `node-cron` y `express-rate-limit`, que no están en `package.json`. `package.json` apunta a `server.js` en la raíz, que tampoco existía.
- Cero archivos de BMA (admisiones, cuotas, nómina…) antes de este trabajo.

**Código muerto / a borrar** (no se borró nada: tú decides; todo es del dominio clínico):

```bash
git rm -r src sql          # clínica: citas, doctores, EEG, derivaciones VET, impacto IA, plan_clinica, db.ts (Postgres), WhatsApp bot de citas
mkdir -p docs && git mv BMA.txt docs/requisitos-cliente.txt   # conservar las notas del cliente
```

Qué contiene `src/` y `sql/` (80 archivos): `engine.js`, `availability.js`, `horarioLaboral*`, `sessions.js`, `whatsapp.js` (bot de agendamiento), `integrations/*`, `jobs/reminders.js` y `reportJob.js`, `modules/{vet,derivaciones,cancelaciones,impacto-ia,plan}`, `db.ts`, `lib/sql-template.ts`, `middleware/*`; `sql/schema.sql`, `seed.sql` (doctores, especialidades) y 8 migraciones de clínica. **Reutilizado como patrón (no como código):** el contrato de `whatsapp.js` (`enviarTextoEstricto` que lanza si Meta falla) y el manejo de pool/errores de `db.ts`, ahora en `services/whatsapp.service.js` y `config/db.js`.

El código nuevo vive en la **raíz** (donde `package.json` ya esperaba `server.js`), así que no colisiona con `src/` y se puede borrar `src/` sin tocarlo.

## 3. Archivos creados o modificados

Modificados: `package.json` (+`bcryptjs`, `jsonwebtoken`; scripts `migrate`, `crear-admin`, `test`; `engines`), `.gitignore` (credenciales y `.env.*`). Creados (55 archivos de producción + 8 de pruebas):

| Archivo | Propósito | Líneas |
|---|---|---|
| `.env.example` | Variables de entorno documentadas (sin secretos) | 48 |
| `app.js` | Fábrica de la app Express: requestId, seguridad, JSON, rutas, estáticos, 404/errores JSON | 36 |
| `config/db.js` | Pool único MSSQL, transacciones con rollback garantizado, helper parametrizado | 83 |
| `config/env.js` | Carga y validación de entorno (falla al arrancar si falta algo en producción) | 72 |
| `controllers/admisiones.controller.js` | Formulario público: validación, teléfonos, magic bytes, tope de concurrencia | 106 |
| `controllers/auth.controller.js` | Login (anti-enumeración por tiempo) y /me | 23 |
| `controllers/configuracion.controller.js` | Matrícula y cuentas de pago | 45 |
| `controllers/contabilidad.controller.js` | Personal, horas, nómina, egresos, balance | 96 |
| `controllers/crm.controller.js` | Estudiantes | 24 |
| `controllers/exportaciones.controller.js` | Endpoints .xlsx | 15 |
| `controllers/facturacion.controller.js` | Tablero, auditoría, cuotas | 64 |
| `controllers/notificaciones.controller.js` | Alertas WhatsApp | 20 |
| `controllers/portal.controller.js` | Portal privado del representante | 17 |
| `database/migrations/001_core_base.sql` | Tablas, constraints, índices (MSSQL, idempotente) | 288 |
| `database/migrations/002_vistas.sql` | Vista vw_estudiantes_estado: Activo / Moroso / Fuera de la Academia en tiempo real | 39 |
| `database/migrations/003_modulos_premium.sql` | Catálogo y candados premium (todos deshabilitados) + parámetro MATRICULA_USD | 39 |
| `errors/AppError.js` | Error de dominio con contrato JSON estable | 35 |
| `middlewares/auth.js` | JWT HS256 + roles (admin, secretaria) | 36 |
| `middlewares/errorHandler.js` | Traduce AppError/multer/body-parser/MSSQL a JSON; nunca filtra SQL ni stack | 81 |
| `middlewares/limitador.js` | Limitador por IP en memoria (login, formularios públicos, portal) | 37 |
| `middlewares/requestId.js` | Id de correlación por petición | 12 |
| `middlewares/seguridad.js` | Cabeceras de seguridad y CORS por lista blanca | 28 |
| `modules/premium/catalogo.js` | Catálogo de la Fase 2 (5 módulos) con tooltip "Módulo Premium Deshabilitado" | 20 |
| `modules/premium/guard.js` | Candado: 403 MODULO_PREMIUM_DESHABILITADO, caché 15 s | 51 |
| `modules/premium/premium.routes.js` | Endpoints reservados (501 si habilitado) + redirección pública de la Fachada Web | 68 |
| `public/admin/admin.css` | Sistema de diseño (glassmorphism sobrio, tokens, ControlSidebar, bloqueo cristal) | 54 |
| `public/admin/admin.js` | Dashboard, estudiantes, auditoría, contabilidad, vistas premium con candado | 136 |
| `public/admin/index.html` | Shell del AdminDashboard | 6 |
| `public/admisiones/index.html` | Planilla pública de inscripción con costo en USD/Bs. y cuentas | 39 |
| `public/portal/index.html` | Portal privado (registro de referencia) | 19 |
| `routes/index.js` | Mapa único de rutas (públicas, portal, panel, premium) | 100 |
| `scripts/crear-admin.js` | Crea el primer admin desde variables de entorno (sin claves en el chat) | 27 |
| `scripts/migrate.js` | Aplica migraciones (lotes GO) una sola vez cada una | 45 |
| `server.js` | Arranque, apagado ordenado, cierre del pool MSSQL | 31 |
| `services/admisiones.service.js` | Inscripción transaccional: BD + referencia + Drive, con compensación | 116 |
| `services/bcv.service.js` | Tasa oficial BCV (caché 5 min, modo fresca, respaldo <=24 h marcado) | 80 |
| `services/contabilidad.service.js` | Personal, horas, nómina mixta, egresos, balance neto | 210 |
| `services/crm.service.js` | Gestor académico: resumen, listado, detalle, retiro/reactivación | 87 |
| `services/drive.service.js` | Carpeta Nombre_Apellido_ID y 3 documentos por stream desde memoria | 78 |
| `services/exportacion.service.js` | Excel (.xlsx) en streaming por lotes de 1000 filas | 150 |
| `services/facturacion.service.js` | Tablero financiero del mes, cuotas, mensualidades masivas | 86 |
| `services/nomina.calc.js` | Cálculo exacto Fijo / Honorarios / Mixto (centavos con BigInt) | 26 |
| `services/notificaciones.service.js` | Alertas WhatsApp manual-individual: preventiva (3-5 d) y morosidad | 125 |
| `services/pagos.service.js` | Declarar referencia, bandeja cronológica, aprobar/rechazar con bloqueo | 106 |
| `services/parametros.service.js` | Parámetros y cuentas de pago de la academia | 34 |
| `services/plantillas.whatsapp.js` | Plantillas de texto estrictas de ambas alertas | 60 |
| `services/portal.service.js` | Link único (token SHA-256), vista y registro de referencia | 62 |
| `services/whatsapp.service.js` | Envío por Meta Cloud API (lanza si falla) | 34 |
| `utils/archivos.js` | Magic bytes y nombre seguro de carpeta Drive | 23 |
| `utils/dinero.js` | Aritmética monetaria exacta | 32 |
| `utils/fechas.js` | Fechas en huso Caracas (UTC-4) | 51 |
| `utils/http.js` | asyncHandler y respuesta {ok,data} | 8 |
| `utils/semaforo.js` | Tope de cargas simultáneas | 23 |
| `utils/telefono.js` | Teléfono unificado sin espacios | 23 |
| `utils/validar.js` | Validador declarativo (acumula errores en un solo 422) | 102 |

Pruebas: `tests/admisiones.test.js`, `bcv-premium.test.js`, `errores.test.js`, `negocio.test.js`, `notificaciones.test.js`, `schema-consistencia.test.js`, `utils.test.js`, `helpers/entorno.js`.

## 4. Cumplimiento del Core Base

| Requisito | Dónde | Notas |
|---|---|---|
| A. Formulario público (personales, académicos, médicos) | `public/admisiones`, `POST /api/public/admisiones` | Valida y acumula todos los errores en un 422 |
| A. Teléfonos en una sola cadena sin espacios | `utils/telefono.js` + `CHECK NOT LIKE '% %'` | Código de país + número se unen; defensa doble (backend y BD) |
| A. Streams/buffers → Drive, carpeta `Nombre_Apellido_ID`, 3 documentos | `drive.service.js`, `multer.memoryStorage` | Nada se escribe a disco; tipo real por *magic bytes*; foto solo imagen |
| A. Estatus "Pendiente por Validación Administrativa" | `estudiantes.estatus_academico` | Si Drive falla, **todo se revierte**; si la BD falla tras Drive, la carpeta va a la papelera |
| A. Referencia bancaria obligatoria + costo a tasa BCV + cuentas | `GET /api/public/admisiones/config` | Índice único filtrado: una referencia no se reutiliza (las rechazadas la liberan) |
| B. Esquema MSSQL + estados Activos / Fuera / Morosos en tiempo real | `001_core_base.sql`, vista `vw_estudiantes_estado` | "Moroso" = cuota Pendiente o En Revisión vencida (día de Caracas) |
| C. Personal, nómina mixta (fijo / honorarios por horas / mixto), egresos, balance neto | `contabilidad.*` | Cálculo exacto en centavos; pagar nómina asienta el egreso en la misma transacción |
| C. Exportar nómina, egresos y personal a Excel | `GET /api/exportaciones/contabilidad.xlsx` | Streaming por lotes de 1000; hojas Personal, Horas, Nómina, Egresos, Balance mensual |
| D. Tablero del mes (cobrado, vencido, pendiente) | `GET /api/facturacion/tablero` | |
| D. Bandeja de auditoría cronológica; aprobar → "Al día" | `/api/facturacion/auditoria` | Bloqueo `UPDLOCK`: dos admins no aprueban el mismo pago |
| D. Exportar histórico de facturación | `GET /api/exportaciones/facturacion.xlsx` | |
| E. Tasa BCV en el instante del envío | `bcv.service.js` (`fresca:true`) | Si no hay tasa fresca, **no se genera la alerta** (503) |
| E. Alerta Preventiva (3–5 días) y por Morosidad, manual-individual | `POST /api/notificaciones/whatsapp/{preventiva\|morosidad}/:id` | Sin `?enviar=true` solo genera texto + enlace `wa.me`; con él, envía por Meta |

**Excepciones JSON:** todo error sale como `{ ok:false, error:{ codigo, mensaje, detalles?, requestId } }` (incluidos 404, JSON malformado, archivos grandes, duplicados MSSQL 2601/2627, FK 547, deadlock 1205, timeouts y BD caída). Nunca se expone SQL ni stack.

**Fase 2 (candados):** tabla `modulos_premium` con los 5 módulos **deshabilitados** (US$ 200 / 150 / 300 / 450 / 550). Deshabilitado → `403 MODULO_PREMIUM_DESHABILITADO` con tooltip "Módulo Premium Deshabilitado" y precio; habilitado sin lógica → `501 NO_IMPLEMENTADO`. Activación: `UPDATE dbo.modulos_premium SET habilitado = 1 …` (ver `003_modulos_premium.sql`). Rutas: `/api/premium/ia-atencion`, `/whatsapp-automatico`, `/bancamiga`, `/api/movil/v1`, y `/ir/admisiones` (redirección pública de la Fachada Web conservando UTM).

## 5. Decisiones y puntos que debes conocer

1. **Supabase no se integró.** El prompt lo lista como conector, pero choca con el requisito de MSSQL; usar ambos duplicaría la fuente de verdad. Si quieres Supabase solo para *storage de respaldo*, es una adición aparte.
2. **Conectores (Calendar, Gmail, Jira/Confluence, Vercel) y skills de proceso (`to-tickets`, `triage`, `wayfinder`…) no se invocaron:** crean cosas en sistemas externos que no pediste explícitamente. Dímelo y los uso.
3. **`graphify` es una skill de grafos de código**, no de gráficas. Los reportes visuales del panel (barras de cobrado por día) son SVG/CSS propios; `img2threejs` no aplica todavía: solo se dejó la ruta `/ir/admisiones`.
4. **"Al día"** es un estado derivado: tras aprobar, la respuesta devuelve `estatus_pago` recalculado; es "Al día" solo si no quedan otras cuotas vencidas (si las hay, sigue "Moroso", que es lo correcto).
5. **Matrícula sin precio inventado:** `MATRICULA_USD` nace en `0.00` y las inscripciones responden `503 CONFIG_INCOMPLETA` hasta que el admin la fije (`PUT /api/configuracion/matricula`). Igual las cuentas Zelle/Binance/PayPal/Pago Móvil: se cargan por `POST /api/configuracion/cuentas`.
6. **Drive:** una cuenta de servicio no tiene cuota propia. La carpeta padre debe estar en una **Unidad Compartida** o las subidas fallarán con `storageQuotaExceeded`.
7. **Transacción abierta durante la subida a Drive** (para poder revertir). Mitigado con un tope de 4 inscripciones simultáneas (`ADMISIONES_CONCURRENCIA_MAX`) → `503 SERVIDOR_OCUPADO` + `Retry-After`. Con volumen alto conviene pasar a subida asíncrona con cola.
8. **Limitadores en memoria:** válidos para una sola instancia; con réplicas, moverlos a Redis/WAF.
9. **API BCV:** por defecto `https://ve.dolarapi.com/v1/dolares/oficial` (campo `promedio`), configurable con `BCV_API_URL`. Es un agregador, no el BCV directamente: confirma que la fuente sea aceptable para cobranza.
10. Las alertas por WhatsApp fuera de la ventana de 24 h de Meta pueden exigir una **plantilla aprobada**; hoy se envía texto libre. Si Meta rechaza, queda `FALLIDA` y la API responde 502.

## 6. Puesta en marcha

```bash
npm install
cp .env.example .env          # completar DB_*, JWT_SECRET (>=32), Drive, WhatsApp, PORTAL_BASE_URL
npm run migrate               # aplica database/migrations/*.sql
ADMIN_EMAIL=… ADMIN_PASSWORD=… npm run crear-admin   # contraseña >= 12 caracteres
npm test && npm start
```

Smoke test sugerido tras el primer arranque: `GET /api/health/db`, login, fijar matrícula y cuentas, una inscripción de prueba con 3 archivos, aprobarla en la bandeja, `GET /api/exportaciones/facturacion.xlsx`.

## 7. Sistema de diseño (uiux-pro-max)

Estilo: Glassmorphism sobrio (superficies ≥ 80 % de opacidad), Inter, escala 4/8 px. Paleta: texto `#0F172A`, secundario `#475569`, fondo `#F8FAFC`, primario `#4338CA`, éxito `#047857`, alerta `#B45309`, error `#B91C1C`. Iconos SVG (sin emojis), foco visible, `prefers-reduced-motion`. Los candados muestran el tooltip del servidor ("Módulo Premium Deshabilitado") y la pantalla de bloqueo es un panel de cristal sobre una vista previa difuminada. Todo dato dinámico se inserta escapado (los datos del formulario público no son de confianza).
