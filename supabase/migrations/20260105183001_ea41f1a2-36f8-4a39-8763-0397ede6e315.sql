-- Agregar columna para fecha de publicación programada
ALTER TABLE courses ADD COLUMN publish_at timestamp with time zone DEFAULT NULL;

-- Índice para optimizar el query del cron job
CREATE INDEX idx_courses_publish_at ON courses(publish_at) 
WHERE status = 'coming_soon' AND publish_at IS NOT NULL;