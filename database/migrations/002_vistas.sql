-- 002_vistas.sql — Clasificación en tiempo real de estudiantes (Activo / Fuera de la Academia / Moroso).
-- "Hoy" = día calendario de Caracas (UTC-4 fijo). Una cuota Pendiente o En Revisión con vencimiento
-- anterior a hoy convierte al estudiante en Moroso hasta que un administrador apruebe la referencia.

CREATE OR ALTER VIEW dbo.vw_estudiantes_estado AS
SELECT
  e.id,
  e.representante_id,
  e.nombres,
  e.apellidos,
  e.grado_solicitado,
  e.estatus_academico,
  CASE
    WHEN e.estatus_academico = N'Fuera de la Academia'                      THEN N'Fuera de la Academia'
    WHEN e.estatus_academico = N'Pendiente por Validación Administrativa'   THEN N'Pendiente por Validación Administrativa'
    WHEN ISNULL(m.cuotas_vencidas, 0) > 0                                   THEN N'Moroso'
    ELSE N'Activo'
  END AS estado_dinamico,
  CASE
    WHEN e.estatus_academico = N'Fuera de la Academia'                      THEN N'N/A'
    WHEN e.estatus_academico = N'Pendiente por Validación Administrativa'   THEN N'Pendiente de Validación'
    WHEN ISNULL(m.cuotas_vencidas, 0) > 0                                   THEN N'Moroso'
    ELSE N'Al día'
  END AS estatus_pago,
  ISNULL(m.cuotas_vencidas, 0)       AS cuotas_vencidas,
  ISNULL(m.deuda_vencida_usd, 0)     AS deuda_vencida_usd,
  m.proximo_vencimiento
FROM dbo.estudiantes AS e
CROSS APPLY (SELECT CAST(SWITCHOFFSET(SYSDATETIMEOFFSET(), N'-04:00') AS DATE) AS hoy) AS h
OUTER APPLY (
  SELECT
    SUM(CASE WHEN c.fecha_vencimiento < h.hoy THEN 1 ELSE 0 END)              AS cuotas_vencidas,
    SUM(CASE WHEN c.fecha_vencimiento < h.hoy THEN c.monto_usd ELSE 0 END)    AS deuda_vencida_usd,
    MIN(c.fecha_vencimiento)                                                  AS proximo_vencimiento
  FROM dbo.cuotas AS c
  WHERE c.estudiante_id = e.id
    AND c.estado IN (N'Pendiente', N'En Revisión')
) AS m;
GO
