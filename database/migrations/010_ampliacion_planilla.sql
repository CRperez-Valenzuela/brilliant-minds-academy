-- 010_ampliacion_planilla.sql — Planilla de Inscripción oficial (MPPE · Autogestión): expediente médico del estudiante y
-- estructura DUAL de representantes (Madre / Padre) + personas autorizadas para retirar al menor.
--
-- Idempotente: cada columna usa ADD COLUMN IF NOT EXISTS y cada restricción se crea solo si su nombre aún no existe
-- (PostgreSQL no admite ADD CONSTRAINT IF NOT EXISTS, de ahí los bloques DO … PL/pgSQL). Sin T-SQL; sin datos de usuario en el DDL.
-- Las tablas se nombran sin esquema (search_path = public), igual que el resto de migraciones y que el auditor de tests/schema-consistencia.test.js.
-- Nota de numeración: ya existe 009_representantes_telefono_pendiente.sql, por eso esta migración es la 010.

-- ───────────────────────── estudiantes: planilla del estudiante y ficha médica ─────────────────────────
ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS lugar_nacimiento VARCHAR(150) NULL;
ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS lugar_estudio VARCHAR(150) NULL;
ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS horario_preferido VARCHAR(50) NULL;
ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS bajo_tratamiento BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS tratamiento_explicacion TEXT NULL;
-- `emergencia_telefono` ya existe desde 001_core_base.sql (con su CHECK sin espacios): esta línea es un no-op deliberado que deja
-- la migración autosuficiente si se aplica sobre un esquema anterior.
ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS emergencia_telefono VARCHAR(20) NULL;

-- ───────────────────────── representantes: Madre, Padre y personas autorizadas ─────────────────────────
-- `representantes.nombres/apellidos/cedula/email/telefono` siguen siendo el representante PRINCIPAL (contacto de cobro y de WhatsApp);
-- las columnas madre_* / padre_* guardan los datos individuales de ambos progenitores tal como los pide el Ministerio.
ALTER TABLE representantes ADD COLUMN IF NOT EXISTS madre_nombres VARCHAR(100) NULL;
ALTER TABLE representantes ADD COLUMN IF NOT EXISTS madre_apellidos VARCHAR(100) NULL;
ALTER TABLE representantes ADD COLUMN IF NOT EXISTS madre_cedula VARCHAR(20) NULL;
ALTER TABLE representantes ADD COLUMN IF NOT EXISTS madre_edad INTEGER NULL;
ALTER TABLE representantes ADD COLUMN IF NOT EXISTS madre_fecha_nacimiento DATE NULL;
ALTER TABLE representantes ADD COLUMN IF NOT EXISTS madre_direccion VARCHAR(250) NULL;
ALTER TABLE representantes ADD COLUMN IF NOT EXISTS madre_telefono_fijo VARCHAR(20) NULL;
ALTER TABLE representantes ADD COLUMN IF NOT EXISTS madre_telefono_movil VARCHAR(20) NULL;
ALTER TABLE representantes ADD COLUMN IF NOT EXISTS madre_email VARCHAR(100) NULL;

ALTER TABLE representantes ADD COLUMN IF NOT EXISTS padre_nombres VARCHAR(100) NULL;
ALTER TABLE representantes ADD COLUMN IF NOT EXISTS padre_apellidos VARCHAR(100) NULL;
ALTER TABLE representantes ADD COLUMN IF NOT EXISTS padre_cedula VARCHAR(20) NULL;
ALTER TABLE representantes ADD COLUMN IF NOT EXISTS padre_edad INTEGER NULL;
ALTER TABLE representantes ADD COLUMN IF NOT EXISTS padre_fecha_nacimiento DATE NULL;
ALTER TABLE representantes ADD COLUMN IF NOT EXISTS padre_direccion VARCHAR(250) NULL;
ALTER TABLE representantes ADD COLUMN IF NOT EXISTS padre_telefono_fijo VARCHAR(20) NULL;
ALTER TABLE representantes ADD COLUMN IF NOT EXISTS padre_telefono_movil VARCHAR(20) NULL;
ALTER TABLE representantes ADD COLUMN IF NOT EXISTS padre_email VARCHAR(100) NULL;

-- Arreglo JSON de hasta 2 objetos { "nombre": …, "telefono": …, "parentesco": … } (quién puede retirar al menor).
ALTER TABLE representantes ADD COLUMN IF NOT EXISTS personas_autorizadas JSONB NOT NULL DEFAULT '[]'::jsonb;

-- ───────────────────────── Restricciones (última línea de defensa; el backend ya valida y sanea) ─────────────────────────
DO $$
DECLARE
  -- (tabla, nombre, definición): solo se crea si el nombre aún no existe en el catálogo.
  r RECORD;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('estudiantes',   'ck_estudiantes_tratamiento_len',
         'CHECK (tratamiento_explicacion IS NULL OR char_length(tratamiento_explicacion) <= 500)'),
      ('representantes','ck_representantes_personas_autorizadas',
         'CHECK (jsonb_typeof(personas_autorizadas) = ''array'' AND jsonb_array_length(personas_autorizadas) <= 2)'),
      ('representantes','ck_representantes_madre_edad',
         'CHECK (madre_edad IS NULL OR madre_edad BETWEEN 14 AND 120)'),
      ('representantes','ck_representantes_padre_edad',
         'CHECK (padre_edad IS NULL OR padre_edad BETWEEN 14 AND 120)'),
      ('representantes','ck_representantes_madre_tel_fijo',
         'CHECK (madre_telefono_fijo IS NULL OR (madre_telefono_fijo !~ ''\s'' AND char_length(madre_telefono_fijo) BETWEEN 10 AND 15))'),
      ('representantes','ck_representantes_madre_tel_movil',
         'CHECK (madre_telefono_movil IS NULL OR (madre_telefono_movil !~ ''\s'' AND char_length(madre_telefono_movil) BETWEEN 10 AND 15))'),
      ('representantes','ck_representantes_padre_tel_fijo',
         'CHECK (padre_telefono_fijo IS NULL OR (padre_telefono_fijo !~ ''\s'' AND char_length(padre_telefono_fijo) BETWEEN 10 AND 15))'),
      ('representantes','ck_representantes_padre_tel_movil',
         'CHECK (padre_telefono_movil IS NULL OR (padre_telefono_movil !~ ''\s'' AND char_length(padre_telefono_movil) BETWEEN 10 AND 15))')
    ) AS c(tabla, nombre, definicion)
  LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = r.nombre AND conrelid = to_regclass(r.tabla)) THEN
      EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I %s', r.tabla, r.nombre, r.definicion);
    END IF;
  END LOOP;
END
$$;

-- ───────────────────────── Documentación en el catálogo ─────────────────────────
COMMENT ON COLUMN representantes.personas_autorizadas IS 'Arreglo JSON (máx. 2) de { nombre, telefono, parentesco } autorizados a retirar al menor. El formulario público NO puede reescribirlo si ya tiene datos.';
COMMENT ON COLUMN estudiantes.bajo_tratamiento IS 'Planilla MPPE: ¿se encuentra o se ha encontrado bajo tratamiento médico? El detalle va en tratamiento_explicacion.';
