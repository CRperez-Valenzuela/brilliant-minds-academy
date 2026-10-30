-- 009_representantes_telefono_pendiente.sql — Blindaje contra suplantación en admisiones (hallazgo H2).
-- El formulario público es anónimo: quien conozca una cédula NO puede reescribir el teléfono de un representante existente
-- (ese número recibe los enlaces privados del portal por WhatsApp). Un teléfono distinto llegado por el formulario se guarda
-- AQUÍ, sin tocar `representantes.telefono`, hasta que una persona de la administración lo apruebe o lo descarte.
-- `telefono` sigue siendo el único número verificado y el único que usan las notificaciones.

ALTER TABLE representantes ADD COLUMN IF NOT EXISTS telefono_pendiente VARCHAR(20) NULL CONSTRAINT ck_representantes_tel_pendiente CHECK (telefono_pendiente IS NULL OR (telefono_pendiente !~ '\s' AND char_length(telefono_pendiente) BETWEEN 10 AND 15));
ALTER TABLE representantes ADD COLUMN IF NOT EXISTS telefono_pendiente_en TIMESTAMPTZ NULL;
