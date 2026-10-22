-- 004_seguridad_supabase.sql — Endurecimiento específico de Supabase.
-- Supabase expone el esquema `public` por la API REST (PostgREST) con las claves anon/authenticated. Este backend se conecta
-- con el rol dueño de la base (postgres) mediante `pg`, que NO está sujeto a RLS; la API REST no debe poder leer nada:
--   1) RLS activado en cada tabla del Core Base y SIN políticas → anon/authenticated no ven ni modifican filas.
--   2) REVOKE explícito a esos roles (defensa en profundidad), solo si existen (en un PostgreSQL común no existen).
-- La lista es explícita a propósito: no toca otras tablas que el mismo proyecto de Supabase pudiera tener.

DO $$
DECLARE
  t TEXT;
  tablas TEXT[] := ARRAY[
    'schema_migrations', 'usuarios_admin', 'parametros', 'cuentas_pago', 'tasas_bcv', 'representantes', 'estudiantes',
    'documentos_estudiante', 'cuotas', 'pagos_referencias', 'personal', 'horas_clase', 'nomina_pagos', 'egresos',
    'notificaciones_whatsapp', 'portal_tokens', 'modulos_premium'];
  rol TEXT;
  secuencia TEXT;
BEGIN
  FOREACH t IN ARRAY tablas LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    FOREACH rol IN ARRAY ARRAY['anon', 'authenticated'] LOOP
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = rol) THEN
        EXECUTE format('REVOKE ALL ON TABLE %I FROM %I', t, rol);
        -- pg_get_serial_sequence() falla si la columna no existe: se comprueba antes (parametros, modulos_premium… no tienen "id").
        IF EXISTS (SELECT 1 FROM information_schema.columns
                    WHERE table_schema = 'public' AND table_name = t AND column_name = 'id') THEN
          secuencia := pg_get_serial_sequence(format('public.%I', t), 'id');   -- NULL si "id" no es serial
          IF secuencia IS NOT NULL THEN
            EXECUTE format('REVOKE ALL ON SEQUENCE %s FROM %I', secuencia, rol);
          END IF;
        END IF;
      END IF;
    END LOOP;
  END LOOP;

  FOREACH rol IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = rol) THEN
      EXECUTE format('REVOKE ALL ON TABLE vw_estudiantes_estado FROM %I', rol);
    END IF;
  END LOOP;
END
$$;
