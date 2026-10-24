# CAMBIOS_BMA_FINTECH_PRUEBA_CRON — Planilla fintech, prueba Premium de 15 días y cron de WhatsApp

**Proyecto:** Brilliant Minds Academy · Core Base (US$750) · **Rama de trabajo:** `feat/fintech-trial-cron` (sobre `development`) · **Agente:** Arquitecto Principal, Astra Digital Solutions · **Motor:** PostgreSQL / Supabase (pooler `pg`, parámetros posicionales `$1, $2, $3`)

Tres entregas: (1) planilla pública de admisiones con cuentas de pago dinámicas, conversión exacta a Bs. y referencia bancaria validada; (2) prueba gratuita de 15 días para módulos Premium con bloqueo automático; (3) bot diario de WhatsApp (`WHATSAPP_AUTOMATICO`) con cola secuencial anti-baneo.

## Sistema de diseño (uiux-pro-max)

| Aspecto | Decisión |
|---|---|
| Estilo | Minimal / fintech limpio, tarjetas con borde fino y sombra suave; vidrio (glass) solo con `bg-white/90` o más (mínimo exigido `/80`). |
| Paleta | Texto `slate-900` `#0F172A` sobre `white`; secundario `slate-600` `#475569`; acento `indigo-600` `#4F46E5` (hover `indigo-700` `#4338CA`); éxito `emerald-700` `#047857`; error `red-700` `#B91C1C`. Contraste ≥ 4.5:1. |
| Tipografía | Inter (UI); cifras con `tabular-nums` para montos y tasas. |
| Espaciado | Escala 4/8 px: `1·2·3·4·6·8·12` (regla impuesta en `lib/ui.ts`). |
| Iconos | SVG propios (`lib/icons.ts`, se añadió `copy`); sin emojis. |
| Interacción | `cursor-pointer`, `transition-colors duration-200`, `active:scale-[.98]`, foco visible, `aria-pressed`, `aria-live`, objetivos táctiles ≥ 40 px, layout de 1 columna desde 320 px. |

## Verificación realizada (y sus límites)

| Verificación | Resultado |
|---|---|
| `node --test tests/*.test.js` | 138 pruebas: **99 pasan, 0 fallan**, 39 omitidas (integración sin `PG_TEST_PORT`) |
| `PG_TEST_PORT=54329 node --test tests/integracion.pg.test.js` contra **PostgreSQL 16 real** | **39/39** (migraciones 001–005 idempotentes, activación concurrente, expiración y reactivación del guard, ciclo completo del cron con filas ENVIADA/FALLIDA, lease) |
| `tsc` estricto sobre `frontend/src` | 0 errores |
| Prueba en **Chromium real** (Playwright) del JS compilado de `admisiones` contra API simulada | 11/11 (ver abajo) |
| Auditoría estática de los archivos nuevos/modificados | 0 residuos MSSQL (`GETDATE`, `TOP`, `ISNULL`, `@param`, `OUTPUT INSERTED`, `sp_getapplock`, `DATEADD`…); 0 placeholders `?`; 0 interpolación de variables dentro de SQL; todo con `$1, $2, $3` |

Casos de navegador: orden Pago Móvil / Zelle / Binance Pay / PayPal; Bs. con tasa BCV solo en Pago Móvil y US$ en las divisas; costo USD + Bs. + tasa + hora; XSS en el titular de una cuenta (se ve como texto); método preseleccionado y sincronía tarjeta ↔ `<select>` con foco conservado; botón copiar; refresco de tasa sin perder foco; referencia (espacios eliminados, caracteres inválidos y longitud mínima en vivo); envío vacío bloqueado; envío multipart completo con 3 archivos.

**Lo que NO se pudo comprobar en este entorno** (registro npm bloqueado):
- `vite build` / Tailwind **no se ejecutaron**: `public/` conserva los assets anteriores. Hay que correr `npm run frontend:build` y revisar el aspecto visual. Las pruebas de navegador verificaron comportamiento sin hoja de estilos.
- Express y `jsonwebtoken` no están instalados aquí: la ruta nueva se probó con un doble de Express (registro de rutas y middlewares), no levantando el servidor.
- Meta/WhatsApp real: el cron se probó con el cliente de WhatsApp inyectado (stub), no contra la API de Meta.

## 1. Planilla pública de admisiones (`frontend/src/admisiones.ts`)

- Secciones numeradas: alumno (personales + médicos), representante, transaccional.
- Bloque `#cuentas-pago` (con `aria-live`) **antes** de los campos de pago; se pinta desde `GET /api/public/admisiones/config`, una tarjeta por método autorizado: Pago Móvil, Zelle, Binance Pay, PayPal. Pago Móvil muestra el monto en **Bs.** (matrícula USD × tasa BCV) y el resto en **US$**. Datos de cuenta siempre escapados (la etiqueta `html` escapa cada interpolación).
- «Pagaré con este método» selecciona el método; «Copiar datos» usa `navigator.clipboard` con respaldo `execCommand`.
- Refresco de tasa cada 30 s y antes de enviar; redibuja solo si cambió algo y restaura el foco.
- **Número de Referencia Bancaria** obligatorio: se eliminan espacios al escribir/pegar y se valida el patrón en vivo (misma regla del backend `^[A-Za-z0-9-]{4,40}$`).

## 2. Prueba Premium de 15 días

Modelo de estado en `modulos_premium`:

| `habilitado` | `expira_prueba_en` | Significado |
|---|---|---|
| FALSE | — | Bloqueado |
| TRUE | NULL | Contratado (permanente) |
| TRUE | futuro | En prueba |
| TRUE | pasado | Vencida → el guard fija `habilitado=FALSE`, `expira_prueba_en=NULL` y responde 403 |

- `POST /api/premium/activar-prueba` (solo `admin`, body `{modulo}`): un único `UPDATE ... WHERE habilitado=FALSE AND prueba_iniciada_en IS NULL RETURNING` con `expira_prueba_en = NOW() + ($2::int * INTERVAL '1 day')`, params `[codigo, 15]`. Atómico: con dos activaciones simultáneas gana exactamente una. Errores: 404 módulo inexistente, 409 `MODULO_YA_HABILITADO`, 409 `PRUEBA_YA_UTILIZADA`.
- `modules/premium/guard.js` reescrito: permite permanente **o** prueba en vigencia (se evalúa en cada petición aunque la caché de 15 s esté caliente); al vencer bloquea en BD (fail-closed si el UPDATE falla) y responde `403 MODULO_PREMIUM_DESHABILITADO` con `detalles.motivo = 'PRUEBA_EXPIRADA'`.
- `GET /premium/modulos` devuelve estado efectivo más `en_prueba`, `expira_prueba_en`, `dias_restantes_prueba`, `prueba_utilizada`.

## 3. Cron `cron/whatsappCron.js` (módulo `WHATSAPP_AUTOMATICO`)

- Se ejecuta a diario a `WHATSAPP_CRON_HORA` (08:00 Caracas, UTC-4) dentro del proceso (`server.js`) o suelto: `npm run cron:whatsapp` (un ciclo; código de salida 2 si abortó) / `npm run cron:whatsapp:daemon`.
- Solo corre si el módulo está habilitado (compra o prueba vigente) y WhatsApp está configurado.
- Selección masiva en SQL: **Preventiva** = próxima cuota Pendiente de estudiantes Activos que vence entre 3 y 5 días; **Morosidad** = estudiantes Moroso con cuotas Pendientes vencidas **sin pagos en revisión**.
- Envío **secuencial** por `services/notificaciones.service.js` (`generarAlerta({enviar:true})`) con pausa de **1500 ms** tras cada llamada real a Meta; cada intento queda en el historial como `ENVIADA` o `FALLIDA`.
- Compatible con el pooler de Supabase: sin locks de sesión; exclusión mutua por *lease* en la tabla `parametros` (clave `WHATSAPP_CRON_LEASE`, renovado cada 25 envíos, liberado en `finally`).
- Cortafuegos: aborta ante tasa BCV desactualizada/no disponible, WhatsApp no configurado, 5 fallos seguidos o 400 envíos en el ciclo.

## Decisiones de diseño a confirmar

1. **Una prueba por módulo** (`prueba_iniciada_en` marca la prueba consumida).
2. Preventiva: una vez por cuota. Morosidad: se repite cada 7 días (`WHATSAPP_CRON_MOROSIDAD_CADA_DIAS`).
3. Máximo 400 envíos por ciclo; el cron arranca solo en producción por defecto (`WHATSAPP_CRON_ACTIVO` para forzar).
4. El representante con varios hijos recibe un mensaje por estudiante.
5. Fallos previos al insert (BCV/BD) abortan o se omiten, no generan fila `FALLIDA`.
6. `GET /premium/modulos` hace un UPDATE de mantenimiento (bloquea pruebas vencidas).
7. Patrón de referencia: se mantiene el del backend (permite guiones) por coherencia; si se desea estrictamente alfanumérico, cambiar en ambos lados.
8. La tasa BCV de `/config` proviene de la caché del servidor (≤ 5 min); el front la refresca cada 30 s y antes de enviar.

## Archivos creados

| Archivo | Contenido |
|---|---|
| `database/migrations/005_premium_prueba.sql` | `ALTER TABLE modulos_premium ADD COLUMN IF NOT EXISTS prueba_iniciada_en, expira_prueba_en` (TIMESTAMPTZ NULL); documenta el modelo de estados. Idempotente. |
| `modules/premium/prueba.service.js` | `activarPrueba({codigo})`, `DIAS_PRUEBA = 15`. |
| `cron/whatsappCron.js` | Bot diario (selección, lease, envío secuencial, scheduler, CLI). |
| `tests/premium-prueba.test.js` | 9 pruebas (estado efectivo, guard, servicio, ruta). |
| `tests/whatsapp-cron.test.js` | 14 pruebas (ventanas, dedupe, pausas 1500 ms, aborts, lease, scheduler). |
| `CAMBIOS_BMA_FINTECH_PRUEBA_CRON.md` | Este resumen. |

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `modules/premium/guard.js` | Reescrito: prueba/permanente, vencimiento por petición, auto-bloqueo, exports `crearGuard`, `estadoEfectivo`, `guard`. |
| `modules/premium/premium.routes.js` | `POST /activar-prueba` (admin); `GET /modulos` con estado efectivo y campos de prueba. |
| `config/env.js` | Bloque `whatsappCron` (activo, hora, delayMs, maxEnviosPorCiclo, morosidadCadaDias, maxFallosSeguidos, arrendamientoMin). |
| `server.js` | Arranque del cron tras `listen` y `detener()` en el apagado ordenado antes de cerrar el pool. |
| `package.json` | Scripts `cron:whatsapp`, `cron:whatsapp:daemon`. |
| `.env.example` | Variables `WHATSAPP_CRON_*`. |
| `frontend/src/admisiones.ts` | Cuentas dinámicas, conversión Bs./US$, referencia validada, copiar, selección de método. |
| `frontend/src/lib/format.ts` | Etiqueta `BINANCE: 'Binance Pay'`. |
| `frontend/src/lib/icons.ts` | Icono `copy`. |
| `tests/schema-consistencia.test.js` | Soporta `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`; incluye `cron/` en las fuentes auditadas. |
| `tests/integracion.pg.test.js` | 4→5 migraciones; 5 pruebas nuevas contra PostgreSQL real. |

## Cómo aplicar

```bash
git checkout development
git am bma-fintech-prueba-cron.patch          # o: git apply --index bma-fintech-prueba-cron.patch
npm run migrate                               # aplica 005_premium_prueba.sql (idempotente)
npm run frontend:build                        # regenera public/ (pendiente en este entorno)
npm test
```
