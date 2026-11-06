# CAMBIOS BMA · Marca unificada y logotipo metálico de Astra

Rama `development`, base `e28fa45` (incluye el asset `frontend/src/assets/astra-logo.png`, 631×624, RGBA).
Parche: `bma-marca-unificada-astra.patch`.

## Archivos modificados

| Archivo | Cambio |
| --- | --- |
| `frontend/src/lib/firma.ts` | Sustituye el marcador «A» cian (SVG inline, `#22D3EE`) por el isotipo metálico `astra-logo.png`. `firmaLogin()` y `firmaSidebar()` lo renderizan sobre pastilla `slate-900` (contraste). En el sidebar contraído la pastilla pasa de 32 a 40 px. Nuevos exports: `cabeceraDualHtml()` (logo BMA a la izquierda, isotipo Astra a la derecha), `firmaPublica()` («Desarrollado por Astra Digital Solutions») y las constantes `NOMBRE_ASTRA` y `TEXTO_AUTORIA_PUBLICA`. Se elimina `CYAN_TECNOLOGICO`. |
| `frontend/src/types/assets.d.ts` | Declara `*.png` para que `import astraLogo from '…png'` compile en modo estricto. |
| `frontend/src/admisiones.ts` | Cabecera con `cabeceraDualHtml()` (reemplaza el icono de escuela). Los 5 encabezados de sección (Estudiante, Representantes, Autorizados, Documentos, Pago) usan una banda uniforme `bg-bma-purpura` con texto blanco (5.15:1, AA) y número de paso en círculo blanco. Pie con `firmaPublica()`. |
| `frontend/src/portal.ts` | Misma cabecera dual y mismo pie. «Moroso» pasa de tono `warn` a `bad` (`bg-bma-coral-suave` + `text-bma-coral-oscuro`, 6.01:1). La tarjeta «Total pendiente» adopta ese mismo par cuando hay cuotas vencidas. |
| `tests/frontend-identidad.test.js` | Actualiza la aserción del cian (ya no existe) y añade un test de la marca unificada. |

## Archivos creados

- `CAMBIOS_BMA_MARCA_UNIFICADA_ASTRA.md` (este resumen)
- `bma-marca-unificada-astra.patch`

## Verificación realizada

- `tsc --noEmit` estricto sobre `frontend/src/**`: sin errores y sin `any` nuevos. Solo falla `vite.config.ts` por falta de `vite` y `@types/node` en el entorno de trabajo; el error es idéntico sin mis cambios.
- `node --test tests/frontend-identidad.test.js`: 6/6 correctos.
- Base de datos: no se tocó SQL, migraciones ni backend. Los parámetros posicionales `$1…`, el manejo de excepciones JSON y el Core Base no se ven afectados, y no se introdujo código MSSQL.

## Pendiente de tu lado

1. `public/` es la salida compilada de Vite y **no se regeneró** (no hay `vite`/`tailwindcss` instalados y el entorno no permite instalarlos). Tras aplicar el parche: `npm run frontend:install && npm run frontend:build`.
2. Revisión visual en navegador: el parche se comprobó por código y tipos, no renderizado.
3. Optimización opcional: `astra-logo.png` pesa 283 KB y se muestra a 32–48 px. Una copia WebP de unos 256 px (como `bma-isotipo.webp`) reduciría la carga en móvil. Las instancias de pie ya cargan con `loading="lazy"`.
