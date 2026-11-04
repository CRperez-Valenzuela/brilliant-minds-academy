# CAMBIOS_BMA_IDENTIDAD_PLANILLA — Identidad visual BMA + Planilla de Inscripción oficial (MPPE) con expediente dual Madre/Padre

**Proyecto:** Brilliant Minds Academy · **Base real:** `origin/development` @ `0390b25` · **Agente:** Ingeniero Fullstack Senior, Astra Digital Solutions
**Motor de datos:** PostgreSQL 15+ / Supabase. Todas las consultas nuevas usan parámetros posicionales (`$1…$24`); sin residuos de MSSQL.

## ⚠️ Anclaje de Git: `37b0a2b` NO existe en `development`

El prompt exigía estar parado sobre `37b0a2b`. Ese commit **no está en el historial** de `development` (se descargaron sus 16 commits completos; el tip es `0390b25 Feat: Implementación frontend v2 de gestión de sedes…`). Se trabajó sobre `0390b25`, que es la rama pedida. Si tu copia local está en otro commit (p. ej. tienes uno sin subir), aplica con `git apply --3way`; si tu `HEAD` local es `0390b25`, el diff es limpio. `git apply --check` pasó contra un clon nuevo de `0390b25`.

## Verificación realizada (y sus límites)

| Verificación | Resultado |
|---|---|
| `npm test` (sin base de datos) | **140 pasan**, 0 fallan, 57 omitidas (integración) — línea base previa: 131 pasan / 55 omitidas |
| `npm run test:integracion` contra **PostgreSQL 16.15 real** | **57/57** (55 previas + 2 nuevas). Suite completa con BD: **197/197** |
| Migración `010` aplicada por `scripts/migrate.js` y reaplicada dos veces a mano | Sin errores; los 8 CHECK no se duplican |
| `tsc` estricto sobre `frontend/src/**` (todas las reglas de `tsconfig.json`) | 0 errores (línea base: 0). **0 usos de `any`** |
| Planilla pública en **Chromium real** (API simulada) | **25/25**: secciones 1–5, campos condicionales, grilla de autorizadas, edades automáticas, errores por campo, contenido exacto del multipart, 0 errores de consola |
| Ficha del alumno en Chromium real | **13/13**, incluido XSS (`<script>`, `onerror`, `"><b>`) en datos de madre, tratamiento y autorizados: no se ejecuta, se muestra literal |
| Auditor estático SQL↔código (`schema-consistencia`) | Verde: sin T-SQL, parámetros posicionales, columnas existentes |

**Lo que NO se pudo comprobar**
- `npm ci`/`vite build` fallaron en este entorno (el CLI de npm se cerró con error y luego el registro quedó bloqueado por el proxy). **No se compiló Tailwind ni se ejecutó `vite build`**; el tipado y el comportamiento se verificaron con un `tsc` global y módulos ES compilados. **No pude ver el diseño ya pintado**: revisa a ojo la planilla y la ficha tras el build.
- **`public/` NO se regeneró** (salida de Vite con hashes). Ejecuta `npm run frontend:install && npm run frontend:build` y comprueba el diff de `public/assets`.
- El contraste se calculó con la fórmula WCAG sobre los hex (tabla abajo), no sobre pantalla.

## 1. Sistema de diseño — `frontend/tailwind.config.js`, `lib/ui.ts`, `styles/main.css`, `lib/candado.ts`

Los cinco colores exactos del prompt, en `theme.extend.colors`. Cada uno es un objeto para conservar `bg-bma-azul` **y** añadir dos tonos auxiliares (`-suave` fondo tenue, `-oscuro` texto/hover):

| Token | `DEFAULT` | Texto blanco encima | Uso |
|---|---|---|---|
| `bma-azul` | `#0073BB` | 5.04 : 1 ✅ | botones primarios, foco, acentos |
| `bma-verde` | `#4BB387` | 2.59 : 1 ❌ | éxito/«Activo» → solo fondo suave + `bma-verde-oscuro` (5.78 : 1) |
| `bma-coral` | `#F37365` | 2.82 : 1 ❌ | «Moroso»/alertas → fondo suave + `bma-coral-oscuro` (5.29 : 1) |
| `bma-amarillo` | `#F9D03D` | 1.49 : 1 ❌ | avisos → fondo suave + `bma-amarillo-oscuro` (5.88 : 1) |
| `bma-purpura` | `#8C59A4` | 5.15 : 1 ✅ | cabeceras de tabla, candado premium |

Aplicado a través de los tokens centralizados `CLS` (un solo sitio): botón primario azul, botón «Retirar» coral oscuro, «Reactivar» verde oscuro, **cabeceras de todas las tablas en púrpura**, etiquetas/avisos de estado en verde/amarillo/coral/azul suaves, anillo de foco azul y badge del candado premium en púrpura. Los verdes/corales/amarillos puros **no** llevan texto blanco por contraste (lo advierte un comentario en el config).

## 2. Base de datos — `database/migrations/010_ampliacion_planilla.sql`

- **Estudiantes:** `lugar_nacimiento`, `lugar_estudio`, `horario_preferido`, `bajo_tratamiento`, `tratamiento_explicacion`, `emergencia_telefono`.
- **Representantes:** 9 columnas `madre_*` + 9 `padre_*` + `personas_autorizadas JSONB`.
- Idempotente: `ADD COLUMN IF NOT EXISTS` y 8 `CHECK` creados en un bloque `DO $$ … $$` (PL/pgSQL) solo si su nombre no existe: máx. 2 autorizados y JSON tipo arreglo, edad 14–120, teléfonos sin espacios y de 10 a 15 dígitos, explicación de tratamiento ≤ 500.

## 3. Backend (parámetros posicionales)

- `utils/planilla.js` (**nuevo**): validación/normalización pura de ficha médica, Madre/Padre, representante principal y hasta 2 autorizados. Acumula todos los errores en un solo 422.
- `controllers/admisiones.controller.js`: integra el módulo; el **representante principal** (madre o padre) alimenta `representantes.nombres/cedula/email/telefono`, y el **móvil del principal** es el WhatsApp de cobro. El formulario clásico (representante único + teléfono) **sigue funcionando**.
- `services/admisiones.service.js`: upsert del representante con 24 parámetros (`$24::jsonb`) y del estudiante con 20.
- `services/crm.service.js`: `GET /api/estudiantes/:id` devuelve también `madre_*`, `padre_*` y `personas_autorizadas`.

## 4. Frontend

- `types/index.ts`: tipos estrictos sin `any`; los campos `madre_*`/`padre_*`/`autorizada_N_*` se **derivan** de una sola definición con tipos mapeados.
- `admisiones.ts`: planilla en secciones numeradas **1 Estudiante · 2 Representante (madre y padre) · 3 Personas autorizadas** y, como requisitos del flujo, **4 Documentos · 5 Pago**. Campos condicionales (alergia / tratamiento), edades calculadas desde la fecha, grilla dinámica de hasta 2 autorizados (Añadir/Quitar), asteriscos de obligatoriedad que siguen al representante principal. Todo texto dinámico pasa por `html` → `esc()`.
- `estudiantes-detalle.ts`: nueva sección «Familia y autorizados» (tarjeta Madre, Padre — con insignia «Representante principal» — y Personas autorizadas), datos de nacimiento/estudio/horario y tratamiento resaltado. Tablas contables y botones Retirar/Reactivar **intactos**. Expedientes anteriores muestran «No se registró en la planilla».
- `lib/format.ts`: `edadEnAnios` pasó aquí (compartida por la planilla y la ficha; `estudiantes-detalle` la sigue re-exportando).

## Decisiones y desviaciones respecto al prompt

| Prompt | Qué se hizo y por qué |
|---|---|
| `009_ampliacion_planilla.sql` | **`010_…`**: ya existe `009_representantes_telefono_pendiente.sql`; dos `009` serían ambiguas. |
| `public.estudiantes`, `INT` | Tablas **sin `public.`** (convención del repo y requisito del auditor de tests) e **`INTEGER`** (mismo tipo en PostgreSQL). Se añadió `JSONB` a la lista de tipos del auditor. |
| `bajo_tratamiento BOOLEAN DEFAULT FALSE` | Además **`NOT NULL`** (un sí/no no necesita tercer estado). `personas_autorizadas` también `NOT NULL`. |
| `emergencia_telefono` «nueva» | **Ya existía** desde 001: la línea es un no-op deliberado. |
| Datos de madre/padre «individuales» | Se añadió el concepto de **representante principal**: `representantes.nombres/cedula/email/telefono` siguen siendo el contacto de cobro (UNIQUE por cédula, usado por notificaciones y portal). |
| Edad (`madre_edad`) | Con fecha de nacimiento, el servidor **calcula** la edad y descarta la enviada. |
| Planilla «tres secciones» | Las 3 oficiales van numeradas 1–3; documentos y pago (necesarios para inscribir) quedan como 4 y 5, y la nota de costo ya apuntaba al «paso 5». |
| Campos del formulario anterior | `colegio_procedencia`, `condiciones_medicas` y `medicamentos` **salen del formulario público** (la planilla oficial no los pide; «lugar de estudio» y «tratamiento + explicación» los reemplazan). Las columnas, la API y la ficha los conservan. |

## ⚠️ Seguridad: autorizados a retirar al menor

El formulario público es anónimo. Con el esquema pedido (`personas_autorizadas` en `representantes`), quien conociera una cédula podría reescribir **quién puede retirar a un niño**. El upsert aplica la misma regla de H2: `personas_autorizadas` solo se asigna si está en `[]`, y madre/padre solo **rellenan vacíos** (`COALESCE`). Un test con PostgreSQL real lo demuestra. **Consecuencia:** al no haber pantalla de edición, corregir esos datos exige al administrador (SQL o una futura vista). Además, los autorizados pertenecen al **representante**, no al niño: hermanos comparten la lista.

## Pendiente / fuera de alcance (conviene decidirlo)

- **Planilla de Adolescentes** (.docx adjunto): sus campos comunes ya están cubiertos, pero el modelo sigue exigiendo un representante con teléfono para todo estudiante (firma el propio alumno en esa planilla). Habría que decidir si un adolescente puede inscribirse sin representante.
- La planilla pide **dirección y teléfono del estudiante**; no estaban en la lista de columnas del prompt y no se añadieron (las direcciones de madre/padre sí).
- **Logotipo**: no se incrustó (el PNG adjunto pesa 1.4 MB y tiene halo oscuro); la identidad se aplicó vía paleta. Conviene un SVG/PNG optimizado.
- «Año escolar 2026-2027» de la planilla en papel no se cableó (evita quedar desfasado).

## Archivos creados
- `database/migrations/010_ampliacion_planilla.sql`
- `utils/planilla.js`
- `tests/planilla.test.js` (9 pruebas)
- `CAMBIOS_BMA_IDENTIDAD_PLANILLA.md`

## Archivos modificados
- `frontend/tailwind.config.js`, `frontend/src/lib/ui.ts`, `frontend/src/lib/candado.ts`, `frontend/src/styles/main.css`, `frontend/src/lib/format.ts`
- `frontend/src/types/index.ts`, `frontend/src/admisiones.ts`, `frontend/src/estudiantes-detalle.ts`
- `controllers/admisiones.controller.js`, `services/admisiones.service.js`, `services/crm.service.js`
- `tests/admisiones.test.js` (el test H2 fijaba los 5 parámetros antiguos), `tests/integracion.pg.test.js` (+2 pruebas), `tests/schema-consistencia.test.js` (+`JSONB`)

## Cómo aplicarlo

```bash
git checkout development && git status          # debe estar limpio, en 0390b25
git apply --check bma-identidad-planilla.patch   # o: git am bma-identidad-planilla.patch
git am bma-identidad-planilla.patch              # (o git apply para dejarlo sin commit)
npm run migrate                                  # aplica 010 (transaccional, idempotente)
npm test && npm run frontend:install && npm run frontend:build
```
