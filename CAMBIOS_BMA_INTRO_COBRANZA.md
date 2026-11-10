# CAMBIOS_BMA_INTRO_COBRANZA — Intro animada de login, planilla limpia y cobranza «regla de los 10 días»

**Proyecto:** Brilliant Minds Academy · **Base:** `development` @ `6859c06` (ancla pedida `0390b25` es ancestro) · **Agente:** Arquitecto Principal, Astra Digital Solutions
**Motor de datos:** PostgreSQL / Supabase. Consultas con parámetros posicionales (`$1…$13`) y casts `::date` / `::int` / `::text`; sin residuos de MSSQL. TypeScript estricto, **0 usos de `any`**.

## Archivos creados
| Archivo | Para qué |
|---|---|
| `frontend/src/login-animation.ts` | Intro del login: isotipo 0→100 % desde el centro (cubic-bezier), el texto del logo se abre del medio a los lados (`clip-path`/ancho) y se revela la tarjeta glass. Omitible (clic/Esc/Enter/Espacio), respeta `prefers-reduced-motion`, una vez por carga, formulario `inert` mientras dura. |
| `utils/calendario-cobranza.js` | Calendario puro de la regla de los 10 días (sin BD): ventana de pago días 1–10, preventiva a 1–2 días del mes entrante, mora desde el día 11. |
| `tests/calendario-cobranza.test.js` | 8 pruebas (meses de 28/29/30/31 días, diciembre→enero, fechas inválidas). |

## Archivos modificados
| Archivo | Cambio |
|---|---|
| `frontend/src/styles/main.css` | Bloque CSS de la intro (fases por `data-fase`, fundidos, revelado de tarjeta). |
| `frontend/src/admin.ts` | Integra la intro en el login (`<main id="login-pantalla">`, foco tras la intro). |
| `frontend/src/lib/marca.ts` | `cabeceraIsotipoHtml()`: solo el isotipo circular de BMA. |
| `frontend/src/admisiones.ts` | Cabecera de la planilla pública sin logo de Astra (solo isotipo BMA). Astra queda pequeño en el pie (`firmaPublica`, ya existente). Cabeceras de sección siguen uniformes en `bg-bma-purpura`. |
| `cron/whatsappCron.js` | Regla de los 10 días (ver abajo). |
| `services/notificaciones.service.js` | Modo `MES_ENTRANTE` solo para el bot; el envío manual (3–5 días) no cambia. |
| `tests/whatsapp-cron.test.js`, `notificaciones.test.js`, `frontend-identidad.test.js`, `multisede.test.js`, `integracion.pg.test.js` | Actualizadas al nuevo calendario (reloj inyectado) + pruebas nuevas. |

## Regla de los 10 días (cron)
- **Preventiva:** solo los 2 últimos días de cada mes real (29–30 en meses de 30 días, 30–31 en los de 31, 27–28 en febrero; 28–29 bisiesto). Candidatas: cuotas `Pendiente` con vencimiento entre el día 1 y el 10 del mes entrante; el mensaje lleva el enlace seguro con token del portal.
- **Morosidad:** solo desde el día 11; toda cuota vencida del mes sin pago aprobado ni en revisión → mensaje masivo. Días 1–10 el ciclo se omite (`FUERA_DE_CALENDARIO_COBRANZA`).
- SQL preventiva: `fecha_vencimiento >= $1::date AND BETWEEN $2::date AND $3::date`.

## Verificación realizada
| Verificación | Resultado |
|---|---|
| `node --test tests/*.test.js` | 170 pasan, 1 falla: `importar-este.test.js` (falla también en `HEAD` sin mis cambios) |
| Integración contra **PostgreSQL 16 real** | **58/58** (línea base 58/58) |
| `tsc` estricto (7.0.2) sobre `frontend/src/**` | 0 errores; 0 `any` |
| Intro en Chromium | tiempos, centrado, omitir, reduced-motion, cancelación, móvil 390×844 |

## Pendiente de tu lado
1. `public/` **no se regeneró**: `npm run frontend:install && npm run frontend:build` (los PNG pesan 420 KB / 309 KB / 283 KB; se emiten con hash).
2. «1–2 días antes»: se interpretó como los **dos últimos días reales del mes** (tu texto decía «29 o 30»; en meses de 31 días son 30 y 31). Ajustable en `DIAS_ANTES_PREVENTIVA`.
3. Las cuotas mensuales deben generarse con vencimiento el día 10 (o antes) para entrar en la ventana.
4. Una cuota «En Revisión» vencida sigue siendo «Moroso» en la vista del Core, pero no recibe mensaje.
5. La cadencia de recordatorios de mora (por defecto semanal) es configurable (`morosidadCadaDias`).
6. `public/admisiones/index.html` es salida de build; no se tocó.
