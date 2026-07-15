-- Evaluaciones por perfil: cada assessment nuevo declara qué evaluación tomó
-- el usuario. Las filas existentes quedan en NULL (evaluación legacy, previa
-- a los perfiles) y la UI las trata como formato anterior.
CREATE TYPE public.assessment_type AS ENUM (
  'experimentado',
  'sin_experiencia',
  'builder',
  'lider'
);

ALTER TABLE public.assessments
  ADD COLUMN assessment_type public.assessment_type;

-- Retomar una evaluación reemplaza la anterior: el cliente borra la fila
-- previa del usuario antes de insertar la nueva. Hasta ahora DELETE era solo
-- para admins, por eso esta policy nueva de borrado propio.
CREATE POLICY "assessments_delete_own"
ON public.assessments
FOR DELETE
TO authenticated
USING (public.is_assessment_owner(user_id));
