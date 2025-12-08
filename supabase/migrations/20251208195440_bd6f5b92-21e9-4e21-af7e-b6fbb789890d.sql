-- Delete the article resources (5th resource) from each path
DELETE FROM public.starterpack_resources 
WHERE slug IN ('articulo-senales-pmf', 'articulo-feedback-efectivo');