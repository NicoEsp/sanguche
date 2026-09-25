-- El PRD (Product Requirements Document) Template tenía en thumbnail_url el
-- link a su página de Notion en vez de una imagen, y la card de /descargables
-- mostraba la imagen rota del navegador. Sin thumbnail la card usa el ícono
-- genérico, como el resto de los descargables.
update public.downloadable_resources
set thumbnail_url = null
where slug = 'prd-product-requirements-document-template'
  and thumbnail_url like 'https://www.notion.so/%';
