# CAMBIOS_BMA_INTEGRACION — Animación de login, seed multi-sede y vista de configuración de cobro

**Proyecto:** Brilliant Minds Academy · **Base:** `origin/development` @ `277958c` · **Agente:** Arquitecto Principal, Astra Digital Solutions
**Motor:** PostgreSQL 15+ / Supabase (`pg` nativo, parámetros posicionales `$1…$n`, errores JSON estables). Sin residuos de MSSQL.

> **Importante — el enunciado asumía un esquema que no es el real.** Antes de escribir código se leyeron las migraciones 001–007, `config/db.js`, `configuracion.controller.js`, `parametros.service.js`, `utils/alcance.js` y las utilidades del frontend. Las diferencias (tabla de decisiones más abajo) cambiaron el diseño del seed y de la vista; un primer borrador hecho sobre el esquema supuesto se descartó.

## Verificación realizada

| Verificación | Resultado |
|---|---|
| `npm test` sin BD (incluye la auditoría estática `schema-consistencia`: tablas/columnas/`ON CONFLICT`/`$n` del `seed.js`) | 155 pruebas: **107 OK · 0 fallos** · 48 omitidas |
| `PG_TEST_PORT=… npm test` contra **PostgreSQL 16 real** (clúster temporal con roles `anon`/`authenticated`) | **155/155** |
| `scripts/seed.js` sobre PG 16 con migraciones 001–007 aplicadas | Corrida 1: 2 sedes, 3 usuarios, 3 cuentas, 5 representantes, 5 estudiantes, 14 cuotas, 2 referencias · **11/11 comprobaciones OK** |
| Idempotencia | Corrida 2: solo fija la matrícula (0.00 → 120.00) · Corrida 3: **0 filas nuevas** · `--reset`: borra y recrea las mismas filas |
| Caso negativo | Con el trigger `trg_cuotas_heredar_sede` deshabilitado, el seed **falla** (`SEED_VERIFICACION`), hace **ROLLBACK** y no deja datos (verificado con `COUNT(*)`) |
| Verificación independiente con `psql` | 3 Activo/Moroso por sede correctos vía `vw_estudiantes_estado`; `sede_id` heredado en cuotas y pagos; secretarias con sede y admin con `sede_id` NULL |
| `tsc` 7.0.2 sobre `frontend/src` con el `tsconfig` estricto del proyecto (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`…) | 0 errores |
| Lógica de validación (`validarCuenta`, `parsearMonto`, `esAccesoConsolidado`) ejecutada sobre el TS real | 17/17 |
| **Chromium real** (Playwright) con API simulada | 21/21: ver «Pruebas de navegador» |
| Tailwind 4.3.3 compilando los tokens literales de `login-animation.ts` | Las 7 animaciones y `motion-reduce` se generan con los valores esperados |

**Pruebas de navegador (21):** 3 capas + destello con ID único; cada capa con su animación; keyframes registrados; «A» acentuada; promesa de fin; transform final = identidad; `prefers-reduced-motion` sin animación; secretaria ve «Sección restringida» y no dispara peticiones; admin consolidado carga `/configuracion` + `/sedes`; aviso de matrícula sin configurar; **XSS** (`<img onerror>` en un titular se ve como texto y no se ejecuta); ámbito común/sede en la tabla; matrícula inválida no envía `PUT`; `PUT /configuracion/matricula` con `125.5`; formulario vacío exige método/ámbito/titular; campos de Pago Móvil; `POST` con `detalle` tipado y `sede_id` 2; cuenta común con `sede_id: null` y correo normalizado; detalle antiguo con aviso; activar/desactivar reenvía el cuerpo completo.
Además se muestreó la animación con la Web Animations API: en t=0 estructura en (0, −64) con blur 6 px, flecha en (−56, +56) y pata en (0, +56); acople magnético a escala 1.028 hacia 1.3 s; destello visible entre 1.4 s y 2.25 s.

**Límites honestos**
- `pg` real, `vite`, `tailwindcss` 3.4 y `bcryptjs` **no se pudieron instalar** (registro de npm inaccesible). El seed corrió con el cliente mínimo `tests/helpers/pg-minimo.js` (misma precarga que usa la integración del repo) contra un PostgreSQL 16 real. **No se probó contra Supabase en la nube ni con TLS/pooler.** Por eso los arreglos se envían como literal (`'{1,2}'` + `::int[]`): funciona igual con `pg` real y con el cliente mínimo.
- El CSS de las pruebas de navegador se compiló con Tailwind **4.3.3** (único disponible); el frontend declara **3.4**. La sintaxis usada (`[animation:…]`, `motion-reduce:`) es idéntica en ambas. **Falta ejecutar `npm run frontend:install && npm run frontend:build`** y mirar el login y la nueva vista en pantalla.
- **`public/` NO se regeneró** (salida de Vite con hashes): los cambios de `frontend/src` no se ven hasta recompilar.
- La geometría del logotipo es **provisional** (ver «Qué depende de la marca»). No se midió contraste ni responsive en pantalla real.
- Este clon del repositorio es de **solo lectura** para la sesión: los cambios están en el árbol de trabajo (sin commit ni push). Se entrega también `bma-integracion.patch` (convención del repo) para aplicarlos con `git apply`.

## Decisiones y desviaciones respecto al enunciado

| Enunciado | Qué se hizo y por qué |
|---|---|
| `public.sedes` con «Sede Acarigua / Barquisimeto» | La tabla real es `sedes(id SERIAL, nombre UNIQUE, activa)`: **no existe `codigo`**. Se siembran por `nombre` (`ON CONFLICT (nombre)`). |
| «SuperAdmin con `sede_id = NULL`» | El `CHECK` de `usuarios_admin.rol` solo admite `'admin'`/`'secretaria'`. El SuperAdmin es **`rol='admin'` con `sede_id NULL`** (así lo define `utils/alcance.js`). Una secretaria sin sede sería rechazada (`SEDE_NO_ASIGNADA`). |
| Pool propio de `pg` con `DATABASE_URL` | Se reutiliza **`config/db.js`** (`conTransaccion`, `ejecutar`, `closePool`): mismas variables `DB_*`, TLS de Supabase, rollback seguro y conversión de tipos del proyecto. No hay segunda configuración de conexión. |
| 5 estudiantes «Morosos» con `Vencida` | No existe el estado `Vencida`: la mora es **derivada** (`vw_estudiantes_estado`: cuota `Pendiente`/`En Revisión` con vencimiento pasado, hora de Caracas). El seed crea esos casos y la verificación confirma 3 `Activo` + 2 `Moroso` desde la vista. |
| «Referencias en la bandeja de auditoría» | `pagos_referencias` con estado `Por Validar`, `tasa_bcv` y `monto_bs` obligatorios (calculado con `ROUND($n * $m, 2)`), y su cuota en `En Revisión` como lo hace `pagos.service.js`. |
| «Verificar herencia de sede y RLS» | `sede_id` se **omite** en `cuotas` y `pagos_referencias` (los hereda el trigger 006) y se **asigna explícito** en `estudiantes` (no tiene trigger). El aislamiento se prueba con el mismo predicado de la app `($n::int IS NULL OR x.sede_id = $n::int)`. RLS se prueba **funcionalmente** (`SET LOCAL ROLE anon/authenticated` dentro de un `SAVEPOINT`): `42501` o 0 filas = correcto; si esos roles no existen (PG común) se informa «no aplica». No se leen catálogos porque `schema-consistencia` lo prohíbe. |
| `--reset` («limpiar e insertar») | Borra **solo** las filas de prueba (cédulas `V-9000000x`, correos `@seed.bma.test`, cuentas «(prueba)»). Una sede solo se elimina si **nada ajeno** al seed depende de ella. Bloqueado con `NODE_ENV=production` salvo `SEED_ALLOW_PROD=1`. |
| Contraseñas de las cuentas de prueba | `password_hash` es obligatorio. Se usa `SEED_PASSWORD` (≥ 12) o una aleatoria **mostrada una sola vez** al crear las cuentas; nunca queda en el código. Mismo criterio que `crear-admin.js`. |
| `PUT /api/configuracion/matricula` | Existe y es **global** (parámetro `MATRICULA_USD`), no por sede. La vista lo respeta; no se inventó un backend por sede. |
| `POST /api/configuracion/cuentas` para «añadir o editar» | Añadir = `POST`. **Editar y activar/desactivar = `PUT /configuracion/cuentas/:id`**, que ya existe. El `PUT` exige el cuerpo completo (si falta `activa`, el servidor lo pone en `true`): la vista siempre lo reenvía completo. |
| «Datos públicos de cuenta tipados» | El backend guarda `{metodo, titular, detalle ≤ 500}` (texto). La vista define campos por método (correo, Pay ID, banco/teléfono/cédula), los valida y **compone** un `detalle` de formato fijo (`Banco 0102 · Tel 04141234567 · Cédula/RIF V12345678`); al editar lo **interpreta**. Un `detalle` antiguo que no siga el formato se muestra tal cual y se pide re-ingresarlo. Sin cambios de esquema. |
| «Secretaría o administrador» gestionan cuentas | Las 4 rutas son `soloConsolidado` en `routes/index.js`: una secretaria (o un admin con sede) recibe 403. La vista **no finge** permiso: muestra «Sección restringida» sin llamar a la API. Ver propuesta en «Piezas adelantables». |
| «`sede_id` o común» obligatorio | El selector de ámbito **no tiene valor por defecto**: hay que elegir «Común» (`sede_id: null`) o una sede. Una cuenta de sede solo la ven las familias de esa sede (`cuentasActivas`). |
| Animación con «transiciones atómicas de Tailwind» | Las clases `[animation:…]` van **literales** en el código (Tailwind solo genera CSS de clases escritas tal cual; componerlas con `${…}` no habría funcionado en producción — defecto detectado y corregido en la verificación). Los `@keyframes` no existen como clase: se registran una vez con `adoptedStyleSheets` (válido bajo CSP estricta) con respaldo `<style>`. `clasesCoherentes()` comprueba que los tiempos de JS y de las clases coinciden. |
| Imagotipo en 3 capas | IDs únicos: `bma-capa-estructura`, `bma-capa-flecha`, `bma-capa-pata` (+ `bma-destello`). La estructura es el trazo de una **«A»** y la flecha su travesaño ascendente; al final la «A» de «Astra Academy» se tiñe con el acento. |

## Archivos creados

| Archivo | Para qué |
|---|---|
| `scripts/seed.js` | Siembra idempotente y transaccional de 2 sedes, 3 usuarios, 5 estudiantes (3 Activo / 2 Moroso), cuotas, 2 referencias `Por Validar`, 3 cuentas y matrícula de prueba; verifica 11 reglas y revierte si alguna falla. `node scripts/seed.js [--reset]`. |
| `frontend/src/configuracion.ts` | Vista «Configuración de cobro»: formulario de matrícula en USD y gestión tipada de cuentas (Zelle, Binance Pay, PayPal, Pago Móvil) por ámbito Común/sede. Exporta `vistaConfiguracion`, `validarCuenta`, `parsearMonto`, `esAccesoConsolidado`. |
| `frontend/src/login-animation.ts` | Logotipo SVG de 3 capas con la animación de ensamblaje; exporta `montarAnimacionLogin`, `logotipoHtml`, `CLASES`, `TIEMPOS`, `KEYFRAMES_CSS`, `clasesCoherentes`. |
| `CAMBIOS_BMA_INTEGRACION.md` | Este resumen. |
| `bma-integracion.patch` | Todos los cambios anteriores como parche (convención del repo). |

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `frontend/src/admin.ts` | Importa las dos piezas; nueva entrada de menú «Configuración de cobro» (`soloAdmin`) y su ruta en `navegar`; el login monta `#login-logo` con la animación (reemplaza el icono provisional). |
| `frontend/src/api/bmaClient.ts` | Nuevo `bma.put()` (el cliente solo tenía `get/post`; `OpcionesPeticion` ya admitía `PUT`). |
| `frontend/src/types/index.ts` | `VistaAdmin` suma `'configuracion'`; nuevos `CuentaCobro`, `ConfiguracionAcademia`, `SedeResumen`, `CuerpoCuenta`. |

Sin cambios en backend, migraciones, `package.json` ni `tailwind.config.js`.

## Cómo usarlo

```bash
# Semilla (requiere DB_* en .env y migraciones aplicadas: npm run migrate)
SEED_PASSWORD='una-clave-de-12+' node scripts/seed.js          # idempotente
node scripts/seed.js --reset                                   # solo filas de prueba

# Frontend
npm run frontend:install && npm run frontend:build             # regenera public/
```

## Qué depende de la marca del cliente (único pendiente de estas piezas)

- **`TRAZOS`** (los `d` de los 3 paths) y **`METAL`** (degradado) en `login-animation.ts`: al llegar el logotipo final solo se sustituyen esas constantes; IDs, coreografía y API no cambian. La «A» acentuada usa `#0369a1` (provisional) en el keyframe `bma-acento-a`.
- Paleta, tipografía y favicon (hoy Slate neutro y `data:,`).

## Análisis del repositorio: piezas de lógica que se pueden adelantar hoy sin la marca

Hallazgo principal: **el backend está bastante más completo que el frontend.** Endpoints ya implementados y sin ninguna pantalla que los consuma (verificado con búsqueda en `frontend/src`): `facturacion/cuotas`, `generar-mensualidades`, `contabilidad/{personal,horas,nomina,egresos}`, `/invitaciones` y las acciones de `/sedes`; tampoco hay UI para retirar/reactivar estudiantes ni detalle de estudiante. Ordenadas por valor/esfuerzo:

| # | Pieza | Estado del backend | Depende de marca |
|---|---|---|---|
| 1 | **Vista Sedes e Invitaciones** (crear/activar sede; generar enlace de inscripción con nivel y vigencia, copiarlo y revocarlo). Es el flujo que sostiene el multi-sede. | Listo (`/sedes`, `/invitaciones`) | No |
| 2 | **Vista Facturación**: crear cuota, generar mensualidades masivas (acción `soloAdmin`), listado de cuotas con filtros por sede/estado. | Listo | No |
| 3 | **Contabilidad completa**: personal, registro de horas, cálculo y pago de nómina, egresos. Hoy solo existe el balance. | Listo (solo consolidado) | No |
| 4 | **Ficha de estudiante** con retirar/reactivar y su historial de cuotas/pagos/notificaciones. | Listo (`/estudiantes/:id`, `retirar`, `reactivar`) | No |
| 5 | **Pruebas del frontend en CI**: pasar `validarCuenta`/`parsearMonto`/`clasesCoherentes` a `node:test` (con `tsx`) y automatizar las pruebas de navegador usadas aquí. Hoy `tests/` no cubre `frontend/`. | — | No |
| 6 | **Workflow de CI** (GitHub Actions): `tsc`, `frontend:build`, `npm test` y la integración con un servicio PostgreSQL; que el build regenere `public/`. | — | No |
| 7 | **Seed en la integración**: una prueba que ejecute `seed.js` dos veces sobre la BD desechable de `integracion.pg.test.js` (idempotencia + herencia de sede) y un alias `npm run seed`. | — | No |
| 8 | **Mecanismo de marca**: mover paleta y tipografía a variables CSS / `theme.extend` (alias `marca-*` apuntando hoy a Slate) para que el cambio de identidad sea de un solo archivo. | — | Solo el cambio final |
| 9 | **Auditoría de cambios de configuración** (quién cambió la matrícula o una cuenta y cuándo): migración 008 + escritura en `configuracion.controller`. Es información sensible de cobro. | Requiere migración | No |
| 10 | **Estados vacíos/carga/errores y accesibilidad** de las vistas nuevas con la skill `design:accessibility-review` (contraste y objetivos táctiles medidos en pantalla real tras el build). | — | No |

**Decisiones de negocio que bloquean (no se programaron a propósito):**
- **Matrícula por sede.** Hoy es un único valor global. Cambiarlo implica una migración (p. ej. `parametros` con alcance por sede o una tabla `matricula_sede`), ajustar `parametros.matriculaUsd(sedeId)` y el formulario de invitación. Confirmar con el cliente si las sedes cobran distinto.
- **Autonomía de la secretaria.** Si cada secretaria debe administrar las cuentas de **su** sede, hay que relajar `soloConsolidado` en `POST/PUT /configuracion/cuentas` aplicando `alcanceDe(req.usuario)` (forzar `sede_id` = la suya y prohibir «común»). Además `GET /configuracion` (que también alimenta la matrícula) es solo-consolidado: haría falta una lectura por alcance y, en la vista, separar la sección de matrícula (consolidado) de la de cuentas (por sede) y relajar `esAccesoConsolidado` solo para esta última.
