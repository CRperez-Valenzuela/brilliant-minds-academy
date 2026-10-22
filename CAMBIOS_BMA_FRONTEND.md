# CAMBIOS_BMA_FRONTEND — Interfaces transaccionales (Vite + TypeScript + Tailwind CSS)

**Proyecto:** Brilliant Minds Academy · Core Base (US$750) · **Rama:** `development` · **Agente:** Ingeniero Frontend Senior, Astra Digital Solutions

Se creó el proyecto `frontend/` con las tres interfaces (AdminDashboard, Admisiones públicas, Portal del representante), tipadas en modo estricto y maquetadas con Tailwind (esqueleto neutro Slate). El build escribe directamente en `public/`, la carpeta que ya sirve Express.

## Verificación realizada (y sus límites)

| Verificación | Resultado |
|---|---|
| `tsc` 6.0.3 con `strict` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` + `noUnusedLocals/Parameters`, sobre `src/**` | 0 errores |
| Uso de `any` en `src/` | 0 apariciones |
| Código compilado con `tsc` y ejecutado en **Chromium real** contra una API simulada (17 casos) | 17/17 |
| `npm test` del backend (sin cambios de lógica) | 54/54 (34 de integración omitidos sin `PG_TEST_PORT`, igual que antes) |

Los 17 casos de navegador cubren: costo USD + Bs; validación de los 3 archivos (ausentes, >5 MB, formato, campo borrado del DOM); `FormData` multipart real; bloqueo de envío si la tasa BCV cambió; errores 422 asociados a campos; token del portal tomado de la URL y **sin** el Bearer del panel; POST JSON de referencia; login, Bearer inyectado desde `sessionStorage`, KPIs y barras; sidebar persistente tras recargar; Candado Premium (clases `absolute inset-0 backdrop-blur-md bg-white/80`, precio y aviso); aprobar / rechazar (sin nota no hay petición; con nota se envía `{nota}`); XSS (cargas `<img onerror>` en nombres, referencias, conceptos y cuentas **no se ejecutan** y se ven como texto; enlace `javascript:` de WhatsApp se neutraliza); 401 → vuelve al login.

**Lo que NO se pudo comprobar en este entorno** (el registro de npm está bloqueado):
- `vite build` y la compilación de Tailwind **no se ejecutaron**: `vite`, `tailwindcss`, `postcss` y `autoprefixer` no están instalados. Las pruebas de navegador corrieron sin hoja de estilos, así que verifican comportamiento, **no el aspecto visual**. Los selectores de Tailwind de las variantes (`group-data-[collapsed=true]/sb:…`, `aria-pressed:`, `min-h-96`) siguen la sintaxis de Tailwind 3.4, pero conviene revisarlos con los ojos tras `npm run frontend:build`.
- Contraste, tamaños táctiles y responsive se diseñaron con valores seguros (slate-900 sobre blanco, objetivos de 40 px, `sm:`/`xl:`), pero no se midieron en pantalla.
- `app.js` no se pudo arrancar aquí (Express no está instalado); la ruta nueva es una línea estándar de `express.static` con sintaxis verificada.

## Archivos creados

| Archivo | Contenido |
|---|---|
| `frontend/package.json` | Scripts `dev`, `typecheck`, `build` (`tsc --noEmit && vite build`); devDependencies: vite 5, tailwindcss 3.4, postcss, autoprefixer, typescript 5.6, @types/node. |
| `frontend/tsconfig.json` | Estricto: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitReturns`, `noUnused*`, `verbatimModuleSyntax`, `useUnknownInCatchVariables`. |
| `frontend/tailwind.config.js` | `content: ["./index.html", "./src/**/*.{ts,js}"]` (exacto, según el prompt). |
| `frontend/postcss.config.js` | `tailwindcss` + `autoprefixer`. |
| `frontend/vite.config.ts` | Multi-página (`admin`, `admisiones`, `portal`), `outDir: ../public`, `emptyOutDir: true`; en `vite dev` replica `/admin`, `/admisiones`, `/portal/:token` y hace proxy de `/api` a `localhost:3000`. |
| `frontend/index.html` | Índice solo para `vite dev` (no entra al build). |
| `frontend/{admin,admisiones,portal}/index.html` | Cascarones mínimos (`<div id="app">` + módulo); toda la interfaz se renderiza desde TypeScript. |
| `frontend/src/types/index.ts` | `Usuario`, `Estudiante`, `Cuota`, `PagoReferencia` (exactos al prompt) + sobres de la API, errores, config de admisiones, portal, tablero, auditoría, módulos premium y estado de la UI. Todo `readonly`. |
| `frontend/src/api/bmaClient.ts` | `fetch` envolvente: Bearer desde `sessionStorage`, `{ok,data}`/`{ok:false,error}` → excepciones tipadas `BmaApiError` (con `camposInvalidos()` y `moduloPremium()`), `BmaSesionExpiradaError` (401), `BmaRedError` (sin conexión / tiempo agotado / no-JSON); tiempo límite; `pagina()` y `descargar()`. |
| `frontend/src/lib/html.ts` | `esc()` (sanitizador XSS) y etiqueta `html` que lo aplica a **cada** valor interpolado: un dato dinámico no puede llegar al DOM sin escapar. `urlSegura()` para `href`. |
| `frontend/src/lib/{icons,format,ui}.ts` | Iconos SVG puros; formato USD/Bs/fechas (hoy = Caracas); componentes de UI (etiquetas, avisos, toasts, modales `<dialog>` con foco atrapado, acceso tipado al DOM). |
| `frontend/src/styles/main.css` | Capas de Tailwind, foco visible global, respeto de `prefers-reduced-motion`. |
| `frontend/src/css.d.ts` | Declaración de módulos `*.css`. |
| `frontend/src/admisiones.ts` | Planilla pública (ver abajo). |
| `frontend/src/portal.ts` | Portal del representante. |
| `frontend/src/admin.ts` | AdminDashboard. |
| `CAMBIOS_BMA_FRONTEND.md` | Este resumen. |

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `app.js` | Nueva línea: `app.use('/assets', express.static(public/assets, { immutable, maxAge: '1y' }))` para los recursos con hash de Vite. Las rutas `/admin`, `/admisiones` y `/portal/:token` no cambian. |
| `package.json` (raíz) | Scripts `frontend:install`, `frontend:build`, `frontend:dev`. |

> `public/` (admin, admisiones, portal heredados) **sigue intacto** hasta que se ejecute el build; al ejecutarlo, `emptyOutDir` lo sustituye por la salida de Vite. No hay nada más en `public/` que se pierda.

## Cómo se cumple cada punto del prompt

- **Admisiones:** `GET /api/public/admisiones/config` → muestra US$ y su equivalente en Bs. con la tasa BCV y la hora de consulta (con segundos). Se refresca cada 30 s, al volver a la pestaña y **justo antes de enviar**: si la tasa cambió, se actualiza el monto, se avisa y no se envía hasta que el representante lo vea. La validación de archivos comprueba que los 3 `<input type="file">` existan en el DOM, tengan archivo, no estén vacíos, pesen ≤ 5 MB y sean JPG/PNG (carnet) o JPG/PNG/PDF; recién entonces se construye el `FormData`. Las reglas de texto replican las del backend (cédula, teléfono E.164 de 10–15 dígitos, referencia `^[A-Za-z0-9-]{4,40}$`).
- **Admin:** sidebar colapsable con estado en `localStorage` (clave `bma.sidebar.colapsado`; en móvil arranca colapsado). Colapsado: textos con `sr-only` (siguen disponibles para lectores de pantalla), iconos visibles y tooltip flotante al pasar el ratón o enfocar con teclado. 4 tarjetas KPI de `GET /api/facturacion/tablero` (refresco automático cada 30 s, selector de período); barras diarias con `div` cuya altura se asigna tras montar. Bandeja de auditoría con filtros por estado y paginación; **rechazar abre un modal con nota obligatoria** (máx. 300). Candado Premium: el clic en un módulo bloqueado se intercepta (`preventDefault` + `stopPropagation`) y se inyecta la capa `absolute inset-0 backdrop-blur-md bg-white/80` con precio en USD, descripción y «Módulo Premium Deshabilitado»; también se activa si el servidor responde 403 `MODULO_PREMIUM_DESHABILITADO`.
- **Portal:** token de `/portal/:token` (en desarrollo también `?token=`); no usa el Bearer del panel; banner según estado de cuenta (al día, moroso, en validación, fuera de la academia); cuotas con monto en Bs. calculado por el backend a la tasa BCV (aritmética en BigInt) y total pendiente sumado en centavos; formulario por cuota para declarar la referencia.
- **Diseño:** superficies `bg-white/90` o `/95` (≥ 86 %). Excepciones deliberadas: la capa del Candado (`/80`, lo pide el prompt), el telón oscuro de los diálogos (`/60`) y tintes `/30` en bordes y anillos de etiquetas. Espaciado solo en la escala 1·2·3·4·6·8·12. Foco visible global. Todos los iconos son SVG en línea.

## Hallazgos del bucle de revisión (corregidos antes de entregar)

1. **Contrato:** `GET /api/auth/me` devuelve `{ usuario }`, no el usuario plano; el cliente lo trataba como plano. Corregido (`RespuestaMe`).
2. **Plantillas:** un `false` interpolado se imprimía vacío, de modo que `aria-expanded` y `data-collapsed` quedaban sin valor al expandir el menú. Ahora los booleanos se imprimen como `true`/`false`. Lo detectó la prueba de navegador.
3. **Ruido:** `/favicon.ico` generaba un 404 JSON en consola; se añadió un icono vacío en las páginas.

## Pasos para tu entorno

1. `npm run frontend:install` (instala vite, tailwindcss, postcss, autoprefixer, typescript).
2. `npm run frontend:build` → escribe en `public/` (`/admin`, `/admisiones`, `/portal`, `/assets`). Para desarrollar: `npm run frontend:dev` (Vite en :5173 con proxy a la API en :3000; en el portal usa `/portal/?token=…`).
3. `npm start` y abrir `/admisiones`, `/admin`, `/portal/<token>`.

## Riesgos y decisiones abiertas

- **«Tasa del segundo exacto»:** el servidor cachea la tasa BCV hasta 5 minutos; el frontend muestra la tasa vigente en el servidor y la reconfirma antes de enviar, pero la cifra definitiva en Bs. la fija el backend al registrar el pago.
- **Sin CSP:** `middlewares/seguridad.js` no define Content-Security-Policy. El frontend no usa scripts ni estilos en línea (las alturas de las barras se asignan por DOM), por lo que añadir una CSP estricta (`default-src 'self'`) es viable como siguiente paso.
- **Marca:** el diseño es neutro a propósito; al definirse la identidad bastará con ampliar `theme.extend` en `tailwind.config.js` y sustituir las clases `slate-900` de los botones primarios.
- **Pendientes de la migración anterior** (sin cambios): el `push` de los commits locales sigue bloqueado por permisos del repositorio; riesgo de sobrescritura del representante en el formulario público (decisión de negocio); se recomienda eliminar el código heredado `src/` y `sql/` (Clínica).
