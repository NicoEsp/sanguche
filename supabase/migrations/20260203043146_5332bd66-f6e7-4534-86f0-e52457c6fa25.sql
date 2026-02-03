-- Add access_level column to downloadable_resources using existing enum
ALTER TABLE public.downloadable_resources 
ADD COLUMN access_level resource_access_level NOT NULL DEFAULT 'authenticated';

-- Insert the new premium resource
INSERT INTO public.downloadable_resources (
  title,
  slug,
  description,
  type,
  file_path,
  bucket_name,
  access_level,
  display_order,
  is_featured,
  is_active
) VALUES (
  'Prepárate para una entrevista de PM',
  'preparate-entrevista-pm',
  'Guía para preparar tu narrativa profesional y destacar en entrevistas de Product Manager. Incluye frameworks para logros, liderazgo y decisiones difíciles.',
  'guide',
  'preparate-entrevista-pm.pdf',
  'downloads',
  'premium',
  10,
  true,
  true
);