# CAMBIOS_BMA_FACTURACION — Endpoint del tablero financiero (BMA)

**Rama:** `development` · **Motor:** PostgreSQL / Supabase (paquete `pg`, helper `ejecutar` con `$1…$n`) · **Autor:** Astra Digital Solutions

## 1. Archivos

| Archivo | Acción | Qué cambió |
|---|---|---|
| `services/facturacion.service.js` | Modificado | `tablero(periodo)` devuelve **exactamente** el contrato pedido. SQL extraído a dos constantes (`SQL_KPI`, `SQL_COBRADO_POR_DIA`). Se eliminaron `facturado_mes_usd`, `estudiantes` y la dependencia de `crm.service` (una consulta menos por petición). Las barras diarias ahora agrupan por `(revisado_en AT TIME ZONE 'America/Caracas')::date`, con `GROUP BY 1 ORDER BY dia`. |
| `controllers/facturacion.controller.js` | Modificado | `periodoDe()` endurecido: sin `periodo` → mes en curso en Caracas; valor inválido, vacío-con-basura, repetido (`?periodo=a&periodo=b`) u objeto → `422 VALIDACION`. Documentación del contrato. |
| `routes/index.js` | **Sin cambios** | `GET /api/facturacion/tablero` ya estaba conectado tras `requireAuth` (verificado). |
| `frontend/src/types/index.ts` | Modificado | `TableroFacturacion` sin `facturado_mes_usd` ni `estudiantes`. |
| `frontend/src/admin.ts` | Modificado | El dashboard pide `/facturacion/tablero` y `/estudiantes/resumen` en paralelo (`Promise.all`); «Facturado del mes» pasa a «Cobrado del mes» (`d.cobrado.monto_usd`). |
| `tests/facturacion-tablero.test.js` | **Nuevo** | 8 pruebas: contrato exacto, ceros/`[]`, parametrización y paralelismo, límites UTC de Caracas, sobre `{ok,data}`, período por defecto, 422 por período inválido, error de PostgreSQL (57014 → 504). |
| `tests/integracion.pg.test.js` | Modificado | La prueba del tablero valida el contrato nuevo (claves exactas) y ya no espera `estudiantes`/`facturado_mes_usd`. |
| `CAMBIOS_BMA_FACTURACION.md` | **Nuevo** | Este resumen. |

## 2. Contrato `GET /api/facturacion/tablero?periodo=AAAA-MM`

```json
{
  "ok": true,
  "data": {
    "periodo": "2026-10",
    "cobrado":            { "monto_usd": 165.30, "cantidad": 4 },
    "saldos_vencidos":    { "monto_usd": 100.00, "cantidad": 2 },
    "cuentas_pendientes": { "monto_usd": 55.50,  "cantidad": 2 },
    "referencias_por_validar": 2,
    "cobrado_por_dia": [
      { "dia": "2026-10-01", "monto_usd": 100.10 },
      { "dia": "2026-10-15", "monto_usd": 60.20 }
    ]
  }
}
```

Errores (formato JSON estable del Core): `{ "ok": false, "error": { "codigo", "mensaje", "detalles?", "requestId" } }` — p. ej. `422 VALIDACION` (período), `504 BASE_DATOS_TIMEOUT`, `503 BASE_DATOS_NO_DISPONIBLE`. Nunca se expone SQL ni stack.

Semántica (sin cambios respecto a la versión previa): **cobrado** = referencias `Aprobada` con `revisado_en` dentro del mes (medianoche→medianoche de Caracas); **saldos_vencidos** = cuotas `Pendiente`/`En Revisión` ya vencidas, acumuladas de cualquier mes; **cuentas_pendientes** = cuotas del mes aún por vencer (incluye las que vencen hoy); **referencias_por_validar** = bandeja de auditoría completa.

## 3. Reglas del Core Base verificadas

- **Esquema PostgreSQL:** solo tablas/columnas de `001_core_base.sql` (`pagos_referencias`, `cuotas`); la auditoría estática `schema-consistencia` sigue en verde. Sin T-SQL (`DATETIME2`, `GETDATE`, `ISNULL`, `TOP`): una prueba lo vigila.
- **Parametrización:** datos solo como `$1…$5` / `$1…$2` (arreglos posicionales); el texto SQL no contiene fechas ni importes.
- **Paralelismo:** las dos consultas viajan con `Promise.all` (prueba mide 2 consultas en vuelo).
- **Zona horaria:** intervalos como instantes `TIMESTAMPTZ` (`aInstanteSql`) y agrupación con `AT TIME ZONE` nativo; `DATE` llega como cadena `YYYY-MM-DD` (parser 1082 de `config/db.js`).
- **Capas:** el SQL permanece en el servicio y el controlador solo valida y responde (convención del repo); no se movió lógica al controlador.

## 4. Verificación realizada

- `npm test`: **76 pasan, 0 fallan, 34 omitidas** (las omitidas son la integración, que exige `PG_TEST_PORT`). Antes: 68 / 0 / 34.
- Mutaciones sobre el servicio (consultas secuenciales, sin `AT TIME ZONE`, campo extra) → las pruebas nuevas **fallan** como deben.
- **SQL real en PostgreSQL 16** (clúster temporal, migraciones 001–003 y datos de borde): cobros a 30/sep 22:30, 1/oct 00:00, 15/oct 22:00 (= 16 en UTC), 31/oct 23:59:59 y 1/nov 00:00 hora Caracas. Resultado idéntico con `TimeZone` de sesión `UTC`, `Asia/Tokyo` y `America/Caracas`; el cobro de las 22:00 del 15/oct queda en el **día 15**.

## 5. Pendientes y advertencias

1. **Reconstruir el frontend antes de desplegar.** `public/` (build de Vite) está versionado y el bundle actual (`public/assets/admin-*.js`) aún lee `estudiantes` y `facturado_mes_usd`; con este backend el dashboard fallaría. Ejecutar `npm run frontend:install && npm run frontend:build` y commitear `public/`. En esta sesión el registro de npm no era alcanzable, por lo que **no pude reconstruir ni correr `tsc`**; los cambios TypeScript son mínimos y se revisaron a mano (`ConteoEstudiantes` ya se exportaba; `bma.get<T>(ruta)` admite consulta opcional).
2. **`npm run test:integracion`** (PostgreSQL real, `PG_TEST_PORT`) no se pudo ejecutar aquí por falta del paquete `pg`; el SQL sí se validó con `psql` (sección 4).
3. **Instrucciones del proyecto mencionan MSSQL**, pero el repositorio ya migró a PostgreSQL/Supabase (`bma-core-postgres.patch`, `config/db.js`); se trabajó contra PostgreSQL. Conviene actualizar esas instrucciones.
4. `saldos_vencidos` es acumulado y no depende del `periodo`; al consultar meses pasados solo cambian `cobrado`, `cuentas_pendientes` y `cobrado_por_dia`.
