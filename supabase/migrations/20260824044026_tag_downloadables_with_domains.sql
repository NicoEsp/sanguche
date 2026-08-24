-- condition_domain pasa de "dónde se ve el recurso" a "qué competencia trabaja".
--
-- Antes, ponerle un dominio a un descargable lo sacaba de /descargables y lo
-- dejaba solo en /mejoras. El efecto práctico fue que nadie taggeó nada: con un
-- único recurso condicionado, /mejoras le mostraba la misma card a todo el
-- mundo bajo el título "Recomendados según tu evaluación", sin relación con el
-- resultado de cada persona.
--
-- Ahora el catálogo entero se ve en /descargables y el dominio solo alimenta el
-- ranking de afinidad de /mejoras (ver src/utils/resourceRecommendations.ts).
-- Este mapeo es el punto de partida y se edita desde el admin de descargables.
--
-- El rango de puntaje dice a quién le sirve el material: 1-3 para quien todavía
-- no tiene el tema resuelto, 3-4 para quien ya es competente y busca el paso
-- siguiente.

UPDATE public.downloadable_resources AS d
SET condition_domain = m.domain,
    condition_min_level = m.min_level,
    condition_max_level = m.max_level,
    updated_at = now()
FROM (VALUES
  -- Estrategia
  ('product-vision',                              'estrategia',   1, 3),
  ('preguntas-de-producto',                       'estrategia',   1, 3),
  -- Discovery
  ('reflexiones-sobre-product-discovery-0ebc6245', 'discovery',   1, 3),
  -- Analítica: tres escalones del mismo dominio
  ('m-tricas-de-producto-lo-esencial-541f8e47',   'analitica',    1, 2),
  ('metricas-de-producto-starter-pack',           'analitica',    2, 3),
  ('north-star-metrics',                          'analitica',    3, 4),
  -- Ejecución
  ('release-plan-guia-practica',                  'ejecucion',    1, 3),
  -- Comunicación
  ('prd-product-requirements-document-template',  'comunicacion', 1, 3),
  -- Monetización
  ('modelos-de-monetizacion-guia-practica',       'monetizacion', 1, 3),
  -- Stakeholders
  ('playbook-del-pm-tus-primeros-dias',           'stakeholders', 1, 3),
  -- Liderazgo
  ('template-de-reunion-efectiva-1-a-1',          'liderazgo',    1, 3)
  -- 'preparate-entrevista-pm' queda sin dominio a propósito: es material de
  -- carrera, no de una competencia evaluada.
) AS m(slug, domain, min_level, max_level)
WHERE d.slug = m.slug
  -- No pisamos lo que ya haya definido el admin.
  AND d.condition_domain IS NULL;
