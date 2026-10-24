-- 007_invitaciones_inscripcion.sql — Portal de invitaciones: un enlace de un solo uso que fija SEDE y NIVEL de la inscripción.
-- El token en claro (48 hex) solo viaja en el enlace; en la base se guarda su SHA-256 (igual que portal_tokens).
-- El bloqueo del nivel lo impone el SERVIDOR al inscribir (el CSS del formulario es solo la señal visual).

CREATE TABLE IF NOT EXISTS invitaciones_inscripcion (
  id             SERIAL       NOT NULL CONSTRAINT pk_invitaciones_inscripcion PRIMARY KEY,
  token_hash     CHAR(64)     NOT NULL CONSTRAINT uq_invitaciones_token UNIQUE,
  sede_id        INTEGER      NOT NULL CONSTRAINT fk_invitaciones_sede REFERENCES sedes(id),
  nivel_asignado VARCHAR(60)  NOT NULL,
  estado         VARCHAR(10)  NOT NULL DEFAULT 'Pendiente'
                 CONSTRAINT ck_invitaciones_estado CHECK (estado IN ('Pendiente', 'Usada', 'Revocada')),
  expira_en      TIMESTAMPTZ  NOT NULL,
  creado_por     INTEGER      NULL CONSTRAINT fk_invitaciones_creador REFERENCES usuarios_admin(id),
  estudiante_id  INTEGER      NULL CONSTRAINT fk_invitaciones_estudiante REFERENCES estudiantes(id),
  usada_en       TIMESTAMPTZ  NULL,
  creado_en      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_invitaciones_sede_estado ON invitaciones_inscripcion (sede_id, estado, expira_en);

DO $$
DECLARE
  rol TEXT;
  secuencia TEXT;
BEGIN
  ALTER TABLE invitaciones_inscripcion ENABLE ROW LEVEL SECURITY;
  FOREACH rol IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = rol) THEN
      EXECUTE format('REVOKE ALL ON TABLE invitaciones_inscripcion FROM %I', rol);
      secuencia := pg_get_serial_sequence('public.invitaciones_inscripcion', 'id');
      IF secuencia IS NOT NULL THEN
        EXECUTE format('REVOKE ALL ON SEQUENCE %s FROM %I', secuencia, rol);
      END IF;
    END IF;
  END LOOP;
END
$$;
