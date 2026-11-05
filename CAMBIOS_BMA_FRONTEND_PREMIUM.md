# CAMBIOS · Login premium, fondo azul BMA y saneamiento de sedes

Rama `development` · ancla `0390b25` (ancestro verificado) · se aplica sobre `43fe85b` (entrega anterior de colores/redirección).
Motor: PostgreSQL nativo de Supabase (parámetros posicionales `$1, $2…`, sin residuos de MSSQL).

## Archivos

| Acción | Archivo | Qué cambia |
|---|---|---|
| NUEVO | `frontend/src/assets/bma-logo.webp` (800×735) · `bma-isotipo.webp` (256×256) | Logotipo oficial BMA y su isotipo, con alfa, optimizados (WebP). Único logotipo del panel. |
| NUEVO | `frontend/src/lib/marca.ts` | `logoCompletoHtml()` / `isotipoHtml()`: `<img>` con `alt`, dimensiones intrínsecas (sin saltos de layout) y `fetchpriority` en el login. |
| NUEVO | `frontend/src/types/assets.d.ts` | Declaración `*.webp` para TypeScript estricto. |
| EDIT | `frontend/src/admin.ts` | Login rediseñado; sidebar con logo (colapsado → isotipo); contenedor central sólido; ítem activo `bg-bma-azul`; texto de sedes. |
| BORRADO | `frontend/src/login-animation.ts` | Eliminado el isotipo provisional de Astra y sus keyframes. |
| EDIT | `frontend/src/lib/ui.ts` | `CLS.loginTarjeta` (`bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8 max-w-md w-full`), `CLS.tarjeta` sólida `bg-white rounded-xl`, foco `focus:ring-2 focus:ring-bma-azul`, transiciones suaves, `CLS.btnLogin`. `CLS.th` ya era `bg-bma-purpura` + blanco. |
| EDIT | `frontend/src/styles/main.css` | `html[data-panel='admin']` → `bg-bma-azul bg-none` (#0073BB rígido, sin degradado). Atado al atributo para no pintar de azul la planilla pública ni el portal, que comparten este CSS. |
| EDIT | `frontend/admin/index.html` | `<html data-panel="admin">`, `theme-color #0073BB`, `noscript` legible. |
| EDIT | `frontend/src/sedes-gestion.ts`, `modules/premium/catalogo.js`, `008_nuevos_premium.sql` (solo textos) | «Sede Este» / «Sede Norte» en comentarios, placeholder y descripción del módulo. |
| NUEVO | `database/migrations/011_sedes_este_norte.sql` | Renombra en sitio (idempotente, conserva ids) `Sede Acarigua`→`Sede Este`, `Sede Barquisimeto`→`Sede Norte` en bases ya migradas. No inserta sedes. |
| EDIT | `scripts/seed.js` | Sedes `Sede Este`/`Sede Norte` con `INSERT … ON CONFLICT (nombre) DO UPDATE … RETURNING id, (xmax = 0) AS creada`; renombra antes los datos de prueba heredados; usuarios/cuentas de prueba renombrados. |
| NUEVO | `tests/frontend-identidad.test.js` | Guarda de identidad: sin Astra, logo BMA, azul solo en `data-panel=admin`, `th` morado, sedes oficiales. |

## Por qué la migración 008 no inserta las sedes
`scripts/migrate.js` aplica cada archivo una sola vez (por nombre, sin checksum): editar 008 no reejecutaría nada en bases existentes, y
`tests/integracion.pg.test.js` exige 0 sedes tras migrar (el trigger `trg_sedes_limite_base` cuenta sedes para el límite del Core Base).
Por eso 008 solo recibió texto, la corrección real para bases existentes es **011**, y la creación con `ON CONFLICT (nombre) DO UPDATE` vive en `seed.js`.

## Accesibilidad (WCAG 2.1 AA)
Ningún texto va directamente sobre #0073BB (texto oscuro sobre él da 3.6:1). El contenido flota sobre `bg-slate-50/95` y tarjetas `bg-white`.
Pares: blanco/#0073BB 5.04 · blanco/#8C59A4 5.15 · #2A7253/#E8F6F0 5.20 · #A23429/#FEECEA 6.01. `motion-reduce` respetado en transiciones.

## Verificación realizada
- `tsc` estricto (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`…): 0 errores; 0 `any`.
- `npm test`: **203/203** con PostgreSQL 16 real (`PG_TEST_PORT`), incluidas migraciones 001–011 y la guarda de SQL posicional.
- Migrar + sembrar en BD limpia: `Sede Este`, `Sede Norte`; segunda corrida sin duplicados. BD «antigua» (Acarigua/Barquisimeto): 011 y el seed la renombran sin duplicar; 011 es idempotente.
- Capturas Playwright (CSS compilado, API simulada): login 1280 y 390 px, panel expandido y colapsado; `body` = `rgb(0,115,187)`, `th` = `rgb(140,89,164)`.

## Pendiente de tu lado
`npm run frontend:install && npm run frontend:build` (en este entorno no hay acceso a npm, no se pudo ejecutar Vite ni regenerar `public/`).
Luego `npm run migrate` para aplicar 011.
