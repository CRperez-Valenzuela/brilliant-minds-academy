# CAMBIOS_BMA_COLORES_REDIRECCION — Vestido cromático BMA y redirección de entrega profesional

**Proyecto:** Brilliant Minds Academy · **Rama:** `development` · **Base del patch:** `bed0cde` (tip de `development`)
**Anclaje de Git:** `0390b25` existe y **es ancestro** de `bed0cde` (`git merge-base --is-ancestor 0390b25 HEAD` → sí). El patch se genera sobre `bed0cde`, no sobre `0390b25`, porque ese commit posterior (`Inyección de identidad corporativa BMA…`) ya introdujo los tokens `bma-*-suave/-oscuro` y `CLS.*` que este prompt da por existentes (`bg-bma-verde-suave`, `bg-bma-purpura`…). Si tu copia local está en `0390b25`, haz `git pull` de `development` antes de aplicar.
**Motor de datos:** PostgreSQL / Supabase. **Este cambio no toca SQL, migraciones, `config/db` ni servicios**; no hay consultas nuevas.
**Animación vectorial del logo:** pospuesta a la siguiente fase, como se indicó.

## Archivos

| Acción | Archivo | Qué cambia |
|---|---|---|
| Modificado | `app.js` | `GET /` ahora hace `res.redirect('/admin')` (antes `/admisiones`). Ruta exacta: no afecta `/assets`, `/admin`, `/admisiones` ni `/portal/:token`. |
| Eliminado | `frontend/index.html` | Índice temporal de desarrollo con viñetas genéricas (solo servía en `vite dev`; no entraba al build). |
| Modificado | `frontend/vite.config.ts` | El plugin `bma-rutas-express` redirige `/` → `/admin/` en `vite dev`, igual que Express (sin el índice eliminado, `/` habría dado 404). |
| Modificado | `frontend/tailwind.config.js` | Tonos `-oscuro` auditados: verde `#2A7253`, coral `#A23429`, amarillo `#82650C`, y comentarios con los ratios de contraste. Diff mínimo (14+/12−). |
| Modificado | `frontend/src/admin.ts` | Botones **Preventiva** y **Morosidad** (CRM Escolar) pasan de `btnSecundario` a `btnPrimario` (`bg-bma-azul`). Texto del KPI «malo»: `text-red-800` → `text-bma-coral-oscuro`. |
| Modificado | `frontend/src/estudiantes-detalle.ts` | «Deuda vencida» en la ficha: `text-red-800` → `text-bma-coral-oscuro`. |
| Creado | `tests/raiz-redireccion.test.js` | 3 pruebas: `/` → `/admin` (302, sin `next()`), no interfiere con `/assets` `/admin` `/admisiones`, índice temporal eliminado. |
| Creado | `CAMBIOS_BMA_COLORES_REDIRECCION.md` | Este resumen. |

Sin cambios, a propósito:
- **`frontend/src/lib/ui.ts`** ya cumple lo pedido y es la única fuente: `CLS.th` = `bg-bma-purpura … text-white`; `etiquetaEstado` usa `bg-bma-verde-suave text-bma-verde-oscuro` (Activo) y `bg-bma-coral-suave text-bma-coral-oscuro` (Moroso); `btnPeligro` («Retirar») = `bg-bma-coral-oscuro`. Los tres tonos nuevos de `tailwind.config.js` se propagan por aquí sin tocar el código.
- **Cabeceras de tabla:** 34 de 34 `<th>` del frontend usan `CLS.th` (CRM Escolar, Auditoría de Referencias, ficha del alumno, sedes/invitaciones, configuración).
- **`frontend/src/facturacion-masiva.ts`:** es un formulario (no tiene tabla) y su botón «Generar» ya era `bg-bma-azul`; los `*` rojos son de validación de formulario, no estado de marca. No requirió cambios.

## Decisiones que se apartan de la letra del prompt

1. **La ruta `/` vive en `app.js`, no en `routes/index.js`** (este es solo el router `/api`). El prompt admitía «tu ruteador Express correspondiente».
2. **302, no 301.** El prompt dice «permanente» pero fija el código `res.redirect('/admin')`, que es 302. Un 301 queda en caché del navegador de forma indefinida y no podrías reapuntar la raíz después. Para 301: `res.redirect(301, '/admin')`.
3. **La paleta ya existía** (con estructura anidada `DEFAULT/suave/oscuro`, que produce exactamente las clases pedidas). Se conservó y solo se ajustaron los tres `-oscuro` a los valores auditados. `bma-azul-oscuro` y `bma-purpura-oscuro` no estaban en el prompt y se dejaron.
4. **`content` de Tailwind conserva `"./index.html"`** (línea 3), aunque ese archivo ya no existe: es un glob muerto e inofensivo. `tailwind.config.js` tiene finales de línea **mixtos** (CRLF en las líneas 1–4 y 25–27; LF en el resto) y tocar esas líneas rompería `git am` (que elimina los CR del patch). Limpieza pendiente, mejor en un commit que normalice el archivo a LF.
5. **«Botones de WhatsApp de cobranza preventiva y masiva»:** en el código solo existen los botones por fila **Preventiva** y **Morosidad** (más «Abrir en WhatsApp» del modal, ya azul). No hay ningún botón de WhatsApp masivo; no se inventó uno.

## Contraste WCAG 2.1 (calculado con la fórmula, no a ojo)

| Par | Ratio | AA (≥ 4.5) |
|---|---|---|
| blanco / `#0073BB` (botón primario) | 5.04 | ✅ |
| blanco / `#8C59A4` (cabecera de tabla) | 5.15 | ✅ |
| `#2A7253` / `#E8F6F0` (badge Activo) | 5.20 | ✅ |
| `#A23429` / `#FEECEA` (badge Moroso) | 6.01 | ✅ |
| `#82650C` / `#FEF7DC` (aviso) | 5.12 | ✅ |
| blanco / `#A23429` (botón Retirar) | 6.86 | ✅ |
| blanco / `#2A7253` (botón Reactivar/Aprobar) | 5.78 | ✅ |
| `#A23429` / blanco (Deuda vencida, KPI malo) | 6.86 | ✅ |
| blanco / `#4BB387` · `#F37365` · `#F9D03D` | 2.59 · 2.82 · 1.49 | ❌ (por eso solo se usan como fondo/acento, nunca con texto blanco) |

Los tonos nuevos son algo más claros que los anteriores (`#1F6B4B`, `#B3362A`, `#7A5B00`) pero siguen sobre el umbral en todos los pares de uso.

## Verificación realizada y sus límites

| Verificación | Resultado |
|---|---|
| `node --test tests/*.test.js` | **143 pasan, 0 fallan, 57 omitidas** (integración: requieren PostgreSQL real). Base previa: 140 pasan. |
| Prueba de la raíz, con mutación | Revertida a `/admisiones` → falla; con `/admin` → pasa. |
| `tsc` estricto sobre `frontend/src/**` (todas las reglas de `tsconfig.json`) | **0 errores**; se comprobó con un error inyectado que el chequeo detecta fallos. **0 usos de `any`.** |
| Barrido de residuos MSSQL (`mssql`, `@p1`, `GETDATE`, `TOP n`, `[dbo]`, `NVARCHAR`, `ISNULL`, …) | Ninguno en código; solo tests/comentarios que afirman su ausencia. |

**Lo que NO se pudo comprobar (importante):**
- **`public/` NO se regeneró.** El registro de npm responde 403 desde el proxy de este entorno: no se pudo instalar Tailwind/Vite ni ejecutar `vite build`. Hasta recompilar, el panel servido sigue mostrando los colores y botones anteriores. **La redirección `/` → `/admin` sí es efectiva al aplicar el patch (no depende del build).**
- `vite.config.ts` no se pudo tipar aquí (necesita `vite` y `@types/node`); el cambio es mínimo y se revisó a mano. Lo cubrirá `npm run frontend:build` (`tsc --noEmit && vite build`).
- No hay prueba HTTP con Express real (no instalable aquí): la prueba nueva ejecuta el `app.js` real con un `express` simulado. Tampoco hubo revisión visual en navegador.

## Cómo aplicar

```bash
git checkout development && git pull          # debe incluir bed0cde
git am bma-colores-redireccion.patch          # o: git apply bma-colores-redireccion.patch
npm test
npm run frontend:install && npm run frontend:build   # regenera public/ (hashes nuevos)
git add public && git commit -m "build: recompila frontend con paleta BMA auditada"
```
