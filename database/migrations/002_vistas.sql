-- 002_vistas.sql — Clasificación en tiempo real de estudiantes (Activo / Fuera de la Academia / Moroso).
-- "Hoy" = día calendario de Caracas (America/Caracas = UTC-4 todo el año). Una cuota Pendiente o En Revisión con
-- vencimiento anterior a hoy convierte al estudiante en Moroso hasta que un administrador apruebe la referencia.
--
-- security_invoker = true (PostgreSQL 15+, Supabase): la vista se evalúa con los permisos de quien la consulta, de modo
-- que el RLS de las tablas base se respeta y la API REST de Supabase (anon/authenticated) no puede usarla para saltárselo.

CREATE OR REPLACE VIEW vw_estudiantes_estado WITH (security_invoker = true) AS
SELECT
  e.id,
  e.representante_id,
  e.nombres,
  e.apellidos,
  e.grado_solicitado,
  e.estatus_academico,
  CASE
    WHEN e.estatus_academico = 'Fuera de la Academia'                    THEN 'Fuera de la Academia'
    WHEN e.estatus_academico = 'Pendiente por Validación Administrativa' THEN 'Pendiente por Validación Administrativa'
    WHEN COALESCE(m.cuotas_vencidas, 0) > 0                              THEN 'Moroso'
    ELSE 'Activo'
  END::VARCHAR(45) AS estado_dinamico,
  CASE
    WHEN e.estatus_academico = 'Fuera de la Academia'                    THEN 'N/A'
    WHEN e.estatus_academico = 'Pendiente por Validación Administrativa' THEN 'Pendiente de Validación'
    WHEN COALESCE(m.cuotas_vencidas, 0) > 0                              THEN 'Moroso'
    ELSE 'Al día'
  END::VARCHAR(45) AS estatus_pago,
  COALESCE(m.cuotas_vencidas, 0)::INTEGER             AS cuotas_vencidas,
  COALESCE(m.deuda_vencida_usd, 0)::NUMERIC(12,2)     AS deuda_vencida_usd,
  m.proximo_vencimiento
FROM estudiantes AS e
CROSS JOIN LATERAL (SELECT (NOW() AT TIME ZONE 'America/Caracas')::DATE AS hoy) AS h
LEFT JOIN LATERAL (
  SELECT
    COUNT(*) FILTER (WHERE c.fecha_vencimiento < h.hoy)                       AS cuotas_vencidas,
    SUM(c.monto_usd) FILTER (WHERE c.fecha_vencimiento < h.hoy)               AS deuda_vencida_usd,
    MIN(c.fecha_vencimiento)                                                  AS proximo_vencimiento
  FROM cuotas AS c
  WHERE c.estudiante_id = e.id
    AND c.estado IN ('Pendiente', 'En Revisión')
) AS m ON TRUE;
