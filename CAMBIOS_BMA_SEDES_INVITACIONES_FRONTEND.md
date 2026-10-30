# CAMBIOS_BMA_SEDES_INVITACIONES_FRONTEND — Gestor de Sedes y Generador de Invitaciones con nivel blindado (Vite + TypeScript + Tailwind)

**Proyecto:** Brilliant Minds Academy · **Base:** `origin/development` @ `dc69b72` · **Agente:** Ingeniero Frontend Senior, Astra Digital Solutions
**Motor de datos:** PostgreSQL 15+ / Supabase. **El backend NO se tocó**: esta entrega solo consume `/api/sedes` e `/api/invitaciones`, que ya usan parámetros posicionales `$1…$n` y errores JSON estables. Sin residuos de MSSQL.

## Verificación realizada (y sus límites)

| Verificación | Resultado |
|---|---|
| `tsc` 7.0.2 sobre `frontend/src/**` con TODAS las reglas estrictas de `tsconfig.json` (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noUnused*`, `verbatimModuleSyntax`…) | 0 errores (línea base previa a los cambios: 0 errores) |
| Uso de `any` en los archivos nuevos y modificados | 0 |
| Comportamiento en **Chromium real** (bundle con esbuild + API simulada, 40 casos) | **40/40** |
| Residuos MSSQL (`dbo.`, `GETDATE`, `ISNULL(`, `@p1`, `TOP (`…) en frontend y en `services/sedes`, `services/invitaciones`, `controllers/sedes`, `utils/alcance`, `errorHandler`, migraciones 006–008 | 0 |
| Escala de espaciado (solo 1·2·3·4·6·8·12) y `fetch` crudo (todo pasa por `bmaClient`) | 0 infracciones |

Los 40 casos de navegador cubren: bloqueo «Sección Restringida» **sin ninguna petición** (secretaria con sede, secretaria sin sede, admin atado a sede); cuadrícula de sedes y estado «Operativa»; nombre vacío sin POST; nombre recortado; 409 `SEDE_DUPLICADA` junto al campo; **403 `MODULO_PREMIUM_DESHABILITADO`** (con detalle del servidor y sin él → US$ 50); recarga tras alta; XSS en nombres (no se ejecuta); selector solo con sedes activas; validación de días (`0`, `61`, `abc`, `7.5`, `-3`, vacío); «Otro…»; POST `{nivel_asignado, dias, sede_id}`; tarjeta de éxito con el `enlace`; **«Copiar enlace» escribe en el portapapeles**; recarga de la lista; filtro `?estado=`; cancelar revocación no envía nada; revocar → `POST /:id/revocar`; 409 `INVITACION_NO_REVOCABLE`; secretaria **sin `sede_id` en el POST**; 401 propagado al panel.

**Lo que NO se pudo comprobar aquí**
- `npm ci` falló en este entorno (el CLI de npm se cerró con error), por lo que **`vite build` y la compilación de Tailwind no se ejecutaron**. El tipado se verificó con un `tsc` global y un tsconfig temporal (`types: []`, sin `vite.config.ts`) que hereda las mismas reglas estrictas; el tsconfig temporal ya fue eliminado.
- **Aspecto visual, contraste y objetivos táctiles de 40 px no se midieron** (no hay CSS compilado). Se aplicó `min-h-10` (Tailwind ≥ 3.4, el proyecto usa ^3.4.14) a botones, selects e inputs; conviene revisarlo con los ojos tras el build.
- El cableado de `admin.ts` (menú, `navegar`, botón «Ir a Sedes») se **tipó pero no se ejecutó en navegador** (importa el CSS de Vite). Las dos vistas sí se ejecutaron aisladas.
- **`public/` NO se regeneró** (salida de Vite con hashes). Ejecuta `npm run frontend:install && npm run frontend:build`.
- Los tests del backend no se ejecutaron (sin dependencias instaladas); no hay cambios de backend.

## Decisiones y desviaciones respecto al enunciado

| Enunciado | Qué se hizo y por qué |
|---|---|
| Helper `alcanceDe()` «ya existente» | Existía solo en el backend (`utils/alcance.js`). Se creó su espejo **fail-closed** en `lib/alcance.ts` (`consolidado` / `sede` / `denegado`). Es la cara visible de la regla; el servidor sigue siendo la fuente de verdad. |
| Bloqueo solo para `rol = secretaria` | La regla real del servidor es **«solo consolidado»** (`requireConsolidado` en `POST /api/sedes`). Por eso también un admin atado a una sede ve «Sección Restringida». |
| Precio US$ 50.00 «de `lib/candado.ts`» | `lib/candado.ts` **no guarda precios**: recibe un `DatosCandado`. El precio vigente lo manda el servidor (detalle del 403 y catálogo `/api/premium/modulos`). `sedes-gestion.ts` solo tiene una constante de respaldo (50) por si el detalle del trigger llega ilegible. |
| Error `BM403` | `BM403` es el SQLSTATE del trigger `trg_sedes_limite_base`; `errorHandler` lo traduce a `403 MODULO_PREMIUM_DESHABILITADO`. El cliente detecta ese código (y, por defensa, `BM403`). El candado se pinta reutilizando `bloquearModulo` de `admin.ts`: relee el catálogo, marca el candado en el menú y muestra la pantalla de cristal con la prueba gratuita si aún aplica. |
| «Token SHA-256 único» | El servidor entrega un token aleatorio de 48 hex (192 bits) y guarda **solo su SHA-256**. La UI muestra el `enlace`; se avisa que se ve una sola vez. |
| Estados «Pendiente / Usada / Vencida» | Se añadió **«Revocada»** (el servidor la devuelve) y un filtro por estado. |
| Selector de nivel | No existe lista de grados en el código (el grado es texto libre). `NIVELES` en `invitaciones-modulo.ts` es una **lista base a ajustar** + opción «Otro…». |
| Revocar «de forma atómica» | La atomicidad la da el servidor (`UPDATE … WHERE estado = 'Pendiente'`). El cliente bloquea el botón mientras viaja la petición, pide confirmación y, ante `409 INVITACION_NO_REVOCABLE`, avisa y refresca la lista. |
| Menú | «Sedes» e «Invitaciones» son visibles para ambos roles (la secretaria necesita Invitaciones; Sedes le muestra el bloqueo). |
| Texto del módulo multi-sede habilitado | Hablaba de «POST /api/sedes» a usuarios finales; se reemplazó por un aviso claro y un botón **«Ir a Sedes»** (solo consolidado). |

## Archivos creados

| Archivo | Para qué |
|---|---|
| `frontend/src/sedes-gestion.ts` | Vista «Sedes»: guarda de alcance, cuadrícula de tarjetas, alta con validación, detección del candado premium (`detallePremiumDe`). |
| `frontend/src/invitaciones-modulo.ts` | Vista «Invitaciones»: formulario (sede filtrada por alcance, nivel, días), tarjeta de éxito con «Copiar enlace», lista cronológica paginada con filtro y revocación con confirmación. |
| `frontend/src/lib/alcance.ts` | `alcanceDe(usuario)` fail-closed, espejo del backend. |
| `frontend/src/lib/formulario.ts` | `pintarErrores`, `mostrarMensaje`, `erroresDeCampos`, `valorDe` (compartidos por ambas vistas; mensajes con `textContent`). |
| `CAMBIOS_BMA_SEDES_INVITACIONES_FRONTEND.md` | Este resumen. |
| `bma-sedes-invitaciones-frontend.patch` | Parche `git format-patch` con todo lo anterior. |

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `frontend/src/admin.ts` | Importa las dos vistas; añade «Sedes» e «Invitaciones» a `VISTAS`; ramas en `navegar()`; botón «Ir a Sedes» y texto claro en el módulo multi-sede habilitado. |
| `frontend/src/types/index.ts` | `SedeResumen` (+ `creado_en?`), `InvitacionInscripcion`, `EstadoInvitacion`, `CuerpoCrearSede`, `RespuestaCrearSede`, `CuerpoCrearInvitacion`, `RespuestaCrearInvitacion`, `RespuestaRevocarInvitacion`; `VistaAdmin` suma `'sedes' \| 'invitaciones'`. |
| `frontend/src/lib/icons.ts` | Iconos `link` y `building` (SVG puro, mismo trazo). |

## Contratos consumidos (sin cambios en el servidor)

- `GET /api/sedes` → `SedeResumen[]` (un usuario de sede recibe solo la suya) · `POST /api/sedes { nombre }` → `201 { id, nombre }` · errores `409 SEDE_DUPLICADA`, `403 MODULO_PREMIUM_DESHABILITADO`.
- `POST /api/invitaciones { nivel_asignado, dias, sede_id? }` → `201 { id, sede_id, nivel_asignado, expira_en, token, enlace }` · `GET /api/invitaciones?estado&pagina&limite` → lista paginada · `POST /api/invitaciones/:id/revocar` → `{ id, estado: 'Revocada' }` · errores `403 SEDE_NO_ASIGNADA`, `422 SEDE_INACTIVA`, `409 INVITACION_NO_REVOCABLE`.

## Pendiente / siguientes pasos

1. `npm run frontend:install && npm run frontend:build` y revisar a ojo contraste, 40 px y responsive.
2. Ajustar `NIVELES` a los niveles reales de la academia.
3. Fuera de alcance (los endpoints ya existen): botones de activar/desactivar sede y «compartir por WhatsApp» desde la tarjeta de éxito.
