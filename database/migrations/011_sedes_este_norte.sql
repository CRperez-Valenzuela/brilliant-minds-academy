-- 011 · Saneamiento de nombres de sede: las dos sedes del Core Base son 'Sede Este' y 'Sede Norte'.
-- PostgreSQL / Supabase. Idempotente y sin crear sedes (el Core Base arranca sin filas; las crea scripts/seed.js o la gestión de Sedes).
-- Solo RENOMBRA en sitio (conserva id y todos los datos enlazados) las sedes que aún lleven el nombre antiguo, y únicamente si el nombre
-- nuevo no existe ya (no viola uq_sedes_nombre ni fusiona sedes). Una base sin sedes no cambia.

UPDATE sedes SET nombre = 'Sede Este'
 WHERE nombre = 'Sede Acarigua'
   AND NOT EXISTS (SELECT 1 FROM sedes WHERE nombre = 'Sede Este');

UPDATE sedes SET nombre = 'Sede Norte'
 WHERE nombre = 'Sede Barquisimeto'
   AND NOT EXISTS (SELECT 1 FROM sedes WHERE nombre = 'Sede Norte');

-- La descripción comercial del módulo (sembrada por 008 en bases ya migradas) nombra las sedes con su nombre oficial.
UPDATE modulos_premium
   SET descripcion = replace(descripcion, '(Acarigua y Barquisimeto)', '(Sede Este y Sede Norte)')
 WHERE codigo = 'MULTI_SEDE_PREMIUM'
   AND descripcion LIKE '%(Acarigua y Barquisimeto)%';
