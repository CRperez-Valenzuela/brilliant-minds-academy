# CAMBIOS_BMA_PREMIUM_008 — Módulos MULTI_SEDE_PREMIUM y FACTURACION_MASIVA · Ficha del estudiante

**Proyecto:** Brilliant Minds Academy · **Rama:** `development` · **Agente:** Ingeniero Fullstack Senior, Astra Digital Solutions
**Infraestructura:** PostgreSQL / Supabase (parámetros posicionales `$1, $2…`, sin MSSQL)

## Qué se entrega

1. **Migración `008_nuevos_premium.sql`** (idempotente): inserta `MULTI_SEDE_PREMIUM` (US$ 50.00) y `FACTURACION_MASIVA` (US$ 20.00) con `ON CONFLICT (codigo) DO NOTHING` y crea el trigger `trg_sedes_limite_base`, que limita el Core Base a **2 sedes**. La 3ª solo entra con `MULTI_SEDE_PREMIUM` habilitado o en prueba vigente; si no, **403 `MODULO_PREMIUM_DESHABILITADO`**.
2. **Ficha del estudiante** (`frontend/src/estudiantes-detalle.ts`): vista del **Core Base**, sin candado. Consume `GET /api/estudiantes/:id`.
3. **Facturación masiva** (`frontend/src/facturacion-masiva.ts`): vista premium con candado de cristal (US$ 20.00 + prueba de 15 días) y formulario hacia `POST /api/facturacion/cuotas/generar-mensualidades`.

## Archivos creados

| Archivo | Contenido |
|---|---|
| `database/migrations/008_nuevos_premium.sql` | Módulos + función `fn_limitar_sedes_base()` (PL/pgSQL, `search_path` fijo, `REVOKE … FROM PUBLIC`, `pg_advisory_xact_lock` que serializa las altas) + trigger `BEFORE INSERT ON sedes`. SQLSTATE propio `BM403`, `DETAIL` en JSON. |
| `frontend/src/estudiantes-detalle.ts` | Ficha: académico, médico, Drive, representante; tablas de cuotas y pagos (5 columnas cada una); modal «Retirar» (motivo obligatorio ≤ 300 + fecha no futura) y «Reactivar»; repintado en el mismo sitio tras cada acción. |
| `frontend/src/facturacion-masiva.ts` | Candado + formulario (concepto, monto USD, `type="date"` con `min` = hoy) + aviso `.msg.okk` con `creadas` del servidor (`.msg.inf` si 0, `.msg.err` si falla). |
| `frontend/src/lib/candado.ts` | Pantalla de cristal, fantasma, oferta de prueba y `encabezadoVista`, **extraídos de `admin.ts`** para compartirlos (antes eran privados). |
| `tests/premium-008.test.js` | Catálogo ↔ migraciones, traducción de `BM403` (incl. `detail` ausente / no-JSON), estilo PostgreSQL puro, ruta protegida. |
| `CAMBIOS_BMA_PREMIUM_008.md`, `bma-premium-008.patch` | Este resumen y el parche. |

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `modules/premium/catalogo.js` | Dos módulos nuevos; constantes `LIMITE_SEDES_BASE = 2` y `MODULO_MULTI_SEDE`. |
| `services/sedes.service.js` | `crear()`: 409 por nombre repetido **antes** que el límite; `exigirCupoDeSede()` con `guard.evaluar(…, { fresco: true })` y 403 con precio. El trigger queda como garantía final. |
| `middlewares/errorHandler.js` | `BM403` → `403 MODULO_PREMIUM_DESHABILITADO` con `detalles` (JSON del trigger leído con `try/catch`). |
| `routes/index.js` | `generar-mensualidades` ahora pasa por `guard.requireModulo('FACTURACION_MASIVA')`. |
| `frontend/src/admin.ts` | Enruta `estudiante:<id>` y `premium:FACTURACION_MASIVA`; nombre del estudiante en el listado abre la ficha; usa `lib/candado.ts`; `bloquearModulo()` para el 403 a mitad de sesión. |
| `frontend/src/types/index.ts`, `lib/icons.ts`, `styles/main.css` | Tipos de la ficha y de la facturación masiva; 2 códigos de módulo; iconos; clases `.msg` / `.okk` / `.inf` / `.err`. |
| `tests/integracion.pg.test.js` | 7 módulos / 8 migraciones; 4 pruebas nuevas del trigger (incl. concurrencia y prueba vencida); la sede 3ª del test del cron habilita el módulo. |

## Contratos

- `POST /api/sedes` con 2 sedes existentes y módulo inactivo → `403 { codigo:'MODULO_PREMIUM_DESHABILITADO', detalles:{ modulo:'MULTI_SEDE_PREMIUM', nombre, precio_usd:50, limite_sedes_base:2 } }`. Igual por SQL directo (`SQLSTATE BM403`).
- `POST /api/facturacion/cuotas/generar-mensualidades` sin módulo → `403 MODULO_PREMIUM_DESHABILITADO` (precio 20). Con módulo → `201 { creadas }`.
- El retiro sigue siendo `POST /api/estudiantes/:id/retirar { motivo, fecha_retiro }`; la obligatoriedad del motivo la impone la interfaz (el servidor admite vacío).

## Decisiones a tener presentes

- **`N'…'` era MSSQL:** los códigos se insertan como literales PostgreSQL normales (`'MULTI_SEDE_PREMIUM'`).
- **Se cuentan todas las sedes**, activas o no: la oferta base limita la existencia, no las abiertas.
- **Vencer la prueba no borra sedes:** solo impide crear nuevas.
- **Fecha de vencimiento en el formulario:** no se permite anterior a hoy (evita volver morosos a todos de golpe). Solo la UI lo impone.
- **Generación masiva:** disponible para `admin` (consolidado = todas las sedes; admin de sede = la suya), igual que la ruta existente; no se añadió confirmación extra porque el servidor es idempotente por (estudiante, concepto).

## Verificación realizada (y sus límites)

| Verificación | Resultado |
|---|---|
| `tsc` 7.0.2 estricto (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noUnused*`) sobre `frontend/src/**` | 0 errores |
| Uso de `any` / `@ts-*` en `frontend/src` | 0 |
| `npm test` + integración contra **PostgreSQL 16 real** (trigger, concurrencia de 4 altas simultáneas → 2 caben, prueba vigente/vencida, INSERT multi-fila, `ON CONFLICT`, re-ejecución de 008) | 166/166 |
| Chromium real con API simulada (ficha, retiro/reactivación, listeners no acumulados, candado US$ 20.00, prueba, `.msg.okk`, 403 a mitad de sesión, rol sin permiso) | 8/8 |

**No se pudo comprobar:** `vite build` y Tailwind (sin acceso al registro de npm) → `public/` **no** contiene las vistas nuevas hasta ejecutar `npm run frontend:install && npm run frontend:build`; el aspecto visual (contraste, responsive) no se midió; la migración **no** se aplicó a la base de Supabase real (`npm run migrate`).
