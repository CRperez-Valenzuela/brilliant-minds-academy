-- 003_modulos_premium.sql — Candados de la Fase 2. Ningún módulo viene habilitado: Astra Digital Solutions
-- lo activa con un UPDATE tras la contratación:
--   UPDATE modulos_premium SET habilitado = TRUE, habilitado_en = NOW(), actualizado_en = NOW()
--    WHERE codigo = 'WHATSAPP_AUTOMATICO';

CREATE TABLE IF NOT EXISTS modulos_premium (
  codigo         VARCHAR(30)   NOT NULL CONSTRAINT pk_modulos_premium PRIMARY KEY,
  nombre         VARCHAR(120)  NOT NULL,
  descripcion    VARCHAR(400)  NOT NULL,
  precio_usd     NUMERIC(10,2) NOT NULL CONSTRAINT ck_modulos_precio CHECK (precio_usd >= 0),
  habilitado     BOOLEAN       NOT NULL DEFAULT FALSE,
  habilitado_en  TIMESTAMPTZ   NULL,
  actualizado_en TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- DO NOTHING: re-ejecutar la migración jamás pisa el estado "habilitado" ni un precio negociado.
INSERT INTO modulos_premium (codigo, nombre, descripcion, precio_usd) VALUES
  ('IA_ATENCION',         'Atención al Cliente por IA y Clasificación Temática',
   'Agente de respuestas frecuentes que clasifica los mensajes entrantes en Reclamos, Felicitaciones o Propuestas.', 200.00),
  ('WHATSAPP_AUTOMATICO', 'Automatización vía WhatsApp',
   'Tarea programada que despacha las alertas masivas automáticamente en las fechas límite.',                         150.00),
  ('BANCAMIGA',           'Integración Bancaria - API Bancamiga',
   'Validación digital inmediata de la referencia contra el banco, en sustitución de la auditoría humana.',            300.00),
  ('APP_MOVIL',           'Aplicación Móvil Administrativa',
   'API REST unificada para auditar referencias y controlar el Dashboard desde una app móvil.',                        450.00),
  ('FACHADA_WEB',         'Fachada Web con Scroll-Tour Inmersivo',
   'Ruteador público que enlaza el tráfico de la landing page con el Portal de Admisiones.',                           550.00)
ON CONFLICT (codigo) DO NOTHING;

-- Parámetro obligatorio antes de abrir inscripciones: el backend responde 503 CONFIG_INCOMPLETA mientras sea 0.
INSERT INTO parametros (clave, valor) VALUES ('MATRICULA_USD', '0.00')
ON CONFLICT (clave) DO NOTHING;
