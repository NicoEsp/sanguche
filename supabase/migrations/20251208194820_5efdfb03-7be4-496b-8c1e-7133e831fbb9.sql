-- Insert test resources for Starter Pack

-- BUILD path resources (step_order 1-4)
INSERT INTO public.starterpack_resources (slug, title, description, type, audience, access_type, step_order, display_order, level, is_active, is_featured, bucket_name)
VALUES 
  ('guia-discovery-validar-ideas', 'Guía de Discovery: Cómo validar ideas', 'Aprende a validar tus ideas de producto antes de construir', 'pdf', 'build', 'public', 1, 1, 'beginner', true, false, 'starterpack'),
  ('template-prd', 'Template de Product Requirements Document', 'Documento estructurado para definir requerimientos de producto', 'template', 'build', 'requires_account', 2, 2, 'beginner', true, false, 'starterpack'),
  ('framework-priorizacion-rice', 'Framework de Priorización RICE', 'Método para priorizar features basado en impacto y esfuerzo', 'template', 'build', 'public', 3, 3, 'intermediate', true, false, 'starterpack'),
  ('checklist-lanzamiento-features', 'Checklist de Lanzamiento de Features', 'Lista de verificación para lanzamientos exitosos', 'checklist', 'build', 'requires_account', 4, 4, 'intermediate', true, false, 'starterpack'),

-- BUILD grid resources (no step_order)
  ('articulo-jobs-to-be-done', 'Artículo: Introducción a Jobs to be Done', 'Entiende el framework JTBD para descubrir necesidades reales', 'article', 'build', 'public', NULL, 10, 'beginner', true, false, 'starterpack'),
  ('template-user-story-mapping', 'Template de User Story Mapping', 'Organiza historias de usuario de forma visual', 'template', 'build', 'requires_account', NULL, 11, 'intermediate', true, false, 'starterpack'),

-- LEAD path resources (step_order 1-4)
  ('guia-liderazgo-pms', 'Guía de Liderazgo para Product Builders', 'Principios fundamentales para liderar equipos de producto', 'pdf', 'lead', 'public', 1, 1, 'intermediate', true, false, 'starterpack'),
  ('template-1-1-equipo', 'Template de 1:1 con tu equipo', 'Estructura tus reuniones one-on-one para mayor impacto', 'template', 'lead', 'requires_account', 2, 2, 'beginner', true, false, 'starterpack'),
  ('framework-delegacion-efectiva', 'Framework de Delegación Efectiva', 'Aprende a delegar de forma efectiva como líder', 'template', 'lead', 'public', 3, 3, 'intermediate', true, false, 'starterpack'),
  ('checklist-onboarding-pms', 'Checklist de Onboarding para nuevos PMs', 'Guía completa para incorporar nuevos PMs a tu equipo', 'checklist', 'lead', 'requires_account', 4, 4, 'advanced', true, false, 'starterpack'),

-- LEAD grid resources (no step_order)
  ('articulo-escalando-equipos', 'Artículo: Escalando equipos de producto', 'Estrategias para crecer tu equipo de producto', 'article', 'lead', 'public', NULL, 10, 'intermediate', true, false, 'starterpack'),
  ('template-roadmap-estrategico', 'Template de Roadmap Estratégico', 'Planifica tu roadmap con visión de largo plazo', 'template', 'lead', 'requires_account', NULL, 11, 'advanced', true, false, 'starterpack');