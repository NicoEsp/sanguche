-- Crear enum type para el status del curso
CREATE TYPE course_status AS ENUM ('draft', 'coming_soon', 'published');

-- Agregar columna status a la tabla courses
ALTER TABLE courses ADD COLUMN status course_status DEFAULT 'draft';

-- Migrar datos existentes basándose en is_published
UPDATE courses SET status = CASE 
  WHEN is_published = true THEN 'published'::course_status 
  ELSE 'draft'::course_status 
END;

-- Hacer la columna NOT NULL después de migrar
ALTER TABLE courses ALTER COLUMN status SET NOT NULL;

-- Actualizar RLS policy para incluir coming_soon en SELECT público
DROP POLICY IF EXISTS "courses_select_published" ON courses;
CREATE POLICY "courses_select_published_or_coming_soon" ON courses
  FOR SELECT
  USING (status IN ('published', 'coming_soon'));