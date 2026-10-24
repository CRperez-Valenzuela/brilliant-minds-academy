-- 005_premium_prueba.sql — Prueba Premium de 15 días (sistema de candados).
-- Idempotente (ADD COLUMN IF NOT EXISTS); corre dentro de la transacción de scripts/migrate.js.
--
-- Estado efectivo de un módulo (lo evalúa modules/premium/guard.js):
--   habilitado = FALSE                                        → bloqueado
--   habilitado = TRUE  y expira_prueba_en IS NULL              → habilitado de forma PERMANENTE (contratado)
--   habilitado = TRUE  y expira_prueba_en >  NOW()             → en PRUEBA vigente
--   habilitado = TRUE  y expira_prueba_en <= NOW()             → prueba vencida: el guard fija habilitado = FALSE y
--                                                               expira_prueba_en = NULL en la base y responde 403.
--
-- prueba_iniciada_en deja constancia de que el módulo ya consumió su prueba (una por módulo: no se reactiva sola).
-- Contratación permanente tras la prueba (Astra Digital Solutions):
--   UPDATE modulos_premium
--      SET habilitado = TRUE, habilitado_en = NOW(), expira_prueba_en = NULL, actualizado_en = NOW()
--    WHERE codigo = 'WHATSAPP_AUTOMATICO';

ALTER TABLE modulos_premium ADD COLUMN IF NOT EXISTS prueba_iniciada_en TIMESTAMPTZ NULL;
ALTER TABLE modulos_premium ADD COLUMN IF NOT EXISTS expira_prueba_en   TIMESTAMPTZ NULL;
