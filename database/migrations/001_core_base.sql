-- 001_core_base.sql — Brilliant Minds Academy · Core Base (PostgreSQL 15+ · Supabase)
-- Idempotente (CREATE ... IF NOT EXISTS). scripts/migrate.js ejecuta cada archivo dentro de UNA transacción:
-- PostgreSQL admite DDL transaccional, así que una migración a medias nunca queda aplicada.
-- Convenciones: VARCHAR(n) para texto acotado y TEXT para texto libre; NUMERIC para dinero (nunca FLOAT/REAL);
-- TIMESTAMPTZ en UTC con DEFAULT NOW(); DATE para vencimientos (día calendario de Caracas, UTC-4 fijo: sin horario de verano);
-- SERIAL/BIGSERIAL para identificadores. Los objetos viven en el esquema por defecto (public).

-- ───────────────────────── Control de migraciones ─────────────────────────
CREATE TABLE IF NOT EXISTS schema_migrations (
  nombre      VARCHAR(150) NOT NULL CONSTRAINT pk_schema_migrations PRIMARY KEY,
  aplicada_en TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ───────────────────────── Usuarios del panel ─────────────────────────
CREATE TABLE IF NOT EXISTS usuarios_admin (
  id            SERIAL       NOT NULL CONSTRAINT pk_usuarios_admin PRIMARY KEY,
  nombre        VARCHAR(120) NOT NULL,
  email         VARCHAR(160) NOT NULL CONSTRAINT uq_usuarios_admin_email UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  rol           VARCHAR(20)  NOT NULL DEFAULT 'admin'
                CONSTRAINT ck_usuarios_admin_rol CHECK (rol IN ('admin', 'secretaria')),
  activo        BOOLEAN      NOT NULL DEFAULT TRUE,
  creado_en     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ───────────────────────── Parámetros y cuentas de la academia ─────────────────────────
CREATE TABLE IF NOT EXISTS parametros (
  clave          VARCHAR(60)  NOT NULL CONSTRAINT pk_parametros PRIMARY KEY,
  valor          VARCHAR(300) NOT NULL,
  actualizado_en TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cuentas_pago (
  id      SERIAL       NOT NULL CONSTRAINT pk_cuentas_pago PRIMARY KEY,
  metodo  VARCHAR(20)  NOT NULL
          CONSTRAINT ck_cuentas_pago_metodo CHECK (metodo IN ('ZELLE', 'BINANCE', 'PAYPAL', 'PAGO_MOVIL')),
  titular VARCHAR(150) NOT NULL,
  detalle VARCHAR(500) NOT NULL,   -- correo / ID Binance / banco+teléfono+cédula, según el método
  activa  BOOLEAN      NOT NULL DEFAULT TRUE
);

-- ───────────────────────── Tasa BCV (histórico de capturas) ─────────────────────────
CREATE TABLE IF NOT EXISTS tasas_bcv (
  id           BIGSERIAL     NOT NULL CONSTRAINT pk_tasas_bcv PRIMARY KEY,
  tasa         NUMERIC(18,4) NOT NULL CONSTRAINT ck_tasas_bcv_tasa CHECK (tasa > 0),
  fuente       VARCHAR(120)  NOT NULL,
  fecha_valor  TIMESTAMPTZ   NULL,      -- fecha que reporta la fuente
  capturada_en TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_tasas_bcv_captura ON tasas_bcv (capturada_en DESC);

-- ───────────────────────── Representantes y estudiantes ─────────────────────────
CREATE TABLE IF NOT EXISTS representantes (
  id        SERIAL       NOT NULL CONSTRAINT pk_representantes PRIMARY KEY,
  nombres   VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  cedula    VARCHAR(20)  NOT NULL CONSTRAINT uq_representantes_cedula UNIQUE,
  email     VARCHAR(160) NULL,
  -- Una sola cadena, estrictamente sin espacios (el backend la sanea; el CHECK es la última defensa).
  telefono  VARCHAR(20)  NOT NULL
            CONSTRAINT ck_representantes_tel_sin_espacios CHECK (telefono !~ '\s' AND char_length(telefono) BETWEEN 10 AND 15),
  creado_en TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS estudiantes (
  id                    SERIAL       NOT NULL CONSTRAINT pk_estudiantes PRIMARY KEY,
  representante_id      INTEGER      NOT NULL CONSTRAINT fk_estudiantes_representante REFERENCES representantes(id),
  nombres               VARCHAR(100) NOT NULL,
  apellidos             VARCHAR(100) NOT NULL,
  cedula_identidad      VARCHAR(20)  NULL,
  fecha_nacimiento      DATE         NOT NULL,
  -- Académicos
  grado_solicitado      VARCHAR(60)  NOT NULL,
  colegio_procedencia   VARCHAR(150) NULL,
  ultimo_grado_aprobado VARCHAR(60)  NULL,
  -- Médicos
  tipo_sangre           VARCHAR(5)   NULL,
  alergias              VARCHAR(500) NULL,
  condiciones_medicas   VARCHAR(500) NULL,
  medicamentos          VARCHAR(500) NULL,
  emergencia_nombre     VARCHAR(150) NULL,
  emergencia_telefono   VARCHAR(20)  NULL
                        CONSTRAINT ck_estudiantes_emerg_sin_espacios CHECK (emergencia_telefono IS NULL OR emergencia_telefono !~ '\s'),
  -- Estado administrativo almacenado. El estado "en tiempo real" (Moroso) se deriva en vw_estudiantes_estado.
  estatus_academico     VARCHAR(45)  NOT NULL DEFAULT 'Pendiente por Validación Administrativa'
                        CONSTRAINT ck_estudiantes_estatus CHECK (estatus_academico IN
                          ('Pendiente por Validación Administrativa', 'Activo', 'Fuera de la Academia')),
  fecha_retiro          DATE         NULL,
  motivo_retiro         VARCHAR(300) NULL,
  -- Google Drive
  drive_folder_id       VARCHAR(100) NULL,
  drive_folder_url      VARCHAR(300) NULL,
  creado_en             TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  actualizado_en        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_estudiantes_identidad ON estudiantes (representante_id, nombres, apellidos, fecha_nacimiento);
CREATE INDEX IF NOT EXISTS ix_estudiantes_representante ON estudiantes (representante_id);
CREATE INDEX IF NOT EXISTS ix_estudiantes_estatus ON estudiantes (estatus_academico);

CREATE TABLE IF NOT EXISTS documentos_estudiante (
  id             SERIAL       NOT NULL CONSTRAINT pk_documentos_estudiante PRIMARY KEY,
  estudiante_id  INTEGER      NOT NULL CONSTRAINT fk_documentos_estudiante REFERENCES estudiantes(id) ON DELETE CASCADE,
  tipo           VARCHAR(20)  NOT NULL
                 CONSTRAINT ck_documentos_tipo CHECK (tipo IN ('FOTO_CARNET', 'CEDULA_IDENTIDAD', 'ACTA_NACIMIENTO')),
  nombre_archivo VARCHAR(200) NOT NULL,
  mime_type      VARCHAR(100) NOT NULL,
  tamano_bytes   INTEGER      NOT NULL CONSTRAINT ck_documentos_tamano CHECK (tamano_bytes > 0),
  drive_file_id  VARCHAR(100) NOT NULL,
  drive_url      VARCHAR(300) NULL,
  subido_en      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_documentos_estudiante_tipo UNIQUE (estudiante_id, tipo)
);

-- ───────────────────────── Facturación ─────────────────────────
CREATE TABLE IF NOT EXISTS cuotas (
  id                SERIAL        NOT NULL CONSTRAINT pk_cuotas PRIMARY KEY,
  estudiante_id     INTEGER       NOT NULL CONSTRAINT fk_cuotas_estudiante REFERENCES estudiantes(id),
  tipo              VARCHAR(15)   NOT NULL DEFAULT 'MENSUALIDAD'
                    CONSTRAINT ck_cuotas_tipo CHECK (tipo IN ('MATRICULA', 'MENSUALIDAD', 'OTRO')),
  concepto          VARCHAR(150)  NOT NULL,
  monto_usd         NUMERIC(10,2) NOT NULL CONSTRAINT ck_cuotas_monto CHECK (monto_usd > 0),
  fecha_vencimiento DATE          NOT NULL,
  estado            VARCHAR(15)   NOT NULL DEFAULT 'Pendiente'
                    CONSTRAINT ck_cuotas_estado CHECK (estado IN ('Pendiente', 'En Revisión', 'Pagada', 'Anulada')),
  creado_en         TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_cuotas_estudiante_estado ON cuotas (estudiante_id, estado, fecha_vencimiento);
CREATE INDEX IF NOT EXISTS ix_cuotas_estado_venc ON cuotas (estado, fecha_vencimiento) INCLUDE (monto_usd, estudiante_id);
-- Una mensualidad por estudiante y concepto (las anuladas no cuentan): hace idempotente la generación masiva incluso con ejecuciones simultáneas.
CREATE UNIQUE INDEX IF NOT EXISTS ux_cuotas_mensualidad_concepto ON cuotas (estudiante_id, concepto)
  WHERE tipo = 'MENSUALIDAD' AND estado <> 'Anulada';

CREATE TABLE IF NOT EXISTS pagos_referencias (
  id             SERIAL        NOT NULL CONSTRAINT pk_pagos_referencias PRIMARY KEY,
  cuota_id       INTEGER       NOT NULL CONSTRAINT fk_pagos_cuota REFERENCES cuotas(id),
  estudiante_id  INTEGER       NOT NULL CONSTRAINT fk_pagos_estudiante REFERENCES estudiantes(id),
  referencia     VARCHAR(40)   NOT NULL,
  metodo_pago    VARCHAR(20)   NOT NULL
                 CONSTRAINT ck_pagos_metodo CHECK (metodo_pago IN ('ZELLE', 'BINANCE', 'PAYPAL', 'PAGO_MOVIL')),
  monto_usd      NUMERIC(10,2) NOT NULL CONSTRAINT ck_pagos_monto_usd CHECK (monto_usd > 0),
  tasa_bcv       NUMERIC(18,4) NOT NULL CONSTRAINT ck_pagos_tasa CHECK (tasa_bcv > 0),
  monto_bs       NUMERIC(18,2) NOT NULL CONSTRAINT ck_pagos_monto_bs CHECK (monto_bs > 0),
  estado         VARCHAR(15)   NOT NULL DEFAULT 'Por Validar'
                 CONSTRAINT ck_pagos_estado CHECK (estado IN ('Por Validar', 'Aprobada', 'Rechazada')),
  declarado_en   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  revisado_por   INTEGER       NULL CONSTRAINT fk_pagos_revisor REFERENCES usuarios_admin(id),
  revisado_en    TIMESTAMPTZ   NULL,
  nota_revision  VARCHAR(300)  NULL
);
-- Una referencia bancaria no puede usarse dos veces (las rechazadas liberan la referencia).
CREATE UNIQUE INDEX IF NOT EXISTS ux_pagos_referencia_activa ON pagos_referencias (metodo_pago, referencia) WHERE estado <> 'Rechazada';
CREATE INDEX IF NOT EXISTS ix_pagos_bandeja ON pagos_referencias (estado, declarado_en);
CREATE INDEX IF NOT EXISTS ix_pagos_cuota ON pagos_referencias (cuota_id);
CREATE INDEX IF NOT EXISTS ix_pagos_estudiante ON pagos_referencias (estudiante_id);

-- ───────────────────────── Contabilidad interna ─────────────────────────
CREATE TABLE IF NOT EXISTS personal (
  id               SERIAL        NOT NULL CONSTRAINT pk_personal PRIMARY KEY,
  nombres          VARCHAR(100)  NOT NULL,
  apellidos        VARCHAR(100)  NOT NULL,
  cedula           VARCHAR(20)   NOT NULL CONSTRAINT uq_personal_cedula UNIQUE,
  email            VARCHAR(160)  NULL,
  telefono         VARCHAR(20)   NULL CONSTRAINT ck_personal_tel CHECK (telefono IS NULL OR telefono !~ '\s'),
  cargo            VARCHAR(100)  NOT NULL,
  tipo             VARCHAR(15)   NOT NULL CONSTRAINT ck_personal_tipo CHECK (tipo IN ('Docente', 'Administrativo')),
  -- Fijo: salario mensual · Honorarios: horas dictadas × tarifa · Mixto: ambos.
  modalidad_pago   VARCHAR(12)   NOT NULL CONSTRAINT ck_personal_modalidad CHECK (modalidad_pago IN ('Fijo', 'Honorarios', 'Mixto')),
  salario_fijo_usd NUMERIC(10,2) NOT NULL DEFAULT 0 CONSTRAINT ck_personal_fijo CHECK (salario_fijo_usd >= 0),
  tarifa_hora_usd  NUMERIC(10,2) NOT NULL DEFAULT 0 CONSTRAINT ck_personal_tarifa CHECK (tarifa_hora_usd >= 0),
  fecha_ingreso    DATE          NULL,
  activo           BOOLEAN       NOT NULL DEFAULT TRUE,
  creado_en        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT ck_personal_coherencia CHECK (
       (modalidad_pago = 'Fijo'       AND salario_fijo_usd > 0)
    OR (modalidad_pago = 'Honorarios' AND tarifa_hora_usd  > 0)
    OR (modalidad_pago = 'Mixto'      AND salario_fijo_usd > 0 AND tarifa_hora_usd > 0))
);

CREATE TABLE IF NOT EXISTS horas_clase (
  id          SERIAL       NOT NULL CONSTRAINT pk_horas_clase PRIMARY KEY,
  personal_id INTEGER      NOT NULL CONSTRAINT fk_horas_personal REFERENCES personal(id),
  fecha       DATE         NOT NULL,
  horas       NUMERIC(5,2) NOT NULL CONSTRAINT ck_horas_rango CHECK (horas > 0 AND horas <= 24),
  descripcion VARCHAR(200) NULL,
  creado_en   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_horas_personal_fecha ON horas_clase (personal_id, fecha) INCLUDE (horas);

CREATE TABLE IF NOT EXISTS nomina_pagos (
  id               SERIAL        NOT NULL CONSTRAINT pk_nomina_pagos PRIMARY KEY,
  personal_id      INTEGER       NOT NULL CONSTRAINT fk_nomina_personal REFERENCES personal(id),
  periodo          CHAR(7)       NOT NULL CONSTRAINT ck_nomina_periodo CHECK (periodo ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  monto_fijo_usd   NUMERIC(10,2) NOT NULL,
  horas_totales    NUMERIC(7,2)  NOT NULL,
  tarifa_hora_usd  NUMERIC(10,2) NOT NULL,
  monto_horas_usd  NUMERIC(10,2) NOT NULL,
  total_usd        NUMERIC(10,2) NOT NULL CONSTRAINT ck_nomina_total CHECK (total_usd >= 0),
  estado           VARCHAR(10)   NOT NULL DEFAULT 'Calculada'
                   CONSTRAINT ck_nomina_estado CHECK (estado IN ('Calculada', 'Pagada')),
  pagado_en        TIMESTAMPTZ   NULL,
  creado_en        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_nomina_personal_periodo UNIQUE (personal_id, periodo)
);

CREATE TABLE IF NOT EXISTS egresos (
  id             SERIAL        NOT NULL CONSTRAINT pk_egresos PRIMARY KEY,
  fecha          DATE          NOT NULL,
  categoria      VARCHAR(60)   NOT NULL,
  descripcion    VARCHAR(300)  NOT NULL,
  monto_usd      NUMERIC(12,2) NOT NULL CONSTRAINT ck_egresos_monto CHECK (monto_usd > 0),
  referencia     VARCHAR(60)   NULL,
  nomina_pago_id INTEGER       NULL CONSTRAINT fk_egresos_nomina REFERENCES nomina_pagos(id),
  creado_en      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_egresos_nomina ON egresos (nomina_pago_id) WHERE nomina_pago_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_egresos_fecha ON egresos (fecha) INCLUDE (monto_usd);

-- ───────────────────────── Notificaciones WhatsApp y portal privado ─────────────────────────
CREATE TABLE IF NOT EXISTS notificaciones_whatsapp (
  id            SERIAL        NOT NULL CONSTRAINT pk_notificaciones PRIMARY KEY,
  estudiante_id INTEGER       NOT NULL CONSTRAINT fk_notif_estudiante REFERENCES estudiantes(id),
  cuota_id      INTEGER       NULL CONSTRAINT fk_notif_cuota REFERENCES cuotas(id),
  tipo          VARCHAR(12)   NOT NULL CONSTRAINT ck_notif_tipo CHECK (tipo IN ('PREVENTIVA', 'MOROSIDAD')),
  telefono      VARCHAR(20)   NOT NULL,
  mensaje       TEXT          NOT NULL,
  monto_usd     NUMERIC(10,2) NOT NULL,
  tasa_bcv      NUMERIC(18,4) NOT NULL,
  monto_bs      NUMERIC(18,2) NOT NULL,
  estado        VARCHAR(10)   NOT NULL CONSTRAINT ck_notif_estado CHECK (estado IN ('GENERADA', 'ENVIADA', 'FALLIDA')),
  error         VARCHAR(500)  NULL,
  creado_por    INTEGER       NULL CONSTRAINT fk_notif_usuario REFERENCES usuarios_admin(id),
  creado_en     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_notif_estudiante ON notificaciones_whatsapp (estudiante_id, creado_en DESC);

CREATE TABLE IF NOT EXISTS portal_tokens (
  id            SERIAL      NOT NULL CONSTRAINT pk_portal_tokens PRIMARY KEY,
  estudiante_id INTEGER     NOT NULL CONSTRAINT fk_portal_estudiante REFERENCES estudiantes(id) ON DELETE CASCADE,
  token_hash    CHAR(64)    NOT NULL CONSTRAINT uq_portal_token UNIQUE,   -- SHA-256 hex: el token en claro nunca se guarda
  expira_en     TIMESTAMPTZ NOT NULL,
  creado_en     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
