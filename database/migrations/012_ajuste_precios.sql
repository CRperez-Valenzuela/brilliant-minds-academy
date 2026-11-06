-- 012 · Precios definitivos de los módulos Premium (US$). PostgreSQL / Supabase. Idempotente: re-ejecutarla no cambia nada.
-- Códigos reales del catálogo: ATENCION_IA → IA_ATENCION e INTEGRACION_BANCARIA → BANCAMIGA (no se renombran: están enlazados a rutas,
-- guards y a la interfaz). Solo cambia el precio; el estado (habilitado, prueba) de cada módulo no se toca.
UPDATE modulos_premium AS m
   SET precio_usd = v.precio_usd, actualizado_en = NOW()
  FROM (VALUES
          ('FACHADA_WEB',         450.00::numeric),
          ('APP_MOVIL',           350.00::numeric),
          ('BANCAMIGA',           250.00::numeric),
          ('WHATSAPP_AUTOMATICO',  50.00::numeric),
          ('IA_ATENCION',         150.00::numeric)
       ) AS v (codigo, precio_usd)
 WHERE m.codigo = v.codigo
   AND m.precio_usd IS DISTINCT FROM v.precio_usd;
