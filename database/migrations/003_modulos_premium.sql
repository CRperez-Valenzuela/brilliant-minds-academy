-- 003_modulos_premium.sql — Candados de la Fase 2. Ningún módulo viene habilitado: Astra Digital Solutions
-- lo activa con un UPDATE tras la contratación:
--   UPDATE dbo.modulos_premium SET habilitado = 1, habilitado_en = SYSUTCDATETIME(), actualizado_en = SYSUTCDATETIME()
--    WHERE codigo = N'WHATSAPP_AUTOMATICO';

IF OBJECT_ID(N'dbo.modulos_premium', N'U') IS NULL
CREATE TABLE dbo.modulos_premium (
  codigo         NVARCHAR(30)  NOT NULL CONSTRAINT pk_modulos_premium PRIMARY KEY,
  nombre         NVARCHAR(120) NOT NULL,
  descripcion    NVARCHAR(400) NOT NULL,
  precio_usd     DECIMAL(10,2) NOT NULL CONSTRAINT ck_modulos_precio CHECK (precio_usd >= 0),
  habilitado     BIT           NOT NULL CONSTRAINT df_modulos_habilitado DEFAULT 0,
  habilitado_en  DATETIME2     NULL,
  actualizado_en DATETIME2     NOT NULL CONSTRAINT df_modulos_actualizado DEFAULT SYSUTCDATETIME()
);
GO

INSERT INTO dbo.modulos_premium (codigo, nombre, descripcion, precio_usd)
SELECT v.codigo, v.nombre, v.descripcion, v.precio_usd
FROM (VALUES
  (N'IA_ATENCION',         N'Atención al Cliente por IA y Clasificación Temática',
   N'Agente de respuestas frecuentes que clasifica los mensajes entrantes en Reclamos, Felicitaciones o Propuestas.', CAST(200.00 AS DECIMAL(10,2))),
  (N'WHATSAPP_AUTOMATICO', N'Automatización vía WhatsApp',
   N'Tarea programada que despacha las alertas masivas automáticamente en las fechas límite.',                         CAST(150.00 AS DECIMAL(10,2))),
  (N'BANCAMIGA',           N'Integración Bancaria - API Bancamiga',
   N'Validación digital inmediata de la referencia contra el banco, en sustitución de la auditoría humana.',            CAST(300.00 AS DECIMAL(10,2))),
  (N'APP_MOVIL',           N'Aplicación Móvil Administrativa',
   N'API REST unificada para auditar referencias y controlar el Dashboard desde una app móvil.',                        CAST(450.00 AS DECIMAL(10,2))),
  (N'FACHADA_WEB',         N'Fachada Web con Scroll-Tour Inmersivo',
   N'Ruteador público que enlaza el tráfico de la landing page con el Portal de Admisiones.',                           CAST(550.00 AS DECIMAL(10,2)))
) AS v (codigo, nombre, descripcion, precio_usd)
WHERE NOT EXISTS (SELECT 1 FROM dbo.modulos_premium m WHERE m.codigo = v.codigo);
GO

-- Parámetro obligatorio antes de abrir inscripciones: el backend responde 503 CONFIG_INCOMPLETA mientras sea 0.
INSERT INTO dbo.parametros (clave, valor)
SELECT N'MATRICULA_USD', N'0.00'
WHERE NOT EXISTS (SELECT 1 FROM dbo.parametros WHERE clave = N'MATRICULA_USD');
GO
