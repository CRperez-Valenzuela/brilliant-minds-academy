# CAMBIOS_BMA_SEGURIDAD_WHATSAPP — Blindaje de admisiones y resiliencia del cron de WhatsApp

**Proyecto:** Brilliant Minds Academy · Core Base · **Rama base:** `development` (commit `22bf84d`, verificado contra el remoto antes de empezar) · **Agente:** Arquitecto Principal / Auditor de Seguridad, Astra Digital Solutions · **Motor:** PostgreSQL / Supabase (parámetros posicionales `$1, $2, $3`)

Cierra los hallazgos **H1–H4** de la auditoría. Sin residuos de T-SQL: la consulta de seguridad y las dos masivas del cron siguen siendo PostgreSQL nativo con `$n` y casts explícitos; los errores viajan por el contrato JSON de `AppError`.

| Hallazgo | Problema | Solución |
|---|---|---|
| **H2** Suplantación en admisiones | El formulario público (anónimo) reescribía nombre, correo y **teléfono** de un representante existente con solo conocer su cédula; ese teléfono recibe los enlaces privados del portal. | `ON CONFLICT` ya no toca `telefono`. El correo guardado manda (`COALESCE(representantes.email, EXCLUDED.email)`). Un teléfono distinto se retiene en `telefono_pendiente` (+ `telefono_pendiente_en`) hasta aprobación humana. |
| **H1** Un padre sin WhatsApp aborta el ciclo | Todo fallo de Meta sumaba a `fallosSeguidos`; 5 números no entregables cortaban el envío a todos. | `whatsapp.service` clasifica el error de Meta (`DESTINATARIO` / `SISTEMICA` / `DESCONOCIDA`). Del destinatario: queda `FALLIDA` y el ciclo sigue. Sistémico: aborta ya. Desconocido: cuenta como antes. Enfriamiento: no se reintenta con ≥ 3 `FALLIDA` del mismo tipo en 7 días. |
| **H3** Lease perdido sin detectar | `renovarLease` ignoraba el resultado: un proceso congelado seguía enviando junto a la instancia que tomó el control. | Devuelve `rowCount > 0`. Si es `false` el ciclo se aborta **antes** de enviar (`LEASE_PERDIDO`). Un error transitorio al renovar no se confunde con pérdida. |
| **H4** Ventana de duplicados | Una fila `GENERADA` huérfana (caída entre Meta y el `UPDATE` a `ENVIADA`) no bloqueaba, y al día siguiente se reenviaba. | El de-duplicador trata `GENERADA` con `creado_por IS NULL` (creada por el bot) como «en vuelo». Las `GENERADA` del panel (borradores manuales) **no** bloquean. |

## Verificación realizada (y sus límites)

| Verificación | Resultado |
|---|---|
| `node --test tests/*.test.js` | 186 pruebas: **131 pasan, 0 fallan**, 55 omitidas (integración sin `PG_TEST_PORT`). Coincide con la corrida local del usuario. |
| `PG_TEST_PORT=… node --test tests/integracion.pg.test.js` contra **PostgreSQL 16.15 real** | **55/55** (línea base de `22bf84d` sin estos cambios: 52/52). Incluye el SQL real de de-duplicación y enfriamiento, el upsert, el `rowCount` del lease y las pruebas `008` de multi-sede del commit base. |
| Verificación inversa (¿las pruebas detectan el bug?) | Con el código de producción **revertido** a `development` y las pruebas nuevas puestas: fallan 9 unitarias (8 pruebas + el archivo de clasificación, que ni siquiera carga) y 4 de integración. Con el código nuevo pasan. |
| Idempotencia de `009` | Aplicada dos veces sobre una base real: la 2.ª solo emite `NOTICE … skipping`. |
| Auditoría del diff | 0 residuos T-SQL, 0 interpolaciones `${}` en SQL, 0 marcadores no posicionales. |

**Límites.** No se probó contra un proyecto Supabase real (pooler en modo transacción) ni contra la API real de Meta: la integración corre en PostgreSQL 16 estándar con los roles `anon`/`authenticated` simulados, y los errores de Meta se reproducen con el servicio real y `http` simulado. Los códigos se contrastaron con la tabla oficial de errores de la Cloud API de WhatsApp; **131030 no figura en ella** y por eso queda sin clasificar. Un clúster local en `SQL_ASCII`/`C` hace fallar el test de CRM (`ILIKE` con acentos) por el *locale*, ajeno a este cambio; con `UTF8` pasa.

## 1. H2 · `services/admisiones.service.js` + migración `009`

- Se numera `009` porque `22bf84d` ya trae `008_nuevos_premium.sql`.
- `representantes.telefono_pendiente VARCHAR(20)` (misma `CHECK` que `telefono`: sin espacios, 10–15) y `telefono_pendiente_en TIMESTAMPTZ`. Una columna por `ALTER … IF NOT EXISTS`.
- Mismo teléfono → no se genera pendiente y **no se borra** uno previo. Teléfono distinto → queda el más reciente; la verificación humana es el control.
- La inscripción del alumno **prosigue** (cuota, referencia, expediente); solo el contacto del representante queda intacto. Los recordatorios siguen yendo al teléfono verificado.
- Aviso en el log del servidor **solo tras el COMMIT**, con ids y sin teléfonos. La respuesta pública no dice nada: revelar «tu cédula ya existía» permitiría enumerar cédulas.

## 2. H1 · `services/whatsapp.service.js` y `cron/whatsappCron.js`

- El `codigo` público sigue siendo `WHATSAPP_ENVIO_FALLIDO` (502): el envío manual y el frontend no cambian. Ahora `detalles = { motivo, meta_codigo, http_status, clase }`.
- **Del destinatario:** 131021, 131026, 131047, 131049, 131050, 131056. **Sistémicos:** 0, 4, 10, 190, 200–299, 368, 80007, 130429, 131005, 131031, 131037, 131042, 131045, 131048, 132000, 132001, 132005, 132007, 132015, 132016, 133010. Todo lo demás (100, 131009, 131000, red, timeouts…) queda `DESCONOCIDA` y cuenta para el cortafuegos igual que antes. Editable en dos `Set` al inicio del servicio.
- Un `code` nulo o vacío **no** se toma por el `0` (token inválido): conversión estricta.
- Abortos nuevos en el resumen: `META_SISTEMICA_190`, `META_SISTEMICA_132001`, `META_SISTEMICA_HTTP_401`, `LEASE_PERDIDO`.
- Enfriamiento: constante `ENFRIAMIENTO = { dias: 7, maxFallidas: 3 }`, exportada y aceptada como parámetro `enfriamiento` por `candidatosPreventiva` / `candidatosMorosidad` (hoy el ciclo usa el valor por defecto; moverlo a variables de entorno es trivial si lo prefieres).

## Decisiones de diseño a confirmar

1. **`131047` será la norma, no la excepción.** `enviarTexto` manda `type: 'text'`, que Meta solo entrega dentro de las 24 h posteriores al último mensaje del padre. Un recordatorio iniciado por la academia necesita una **plantilla aprobada**. Ahora esos fallos ya no abortan el ciclo, pero seguirán llegando como `FALLIDA`. Es el cambio funcional pendiente más importante (y entonces 132001 pasa a ser relevante).
2. **`nombres`/`apellidos` aún se sobrescriben** desde el formulario público. Quedó fuera de lo pedido (solo contacto). Es el mismo tipo de vector: el mensaje se dirige a «Estimado/a <nombre>». Recomendado cerrarlo igual.
3. **No hay pantalla para aprobar `telefono_pendiente`.** Hasta que exista, se resuelve por SQL (abajo). El siguiente paso natural es un endpoint de administración + bandeja.
4. **Efecto lateral del enfriamiento.** Una falla sistémica deja una fila `FALLIDA` en el primer estudiante antes de abortar; con el token vencido varios días, ese estudiante acumula 3 y queda en enfriamiento aunque no fuera su culpa. Mejora sugerida: persistir `meta_codigo` en `notificaciones_whatsapp` y contar solo la clase `DESTINATARIO`.
5. **Trade-off de H4, pedido expresamente.** Una `GENERADA` huérfana por una caída *antes* de llamar a Meta también bloquea (preventiva: esa cuota; morosidad: durante la ventana de N días). Se prefiere no enviar a duplicar. Recuperación abajo.
6. Las fallas del destinatario son **neutrales** para el cortafuegos: ni suman ni reinician la cuenta.

## SQL de operación

```sql
-- H2: teléfonos por aprobar
SELECT id, cedula, telefono, telefono_pendiente, telefono_pendiente_en
  FROM representantes WHERE telefono_pendiente IS NOT NULL ORDER BY telefono_pendiente_en;
-- Aprobar / descartar (parámetro $1 = id del representante)
UPDATE representantes SET telefono = telefono_pendiente, telefono_pendiente = NULL, telefono_pendiente_en = NULL WHERE id = $1 AND telefono_pendiente IS NOT NULL;
UPDATE representantes SET telefono_pendiente = NULL, telefono_pendiente_en = NULL WHERE id = $1;

-- H4: GENERADA del bot sin resolver. Si el mensaje sí salió → 'ENVIADA'; si no → 'FALLIDA' (cuenta 1 para el enfriamiento)
SELECT id, estudiante_id, tipo, creado_en FROM notificaciones_whatsapp WHERE estado = 'GENERADA' AND creado_por IS NULL ORDER BY creado_en;
UPDATE notificaciones_whatsapp SET estado = 'ENVIADA' WHERE id = $1;
UPDATE notificaciones_whatsapp SET estado = 'FALLIDA', error = 'Revisado manualmente: no se envió' WHERE id = $1;
```

## Archivos creados

- `database/migrations/009_representantes_telefono_pendiente.sql` — columnas de teléfono pendiente (idempotente).
- `tests/whatsapp-clasificacion.test.js` — tabla de códigos, guarda contra el `0`, forma de `detalles`, contrato con Meta.
- `CAMBIOS_BMA_SEGURIDAD_WHATSAPP.md` — este resumen.

## Archivos modificados

- `services/admisiones.service.js` — upsert blindado y aviso post-COMMIT.
- `services/whatsapp.service.js` — `clasificarErrorMeta`, `CLASE_FALLA`, `detalles` estructurado.
- `cron/whatsappCron.js` — clasificación de fallas, enfriamiento, `GENERADA` en vuelo, `renovarLease` con `rowCount`.
- `tests/whatsapp-cron.test.js` — dobles con lease; errores producidos por el servicio real; 7 pruebas nuevas.
- `tests/admisiones.test.js` — 3 pruebas nuevas de H2.
- `tests/integracion.pg.test.js` — el total de migraciones pasa a calcularse desde el directorio (`NUM_MIGRACIONES`) en vez de un número cableado; el test de la 2.ª inscripción pasa a exigir lo contrario (**el viejo exigía que el teléfono se sobrescribiera, es decir, codificaba el bug**); 3 pruebas nuevas contra PostgreSQL real.

## Cómo aplicar

```bash
git checkout development   # debe estar en 22bf84d
git apply --check bma-seguridad-whatsapp.patch && git apply bma-seguridad-whatsapp.patch
npm run migrate                                   # aplica 009 (una sola vez, dentro de una transacción)
npm test                                          # unitarias
PG_TEST_PORT=5432 npm run test:integracion        # contra un PostgreSQL desechable (NO la base de producción)
```
