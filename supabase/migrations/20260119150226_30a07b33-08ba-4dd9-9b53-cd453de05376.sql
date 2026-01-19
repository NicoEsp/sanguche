-- Agregar columna is_free para cursos gratuitos
ALTER TABLE public.courses 
ADD COLUMN is_free BOOLEAN NOT NULL DEFAULT false;

-- Marcar "Product Management 101" como gratuito
UPDATE public.courses 
SET is_free = true 
WHERE slug = 'product-management-101';