-- 001_core_base.sql — Brilliant Minds Academy · Core Base (Microsoft SQL Server 2016 SP1+)
-- Idempotente. Lotes separados por GO (los interpreta scripts/migrate.js; en SSMS/sqlcmd funcionan nativos).
-- Convenciones: NVARCHAR para texto, DECIMAL para dinero (nunca FLOAT), DATETIME2 en UTC (SYSUTCDATETIME),
-- DATE para vencimientos (día calendario de Caracas, UTC-4 fijo: Venezuela no usa horario de verano).

-- ───────────────────────── Control de migraciones ─────────────────────────
IF OBJECT_ID(N'dbo.schema_migrations', N'U') IS NULL
CREATE TABLE dbo.schema_migrations (
  nombre      NVARCHAR(150) NOT NULL CONSTRAINT pk_schema_migrations PRIMARY KEY,
  aplicada_en DATETIME2     NOT NULL CONSTRAINT df_schema_migrations_fecha DEFAULT SYSUTCDATETIME()
);
GO

-- ───────────────────────── Usuarios del panel ─────────────────────────
IF OBJECT_ID(N'dbo.usuarios_admin', N'U') IS NULL
CREATE TABLE dbo.usuarios_admin (
  id            INT IDENTITY(1,1) NOT NULL CONSTRAINT pk_usuarios_admin PRIMARY KEY,
  nombre        NVARCHAR(120) NOT NULL,
  email         NVARCHAR(160) NOT NULL CONSTRAINT uq_usuarios_admin_email UNIQUE,
  password_hash NVARCHAR(100) NOT NULL,
  rol           NVARCHAR(20)  NOT NULL CONSTRAINT df_usuarios_admin_rol DEFAULT N'admin'
                CONSTRAINT ck_usuarios_admin_rol CHECK (rol IN (N'admin', N'secretaria')),
  activo        BIT           NOT NULL CONSTRAINT df_usuarios_admin_activo DEFAULT 1,
  creado_en     DATETIME2     NOT NULL CONSTRAINT df_usuarios_admin_creado DEFAULT SYSUTCDATETIME()
);
GO

-- ───────────────────────── Parámetros y cuentas de la academia ─────────────────────────
IF OBJECT_ID(N'dbo.parametros', N'U') IS NULL
CREATE TABLE dbo.parametros (
  clave          NVARCHAR(60)  NOT NULL CONSTRAINT pk_parametros PRIMARY KEY,
  valor          NVARCHAR(300) NOT NULL,
  actualizado_en DATETIME2     NOT NULL CONSTRAINT df_parametros_fecha DEFAULT SYSUTCDATETIME()
);
GO

IF OBJECT_ID(N'dbo.cuentas_pago', N'U') IS NULL
CREATE TABLE dbo.cuentas_pago (
  id      INT IDENTITY(1,1) NOT NULL CONSTRAINT pk_cuentas_pago PRIMARY KEY,
  metodo  NVARCHAR(20)  NOT NULL
          CONSTRAINT ck_cuentas_pago_metodo CHECK (metodo IN (N'ZELLE', N'BINANCE', N'PAYPAL', N'PAGO_MOVIL')),
  titular NVARCHAR(150) NOT NULL,
  detalle NVARCHAR(500) NOT NULL,   -- correo / ID Binance / banco+teléfono+cédula, según el método
  activa  BIT           NOT NULL CONSTRAINT df_cuentas_pago_activa DEFAULT 1
);
GO

-- ───────────────────────── Tasa BCV (histórico de capturas) ─────────────────────────
IF OBJECT_ID(N'dbo.tasas_bcv', N'U') IS NULL
CREATE TABLE dbo.tasas_bcv (
  id           BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT pk_tasas_bcv PRIMARY KEY,
  tasa         DECIMAL(18,4) NOT NULL CONSTRAINT ck_tasas_bcv_tasa CHECK (tasa > 0),
  fuente       NVARCHAR(120) NOT NULL,
  fecha_valor  DATETIME2     NULL,      -- fecha que reporta la fuente
  capturada_en DATETIME2     NOT NULL CONSTRAINT df_tasas_bcv_captura DEFAULT SYSUTCDATETIME()
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'ix_tasas_bcv_captura' AND object_id = OBJECT_ID(N'dbo.tasas_bcv'))
  CREATE INDEX ix_tasas_bcv_captura ON dbo.tasas_bcv (capturada_en DESC);
GO

-- ───────────────────────── Representantes y estudiantes ─────────────────────────
IF OBJECT_ID(N'dbo.representantes', N'U') IS NULL
CREATE TABLE dbo.representantes (
  id        INT IDENTITY(1,1) NOT NULL CONSTRAINT pk_representantes PRIMARY KEY,
  nombres   NVARCHAR(100) NOT NULL,
  apellidos NVARCHAR(100) NOT NULL,
  cedula    NVARCHAR(20)  NOT NULL CONSTRAINT uq_representantes_cedula UNIQUE,
  email     NVARCHAR(160) NULL,
  -- Una sola cadena, estrictamente sin espacios (el backend la sanea; el CHECK es la última defensa).
  telefono  NVARCHAR(20)  NOT NULL
            CONSTRAINT ck_representantes_tel_sin_espacios CHECK (telefono NOT LIKE N'% %' AND LEN(telefono) BETWEEN 10 AND 15),
  creado_en DATETIME2     NOT NULL CONSTRAINT df_representantes_creado DEFAULT SYSUTCDATETIME()
);
GO

IF OBJECT_ID(N'dbo.estudiantes', N'U') IS NULL
CREATE TABLE dbo.estudiantes (
  id                    INT IDENTITY(1,1) NOT NULL CONSTRAINT pk_estudiantes PRIMARY KEY,
  representante_id      INT           NOT NULL CONSTRAINT fk_estudiantes_representante REFERENCES dbo.representantes(id),
  nombres               NVARCHAR(100) NOT NULL,
  apellidos             NVARCHAR(100) NOT NULL,
  cedula_identidad      NVARCHAR(20)  NULL,
  fecha_nacimiento      DATE          NOT NULL,
  -- Académicos
  grado_solicitado      NVARCHAR(60)  NOT NULL,
  colegio_procedencia   NVARCHAR(150) NULL,
  ultimo_grado_aprobado NVARCHAR(60)  NULL,
  -- Médicos
  tipo_sangre           NVARCHAR(5)   NULL,
  alergias              NVARCHAR(500) NULL,
  condiciones_medicas   NVARCHAR(500) NULL,
  medicamentos          NVARCHAR(500) NULL,
  emergencia_nombre     NVARCHAR(150) NULL,
  emergencia_telefono   NVARCHAR(20)  NULL
                        CONSTRAINT ck_estudiantes_emerg_sin_espacios CHECK (emergencia_telefono IS NULL OR emergencia_telefono NOT LIKE N'% %'),
  -- Estado administrativo almacenado. El estado "en tiempo real" (Moroso) se deriva en dbo.vw_estudiantes_estado.
  estatus_academico     NVARCHAR(45)  NOT NULL CONSTRAINT df_estudiantes_estatus DEFAULT N'Pendiente por Validación Administrativa'
                        CONSTRAINT ck_estudiantes_estatus CHECK (estatus_academico IN
                          (N'Pendiente por Validación Administrativa', N'Activo', N'Fuera de la Academia')),
  fecha_retiro          DATE          NULL,
  motivo_retiro         NVARCHAR(300) NULL,
  -- Google Drive
  drive_folder_id       NVARCHAR(100) NULL,
  drive_folder_url      NVARCHAR(300) NULL,
  creado_en             DATETIME2     NOT NULL CONSTRAINT df_estudiantes_creado DEFAULT SYSUTCDATETIME(),
  actualizado_en        DATETIME2     NOT NULL CONSTRAINT df_estudiantes_actualizado DEFAULT SYSUTCDATETIME()
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'ux_estudiantes_identidad' AND object_id = OBJECT_ID(N'dbo.estudiantes'))
  CREATE UNIQUE INDEX ux_estudiantes_identidad ON dbo.estudiantes (representante_id, nombres, apellidos, fecha_nacimiento);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'ix_estudiantes_representante' AND object_id = OBJECT_ID(N'dbo.estudiantes'))
  CREATE INDEX ix_estudiantes_representante ON dbo.estudiantes (representante_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'ix_estudiantes_estatus' AND object_id = OBJECT_ID(N'dbo.estudiantes'))
  CREATE INDEX ix_estudiantes_estatus ON dbo.estudiantes (estatus_academico);
GO

IF OBJECT_ID(N'dbo.documentos_estudiante', N'U') IS NULL
CREATE TABLE dbo.documentos_estudiante (
  id             INT IDENTITY(1,1) NOT NULL CONSTRAINT pk_documentos_estudiante PRIMARY KEY,
  estudiante_id  INT           NOT NULL CONSTRAINT fk_documentos_estudiante REFERENCES dbo.estudiantes(id) ON DELETE CASCADE,
  tipo           NVARCHAR(20)  NOT NULL
                 CONSTRAINT ck_documentos_tipo CHECK (tipo IN (N'FOTO_CARNET', N'CEDULA_IDENTIDAD', N'ACTA_NACIMIENTO')),
  nombre_archivo NVARCHAR(200) NOT NULL,
  mime_type      NVARCHAR(100) NOT NULL,
  tamano_bytes   INT           NOT NULL CONSTRAINT ck_documentos_tamano CHECK (tamano_bytes > 0),
  drive_file_id  NVARCHAR(100) NOT NULL,
  drive_url      NVARCHAR(300) NULL,
  subido_en      DATETIME2     NOT NULL CONSTRAINT df_documentos_subido DEFAULT SYSUTCDATETIME(),
  CONSTRAINT uq_documentos_estudiante_tipo UNIQUE (estudiante_id, tipo)
);
GO

-- ───────────────────────── Facturación ─────────────────────────
IF OBJECT_ID(N'dbo.cuotas', N'U') IS NULL
CREATE TABLE dbo.cuotas (
  id                INT IDENTITY(1,1) NOT NULL CONSTRAINT pk_cuotas PRIMARY KEY,
  estudiante_id     INT           NOT NULL CONSTRAINT fk_cuotas_estudiante REFERENCES dbo.estudiantes(id),
  tipo              NVARCHAR(15)  NOT NULL CONSTRAINT df_cuotas_tipo DEFAULT N'MENSUALIDAD'
                    CONSTRAINT ck_cuotas_tipo CHECK (tipo IN (N'MATRICULA', N'MENSUALIDAD', N'OTRO')),
  concepto          NVARCHAR(150) NOT NULL,
  monto_usd         DECIMAL(10,2) NOT NULL CONSTRAINT ck_cuotas_monto CHECK (monto_usd > 0),
  fecha_vencimiento DATE          NOT NULL,
  estado            NVARCHAR(15)  NOT NULL CONSTRAINT df_cuotas_estado DEFAULT N'Pendiente'
                    CONSTRAINT ck_cuotas_estado CHECK (estado IN (N'Pendiente', N'En Revisión', N'Pagada', N'Anulada')),
  creado_en         DATETIME2     NOT NULL CONSTRAINT df_cuotas_creado DEFAULT SYSUTCDATETIME()
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'ix_cuotas_estudiante_estado' AND object_id = OBJECT_ID(N'dbo.cuotas'))
  CREATE INDEX ix_cuotas_estudiante_estado ON dbo.cuotas (estudiante_id, estado, fecha_vencimiento);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'ix_cuotas_estado_venc' AND object_id = OBJECT_ID(N'dbo.cuotas'))
  CREATE INDEX ix_cuotas_estado_venc ON dbo.cuotas (estado, fecha_vencimiento) INCLUDE (monto_usd, estudiante_id);
GO

IF OBJECT_ID(N'dbo.pagos_referencias', N'U') IS NULL
CREATE TABLE dbo.pagos_referencias (
  id             INT IDENTITY(1,1) NOT NULL CONSTRAINT pk_pagos_referencias PRIMARY KEY,
  cuota_id       INT           NOT NULL CONSTRAINT fk_pagos_cuota REFERENCES dbo.cuotas(id),
  estudiante_id  INT           NOT NULL CONSTRAINT fk_pagos_estudiante REFERENCES dbo.estudiantes(id),
  referencia     NVARCHAR(40)  NOT NULL,
  metodo_pago    NVARCHAR(20)  NOT NULL
                 CONSTRAINT ck_pagos_metodo CHECK (metodo_pago IN (N'ZELLE', N'BINANCE', N'PAYPAL', N'PAGO_MOVIL')),
  monto_usd      DECIMAL(10,2) NOT NULL CONSTRAINT ck_pagos_monto_usd CHECK (monto_usd > 0),
  tasa_bcv       DECIMAL(18,4) NOT NULL CONSTRAINT ck_pagos_tasa CHECK (tasa_bcv > 0),
  monto_bs       DECIMAL(18,2) NOT NULL CONSTRAINT ck_pagos_monto_bs CHECK (monto_bs > 0),
  estado         NVARCHAR(15)  NOT NULL CONSTRAINT df_pagos_estado DEFAULT N'Por Validar'
                 CONSTRAINT ck_pagos_estado CHECK (estado IN (N'Por Validar', N'Aprobada', N'Rechazada')),
  declarado_en   DATETIME2     NOT NULL CONSTRAINT df_pagos_declarado DEFAULT SYSUTCDATETIME(),
  revisado_por   INT           NULL CONSTRAINT fk_pagos_revisor REFERENCES dbo.usuarios_admin(id),
  revisado_en    DATETIME2     NULL,
  nota_revision  NVARCHAR(300) NULL
);
GO
-- Una referencia bancaria no puede usarse dos veces (las rechazadas liberan la referencia).
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'ux_pagos_referencia_activa' AND object_id = OBJECT_ID(N'dbo.pagos_referencias'))
  CREATE UNIQUE INDEX ux_pagos_referencia_activa ON dbo.pagos_referencias (metodo_pago, referencia) WHERE estado <> N'Rechazada';
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'ix_pagos_bandeja' AND object_id = OBJECT_ID(N'dbo.pagos_referencias'))
  CREATE INDEX ix_pagos_bandeja ON dbo.pagos_referencias (estado, declarado_en);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'ix_pagos_cuota' AND object_id = OBJECT_ID(N'dbo.pagos_referencias'))
  CREATE INDEX ix_pagos_cuota ON dbo.pagos_referencias (cuota_id);
GO

-- ───────────────────────── Contabilidad interna ─────────────────────────
IF OBJECT_ID(N'dbo.personal', N'U') IS NULL
CREATE TABLE dbo.personal (
  id               INT IDENTITY(1,1) NOT NULL CONSTRAINT pk_personal PRIMARY KEY,
  nombres          NVARCHAR(100) NOT NULL,
  apellidos        NVARCHAR(100) NOT NULL,
  cedula           NVARCHAR(20)  NOT NULL CONSTRAINT uq_personal_cedula UNIQUE,
  email            NVARCHAR(160) NULL,
  telefono         NVARCHAR(20)  NULL CONSTRAINT ck_personal_tel CHECK (telefono IS NULL OR telefono NOT LIKE N'% %'),
  cargo            NVARCHAR(100) NOT NULL,
  tipo             NVARCHAR(15)  NOT NULL CONSTRAINT ck_personal_tipo CHECK (tipo IN (N'Docente', N'Administrativo')),
  -- Fijo: salario mensual · Honorarios: horas dictadas × tarifa · Mixto: ambos.
  modalidad_pago   NVARCHAR(12)  NOT NULL CONSTRAINT ck_personal_modalidad CHECK (modalidad_pago IN (N'Fijo', N'Honorarios', N'Mixto')),
  salario_fijo_usd DECIMAL(10,2) NOT NULL CONSTRAINT df_personal_fijo DEFAULT 0 CONSTRAINT ck_personal_fijo CHECK (salario_fijo_usd >= 0),
  tarifa_hora_usd  DECIMAL(10,2) NOT NULL CONSTRAINT df_personal_tarifa DEFAULT 0 CONSTRAINT ck_personal_tarifa CHECK (tarifa_hora_usd >= 0),
  fecha_ingreso    DATE          NULL,
  activo           BIT           NOT NULL CONSTRAINT df_personal_activo DEFAULT 1,
  creado_en        DATETIME2     NOT NULL CONSTRAINT df_personal_creado DEFAULT SYSUTCDATETIME(),
  CONSTRAINT ck_personal_coherencia CHECK (
       (modalidad_pago = N'Fijo'       AND salario_fijo_usd > 0)
    OR (modalidad_pago = N'Honorarios' AND tarifa_hora_usd  > 0)
    OR (modalidad_pago = N'Mixto'      AND salario_fijo_usd > 0 AND tarifa_hora_usd > 0))
);
GO

IF OBJECT_ID(N'dbo.horas_clase', N'U') IS NULL
CREATE TABLE dbo.horas_clase (
  id          INT IDENTITY(1,1) NOT NULL CONSTRAINT pk_horas_clase PRIMARY KEY,
  personal_id INT           NOT NULL CONSTRAINT fk_horas_personal REFERENCES dbo.personal(id),
  fecha       DATE          NOT NULL,
  horas       DECIMAL(5,2)  NOT NULL CONSTRAINT ck_horas_rango CHECK (horas > 0 AND horas <= 24),
  descripcion NVARCHAR(200) NULL,
  creado_en   DATETIME2     NOT NULL CONSTRAINT df_horas_creado DEFAULT SYSUTCDATETIME()
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'ix_horas_personal_fecha' AND object_id = OBJECT_ID(N'dbo.horas_clase'))
  CREATE INDEX ix_horas_personal_fecha ON dbo.horas_clase (personal_id, fecha) INCLUDE (horas);
GO

IF OBJECT_ID(N'dbo.nomina_pagos', N'U') IS NULL
CREATE TABLE dbo.nomina_pagos (
  id               INT IDENTITY(1,1) NOT NULL CONSTRAINT pk_nomina_pagos PRIMARY KEY,
  personal_id      INT           NOT NULL CONSTRAINT fk_nomina_personal REFERENCES dbo.personal(id),
  periodo          CHAR(7)       NOT NULL CONSTRAINT ck_nomina_periodo CHECK (periodo LIKE '[0-9][0-9][0-9][0-9]-[0-1][0-9]'),
  monto_fijo_usd   DECIMAL(10,2) NOT NULL,
  horas_totales    DECIMAL(7,2)  NOT NULL,
  tarifa_hora_usd  DECIMAL(10,2) NOT NULL,
  monto_horas_usd  DECIMAL(10,2) NOT NULL,
  total_usd        DECIMAL(10,2) NOT NULL CONSTRAINT ck_nomina_total CHECK (total_usd >= 0),
  estado           NVARCHAR(10)  NOT NULL CONSTRAINT df_nomina_estado DEFAULT N'Calculada'
                   CONSTRAINT ck_nomina_estado CHECK (estado IN (N'Calculada', N'Pagada')),
  pagado_en        DATETIME2     NULL,
  creado_en        DATETIME2     NOT NULL CONSTRAINT df_nomina_creado DEFAULT SYSUTCDATETIME(),
  CONSTRAINT uq_nomina_personal_periodo UNIQUE (personal_id, periodo)
);
GO

IF OBJECT_ID(N'dbo.egresos', N'U') IS NULL
CREATE TABLE dbo.egresos (
  id             INT IDENTITY(1,1) NOT NULL CONSTRAINT pk_egresos PRIMARY KEY,
  fecha          DATE          NOT NULL,
  categoria      NVARCHAR(60)  NOT NULL,
  descripcion    NVARCHAR(300) NOT NULL,
  monto_usd      DECIMAL(12,2) NOT NULL CONSTRAINT ck_egresos_monto CHECK (monto_usd > 0),
  referencia     NVARCHAR(60)  NULL,
  nomina_pago_id INT           NULL CONSTRAINT fk_egresos_nomina REFERENCES dbo.nomina_pagos(id),
  creado_en      DATETIME2     NOT NULL CONSTRAINT df_egresos_creado DEFAULT SYSUTCDATETIME()
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'ux_egresos_nomina' AND object_id = OBJECT_ID(N'dbo.egresos'))
  CREATE UNIQUE INDEX ux_egresos_nomina ON dbo.egresos (nomina_pago_id) WHERE nomina_pago_id IS NOT NULL;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'ix_egresos_fecha' AND object_id = OBJECT_ID(N'dbo.egresos'))
  CREATE INDEX ix_egresos_fecha ON dbo.egresos (fecha) INCLUDE (monto_usd);
GO

-- ───────────────────────── Notificaciones WhatsApp y portal privado ─────────────────────────
IF OBJECT_ID(N'dbo.notificaciones_whatsapp', N'U') IS NULL
CREATE TABLE dbo.notificaciones_whatsapp (
  id            INT IDENTITY(1,1) NOT NULL CONSTRAINT pk_notificaciones PRIMARY KEY,
  estudiante_id INT            NOT NULL CONSTRAINT fk_notif_estudiante REFERENCES dbo.estudiantes(id),
  cuota_id      INT            NULL CONSTRAINT fk_notif_cuota REFERENCES dbo.cuotas(id),
  tipo          NVARCHAR(12)   NOT NULL CONSTRAINT ck_notif_tipo CHECK (tipo IN (N'PREVENTIVA', N'MOROSIDAD')),
  telefono      NVARCHAR(20)   NOT NULL,
  mensaje       NVARCHAR(MAX)  NOT NULL,
  monto_usd     DECIMAL(10,2)  NOT NULL,
  tasa_bcv      DECIMAL(18,4)  NOT NULL,
  monto_bs      DECIMAL(18,2)  NOT NULL,
  estado        NVARCHAR(10)   NOT NULL CONSTRAINT ck_notif_estado CHECK (estado IN (N'GENERADA', N'ENVIADA', N'FALLIDA')),
  error         NVARCHAR(500)  NULL,
  creado_por    INT            NULL CONSTRAINT fk_notif_usuario REFERENCES dbo.usuarios_admin(id),
  creado_en     DATETIME2      NOT NULL CONSTRAINT df_notif_creado DEFAULT SYSUTCDATETIME()
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'ix_notif_estudiante' AND object_id = OBJECT_ID(N'dbo.notificaciones_whatsapp'))
  CREATE INDEX ix_notif_estudiante ON dbo.notificaciones_whatsapp (estudiante_id, creado_en DESC);
GO

IF OBJECT_ID(N'dbo.portal_tokens', N'U') IS NULL
CREATE TABLE dbo.portal_tokens (
  id            INT IDENTITY(1,1) NOT NULL CONSTRAINT pk_portal_tokens PRIMARY KEY,
  estudiante_id INT       NOT NULL CONSTRAINT fk_portal_estudiante REFERENCES dbo.estudiantes(id) ON DELETE CASCADE,
  token_hash    CHAR(64)  NOT NULL CONSTRAINT uq_portal_token UNIQUE,   -- SHA-256 hex: el token en claro nunca se guarda
  expira_en     DATETIME2 NOT NULL,
  creado_en     DATETIME2 NOT NULL CONSTRAINT df_portal_creado DEFAULT SYSUTCDATETIME()
);
GO
