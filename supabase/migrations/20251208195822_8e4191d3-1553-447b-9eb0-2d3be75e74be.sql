-- Adjust display_order for grid resources to remove gaps
UPDATE public.starterpack_resources SET display_order = 5 WHERE slug = 'articulo-jobs-to-be-done';
UPDATE public.starterpack_resources SET display_order = 6 WHERE slug = 'template-user-story-mapping';
UPDATE public.starterpack_resources SET display_order = 5 WHERE slug = 'articulo-escalando-equipos';
UPDATE public.starterpack_resources SET display_order = 6 WHERE slug = 'template-roadmap-estrategico';