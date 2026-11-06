# CAMBIOS · Llave en mano final (rendimiento, red neuronal, precios, sedes e ingesta)

Rama `development` · ancla `0390b25` · se aplica sobre `cbc8032` (entrega anterior). PostgreSQL nativo de Supabase, parámetros `$1…$n`.
Aplicar: `git am --keep-cr bma-llave-en-mano-final.patch` (o `git apply --index`). `--keep-cr` es necesario por los CRLF de `ui.ts`/`crm.service.js`.

## Archivos

| Acción | Archivo | Qué cambia |
|---|---|---|
| NUEVO | `frontend/src/lib/cache.ts` | Caché «stale-while-revalidate» en `sessionStorage`: pinta lo guardado al instante y refresca en segundo plano (repinta solo si cambió; un fallo de fondo no borra lo visible; 401 siempre se propaga). Validado con guardas de tipo, se vacía al entrar/salir de sesión. |
| NUEVO | `frontend/src/lib/sedes-cache.ts` | Clave y guarda del caché de sedes (compartido por Sedes y Estudiantes). |
| NUEVO | `frontend/src/lib/esqueleto.ts` | Skeleton loaders (`animate-pulse` + `bg-slate-200`) para tabla, tarjetas y genérico. |
| NUEVO | `frontend/src/lib/red-neuronal.ts` | Canvas 2D: nodos y partículas conectadas; ~1/3 anclados a una «A» abstracta; atracción/enlace con el cursor; `prefers-reduced-motion`, DPR, limpieza de listeners. |
| NUEVO | `frontend/src/lib/firma.ts` | Firma «Diseñado y desarrollado por Astra Digital Solutions» (login) y «Astra Academy Suite v1.0» (base del sidebar) con isotipo «A» en cian `#22D3EE`. |
| EDIT | `frontend/src/admin.ts` | Navegación: esqueleto en el mismo cuadro; login con canvas + firma + Outfit; sidebar con firma; Egresos oculto (`MODULO_EGRESOS_ACTIVO = false`); lista de estudiantes con columnas **Nivel** y **Sede**, selector de sede y SWR; filtro por `sedeFiltro`. |
| EDIT | `frontend/src/sedes-gestion.ts` | Tarjetas de sede clicables (`button` accesible, listener) → guarda `sede_id` y abre Estudiantes filtrado; lista con caché SWR. |
| EDIT | `frontend/src/invitaciones-modulo.ts` | `NIVELES` fijos: Kids 1 B, Kids 1 A, Beginner B, Beginner A, Adultos, Kids 1 C, Beginner C. |
| EDIT | `estudiantes-detalle.ts`, `admisiones.ts`, `types/index.ts` | «Grado» → «Nivel» (la ficha conserva «Grado de estudio» = último grado aprobado); tipos `sede_id`/`sede`. |
| EDIT | `frontend/tailwind.config.js`, `frontend/admin/index.html` | Fuentes Inter (sans) y Outfit (`font-display`) desde Google Fonts, con respaldo del sistema. |
| EDIT | `controllers/crm.controller.js`, `services/crm.service.js` | `GET /api/estudiantes?sede_id=`: solo acota al acceso consolidado (el alcance de una secretaria manda siempre); el listado devuelve `sede_id` y `sede`. |
| NUEVO | `database/migrations/012_ajuste_precios.sql` | Precios definitivos, idempotente, sin tocar el estado de los módulos. |
| EDIT | `modules/premium/catalogo.js`, `modules/premium/guard.js` | Precios del catálogo alineados; orden estable `precio_usd, codigo`. |
| NUEVO | `scripts/importar_este.js` | Ingesta de la Sede Este desde el Excel (ver abajo). |
| TESTS | `tests/importar-este.test.js` (nuevo, datos sintéticos), `tests/frontend-identidad.test.js`, `tests/premium-008.test.js`, `tests/integracion.pg.test.js` | Parseo de ingesta, rendimiento/identidad, precio vigente 012, filtro de sede y 012 idempotente. |

## Precios (012)
`FACHADA_WEB` 450 · `APP_MOVIL` 350 · `WHATSAPP_AUTOMATICO` 50 · `IA_ATENCION` 150 (`ATENCION_IA` en tu prompt) · `BANCAMIGA` 250 (`INTEGRACION_BANCARIA` en tu prompt).
Los códigos reales no se renombraron: están enlazados a rutas, guards e interfaz.

## Egresos
«Egresos y contabilidad» (balance, nómina, personal) sale del menú y su ruta cae al Dashboard. El backend `/api/contabilidad` queda intacto;
para reactivarlo basta `MODULO_EGRESOS_ACTIVO = true` en `admin.ts`.

## Ingesta `scripts/importar_este.js`
`node scripts/importar_este.js --archivo "/ruta/Datos_Academia_BMA_-_Sede_Este.xlsx" [--dry-run] [--vence AAAA-MM-DD] [--monto N]`
- Lee el Excel desde una ruta local: **no hay datos de menores en el repositorio** y el informe no imprime nombres ni teléfonos (solo hoja/fila).
- Todo a `Sede Este`, estudiante `Activo`, nivel por bloque de grupo, una sola transacción, idempotente (`ON CONFLICT`, `NOT EXISTS`).
- Representante: mismo nombre + teléfono = una ficha (hermanos). **El Excel no trae cédula ni fecha de nacimiento**: se asigna cédula
  provisional `IMP-XXXXXXXXXXXX` y fecha de nacimiento aproximada (1-jul de año de inscripción − edad). Hay que completarlas luego en el CRM.
- Cuota «Matrícula inicial» `Pendiente`: monto = `MATRICULA_USD` (o `--monto`), vence hoy + 30 días (o `--vence`).
- Prueba con tu archivo (BD local desechable): 63 alumnos importados, 3 omitidos; 2.ª ejecución: 0 nuevos.

## Verificación
`tsc` estricto sin errores, 0 `any`; `npm test` con PostgreSQL 16 real: **211/211**; migración 012 aplicada; capturas Playwright (login con red neuronal, sedes, CRM filtrado).
Pendiente tuyo: `npm run frontend:install && npm run frontend:build`, `npm run migrate` y la ingesta.
