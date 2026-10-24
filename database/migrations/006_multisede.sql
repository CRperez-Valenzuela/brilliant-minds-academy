-- 006_multisede.sql — Infraestructura multi-sede (PostgreSQL 15+ · Supabase). Idempotente: se puede re-ejecutar sin efectos.
-- Modelo de alcance:
--   · sede_id NULL en un USUARIO  → acceso consolidado/global (SuperAdmin). sede_id con valor → solo esa sede (secretaria/recepción).
--   · sede_id NULL en un DATO     → dato "global" (sin sede asignada): solo lo ve el acceso consolidado.
-- Los esquemas viven en `public` (Supabase); no existe el esquema `dbo` de MSSQL.

CREATE TABLE IF NOT EXISTS sedes (
  id        SERIAL       NOT NULL CONSTRAINT pk_sedes PRIMARY KEY,
  nombre    VARCHAR(120) NOT NULL CONSTRAINT uq_sedes_nombre UNIQUE,
  activa    BOOLEAN      NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- sede_id NULLABLE en las tablas que se segmentan por sede. ADD COLUMN IF NOT EXISTS omite la cláusula completa (incluida la FK)
-- si la columna ya existe, de modo que re-ejecutar no duplica restricciones.
ALTER TABLE usuarios_admin     ADD COLUMN IF NOT EXISTS sede_id INTEGER NULL CONSTRAINT fk_usuarios_admin_sede     REFERENCES sedes(id);
ALTER TABLE estudiantes        ADD COLUMN IF NOT EXISTS sede_id INTEGER NULL CONSTRAINT fk_estudiantes_sede        REFERENCES sedes(id);
ALTER TABLE cuotas             ADD COLUMN IF NOT EXISTS sede_id INTEGER NULL CONSTRAINT fk_cuotas_sede             REFERENCES sedes(id);
ALTER TABLE egresos            ADD COLUMN IF NOT EXISTS sede_id INTEGER NULL CONSTRAINT fk_egresos_sede            REFERENCES sedes(id);
ALTER TABLE pagos_referencias  ADD COLUMN IF NOT EXISTS sede_id INTEGER NULL CONSTRAINT fk_pagos_referencias_sede  REFERENCES sedes(id);
-- Cuentas de cobro por sede (el portal de invitación muestra las de SU sede). NULL = cuenta común a todas las sedes.
ALTER TABLE cuentas_pago       ADD COLUMN IF NOT EXISTS sede_id INTEGER NULL CONSTRAINT fk_cuentas_pago_sede       REFERENCES sedes(id);

CREATE INDEX IF NOT EXISTS ix_usuarios_admin_sede    ON usuarios_admin (sede_id);
CREATE INDEX IF NOT EXISTS ix_estudiantes_sede       ON estudiantes (sede_id, estatus_academico);
CREATE INDEX IF NOT EXISTS ix_cuotas_sede_estado     ON cuotas (sede_id, estado, fecha_vencimiento);
CREATE INDEX IF NOT EXISTS ix_egresos_sede_fecha     ON egresos (sede_id, fecha);
CREATE INDEX IF NOT EXISTS ix_pagos_sede_bandeja     ON pagos_referencias (sede_id, estado, declarado_en);
CREATE INDEX IF NOT EXISTS ix_cuentas_pago_sede      ON cuentas_pago (sede_id);

-- ───────────────────────── Herencia automática de sede ─────────────────────────
-- Cuotas y pagos pertenecen a la sede de su estudiante. Un trigger BEFORE INSERT lo garantiza aunque algún camino de código
-- olvide enviar sede_id (el filtro por sede nunca depende de la memoria del programador).
CREATE OR REPLACE FUNCTION fn_heredar_sede_estudiante() RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp   -- Supabase advisor: función sin search_path fijo es vulnerable a secuestro de esquema
AS $$
BEGIN
  IF NEW.sede_id IS NULL AND NEW.estudiante_id IS NOT NULL THEN
    SELECT e.sede_id INTO NEW.sede_id FROM estudiantes AS e WHERE e.id = NEW.estudiante_id;
  END IF;
  RETURN NEW;
END
$$;

-- La función solo la ejecuta el motor como trigger: se cierra a PUBLIC (anon/authenticated no deben poder invocarla por la API REST).
REVOKE ALL ON FUNCTION fn_heredar_sede_estudiante() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_cuotas_heredar_sede ON cuotas;
CREATE TRIGGER trg_cuotas_heredar_sede BEFORE INSERT ON cuotas
  FOR EACH ROW EXECUTE FUNCTION fn_heredar_sede_estudiante();

DROP TRIGGER IF EXISTS trg_pagos_heredar_sede ON pagos_referencias;
CREATE TRIGGER trg_pagos_heredar_sede BEFORE INSERT ON pagos_referencias
  FOR EACH ROW EXECUTE FUNCTION fn_heredar_sede_estudiante();

-- Relleno de lo ya existente (idempotente: solo toca filas aún sin sede cuyo estudiante sí la tiene).
UPDATE cuotas AS c SET sede_id = e.sede_id
  FROM estudiantes AS e
 WHERE c.estudiante_id = e.id AND c.sede_id IS NULL AND e.sede_id IS NOT NULL;
UPDATE pagos_referencias AS p SET sede_id = e.sede_id
  FROM estudiantes AS e
 WHERE p.estudiante_id = e.id AND p.sede_id IS NULL AND e.sede_id IS NOT NULL;

-- ───────────────────────── Vista con sede ─────────────────────────
-- Misma definición de 002 + sede_id AL FINAL (CREATE OR REPLACE VIEW solo admite columnas nuevas al final).
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
  m.proximo_vencimiento,
  e.sede_id                                           AS sede_id
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

-- ───────────────────────── Seguridad Supabase (misma política que 004) ─────────────────────────
-- 004 ya está aplicada en producción y no se vuelve a ejecutar: la tabla nueva cierra su propio acceso aquí.
DO $$
DECLARE
  rol TEXT;
  secuencia TEXT;
BEGIN
  ALTER TABLE sedes ENABLE ROW LEVEL SECURITY;
  FOREACH rol IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = rol) THEN
      EXECUTE format('REVOKE ALL ON TABLE sedes FROM %I', rol);
      secuencia := pg_get_serial_sequence('public.sedes', 'id');
      IF secuencia IS NOT NULL THEN
        EXECUTE format('REVOKE ALL ON SEQUENCE %s FROM %I', secuencia, rol);
      END IF;
      EXECUTE format('REVOKE ALL ON TABLE vw_estudiantes_estado FROM %I', rol);
    END IF;
  END LOOP;
END
$$;
