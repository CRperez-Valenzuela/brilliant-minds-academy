-- 008_nuevos_premium.sql — Módulos premium MULTI_SEDE_PREMIUM y FACTURACION_MASIVA + límite de sedes del Core Base.
-- PostgreSQL 15+ · Supabase. Idempotente: se puede re-ejecutar sin efectos (scripts/migrate.js la corre dentro de una transacción).
--
-- 1) Catálogo: dos módulos de pago único. ON CONFLICT DO NOTHING: re-ejecutar jamás pisa un estado "habilitado", una prueba
--    en curso ni un precio negociado (misma política que 003).
-- 2) Regla comercial del Core Base: la oferta base incluye hasta DOS (2) sedes (Acarigua y Barquisimeto). La tercera sede solo
--    se puede crear si MULTI_SEDE_PREMIUM está habilitado de forma permanente o con una prueba de 15 días vigente
--    (habilitado = TRUE y expira_prueba_en NULL o futura: misma semántica que modules/premium/guard.js → estadoEfectivo).
--    El trigger es la garantía definitiva (aplica a cualquier camino: API, scripts, SQL manual); services/sedes.service.js
--    hace la misma comprobación antes para responder con detalle.
--
-- Contrato de error del trigger (lo traduce middlewares/errorHandler.js a HTTP 403 MODULO_PREMIUM_DESHABILITADO):
--   SQLSTATE  = 'BM403'                         (clase propia de la aplicación; no choca con códigos de PostgreSQL)
--   MESSAGE   = 'MODULO_PREMIUM_DESHABILITADO'
--   DETAIL    = JSON {"modulo","nombre","precio_usd","limite_sedes_base"}
--   HINT      = texto para el operador
-- Reversión: DROP TRIGGER trg_sedes_limite_base ON sedes; DROP FUNCTION fn_limitar_sedes_base();

-- ───────────────────────── 1) Módulos premium de la Fase 2 ─────────────────────────
INSERT INTO modulos_premium (codigo, nombre, descripcion, precio_usd) VALUES
  ('MULTI_SEDE_PREMIUM', 'Expansión Multi-Sede Avanzada (3+ Sedes)',
   'Habilita la creación de una tercera sede y siguientes. El Core Base incluye dos sedes (Acarigua y Barquisimeto).',     50.00),
  ('FACTURACION_MASIVA', 'Módulo de Facturación Masiva Automatizada',
   'Genera de un solo paso la mensualidad de todos los estudiantes activos (concepto, monto y vencimiento).',              20.00)
ON CONFLICT (codigo) DO NOTHING;

-- ───────────────────────── 2) Límite de sedes del Core Base ─────────────────────────
CREATE OR REPLACE FUNCTION fn_limitar_sedes_base() RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp   -- Supabase advisor: función sin search_path fijo es vulnerable a secuestro de esquema
AS $$
DECLARE
  c_limite_base CONSTANT INTEGER := 2;
  c_modulo      CONSTANT TEXT    := 'MULTI_SEDE_PREMIUM';
  v_total       INTEGER;
  v_nombre      TEXT;
  v_precio      NUMERIC(10,2);
BEGIN
  -- Serializa las altas de sedes: dos inserciones simultáneas no pueden ver "1 sede" a la vez y colarse como la 2ª y la 3ª.
  -- El candado de transacción se libera solo al terminar (seguro detrás del pooler de Supabase en modo transacción).
  -- (726150001 lo usa scripts/migrate.js; este es otro número a propósito.)
  PERFORM pg_advisory_xact_lock(726150008);

  -- Un nombre repetido no crea una sede nueva: lo resuelve la restricción UNIQUE (23505 / ON CONFLICT DO NOTHING → 409 SEDE_DUPLICADA)
  -- y no debe disfrazarse de "módulo deshabilitado".
  IF EXISTS (SELECT 1 FROM sedes AS s WHERE s.nombre = NEW.nombre) THEN
    RETURN NEW;
  END IF;

  -- Cuenta TODAS las sedes (activas e inactivas): la oferta base limita la existencia de sedes, no solo las abiertas.
  -- Función VOLATILE: en un INSERT multi-fila cada fila ya ve las anteriores de la misma sentencia.
  SELECT COUNT(*)::INTEGER INTO v_total FROM sedes;
  IF v_total < c_limite_base THEN
    RETURN NEW;
  END IF;

  -- Tercera sede o posterior: exige el módulo habilitado (contratado, o prueba vigente según el reloj de la base).
  IF EXISTS (
    SELECT 1 FROM modulos_premium AS m
     WHERE m.codigo = c_modulo
       AND m.habilitado = TRUE
       AND (m.expira_prueba_en IS NULL OR m.expira_prueba_en > NOW())
  ) THEN
    RETURN NEW;
  END IF;

  SELECT m.nombre, m.precio_usd INTO v_nombre, v_precio FROM modulos_premium AS m WHERE m.codigo = c_modulo;

  RAISE EXCEPTION 'MODULO_PREMIUM_DESHABILITADO'
    USING ERRCODE = 'BM403',
          DETAIL  = json_build_object(
                      'modulo', c_modulo,
                      'nombre', COALESCE(v_nombre, c_modulo),
                      'precio_usd', COALESCE(v_precio, 50.00),
                      'limite_sedes_base', c_limite_base)::TEXT,
          HINT    = 'El Core Base admite 2 sedes. Activa MULTI_SEDE_PREMIUM (o su prueba de 15 días) para crear la tercera.';
END
$$;

-- Solo la ejecuta el motor como trigger: se cierra a PUBLIC (anon/authenticated no deben poder invocarla por la API REST).
REVOKE ALL ON FUNCTION fn_limitar_sedes_base() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_sedes_limite_base ON sedes;
CREATE TRIGGER trg_sedes_limite_base BEFORE INSERT ON sedes
  FOR EACH ROW EXECUTE FUNCTION fn_limitar_sedes_base();
