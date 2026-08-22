-- Dispara un rebuild de Vercel cuando cambia contenido público.
--
-- Por qué hace falta: el HTML de las rutas públicas ahora se genera en build
-- time (scripts/prerender-seo.ts trae los artículos y cursos de Supabase y
-- escribe un index.html por cada uno). Eso es lo que hace que Google vea el
-- contenido completo, pero también significa que publicar o editar ya no se
-- refleja solo: hace falta un deploy nuevo.
--
-- El trigger cubre los dos caminos por los que un artículo se publica:
--   * manual, desde /admin/blog
--   * automático, desde la edge function publish-scheduled-blog (pasa de
--     status='scheduled' a 'published', o sea un UPDATE sobre la misma tabla)
--
-- También cubre `courses`, porque sus URLs se prerenderizan y van al sitemap.
--
-- ANTES DE APLICAR: hay que cargar la URL del deploy hook en Vault. Está
-- documentado paso a paso en docs/seo-deploy-hook.md. Si el secreto no existe,
-- el trigger no rompe la escritura: sólo deja un warning en los logs.

-- pg_net ya está instalado en el proyecto. Ojo: la extensión está registrada en
-- el schema `extensions`, pero sus funciones viven en el schema `net` que la
-- propia extensión crea. Por eso abajo se llama `net.http_post` y no
-- `extensions.net.http_post`, que no existe y aborta la escritura.
create extension if not exists pg_net with schema extensions;

/**
 * Dice si una fila es visible para un visitante anónimo.
 *
 * Cada tabla marca "publicado" con su propia columna, así que no alcanza con un
 * OLD.status/NEW.status compartido:
 *   * blog_posts usa status = 'published'
 *   * courses usa is_published — que además es la columna por la que filtran
 *     useCourse y el prerender, mientras que courses.status es un enum aparte
 *     (draft | coming_soon | published). Si el trigger mirara status, un curso
 *     despublicado con is_published=false pero status='published' dispararía
 *     rebuilds de más, y al revés no dispararía ninguno.
 *
 * Recibe la fila como jsonb para no referenciar una columna que la otra tabla
 * no tenga.
 */
create or replace function public.content_row_is_public(table_name text, row_data jsonb)
returns boolean
language sql
immutable
as $$
  select case table_name
    when 'blog_posts' then (row_data ->> 'status') = 'published'
    when 'courses'    then coalesce((row_data ->> 'is_published')::boolean, false)
    else false
  end;
$$;

create or replace function public.trigger_site_rebuild()
returns trigger
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  hook_url text;
  was_public boolean := false;
  is_public boolean := false;
begin
  -- Sólo interesa el contenido visible para un anónimo antes o después del
  -- cambio. Un borrador que se edita diez veces no debería gastar diez builds.
  -- Los if separados evitan tocar OLD en un INSERT (y NEW en un DELETE), que
  -- en plpgsql no están asignados.
  if tg_op <> 'INSERT' then
    was_public := public.content_row_is_public(tg_table_name, to_jsonb(old));
  end if;
  if tg_op <> 'DELETE' then
    is_public := public.content_row_is_public(tg_table_name, to_jsonb(new));
  end if;

  if not (was_public or is_public) then
    return coalesce(new, old);
  end if;

  select decrypted_secret into hook_url
  from vault.decrypted_secrets
  where name = 'vercel_deploy_hook_url'
  limit 1;

  if hook_url is null or hook_url = '' then
    -- Nunca abortamos la escritura por no poder redesplegar: perder el artículo
    -- sería mucho peor que servirlo tarde.
    raise warning 'trigger_site_rebuild: falta el secreto vercel_deploy_hook_url en Vault; no se disparó el rebuild';
    return coalesce(new, old);
  end if;

  -- pg_net es asíncrono: encola el POST y devuelve al instante, así que el
  -- INSERT/UPDATE no queda esperando a Vercel.
  perform net.http_post(
    url := hook_url,
    body := jsonb_build_object(
      'source', 'supabase',
      'table', tg_table_name,
      'op', tg_op,
      'at', now()
    ),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );

  return coalesce(new, old);
end;
$$;

comment on function public.trigger_site_rebuild is
  'Postea al deploy hook de Vercel cuando se publica, edita o borra contenido público (blog_posts, courses), para regenerar el HTML prerenderizado.';

drop trigger if exists blog_posts_rebuild_site on public.blog_posts;
create trigger blog_posts_rebuild_site
after insert or update or delete on public.blog_posts
for each row
execute function public.trigger_site_rebuild();

drop trigger if exists courses_rebuild_site on public.courses;
create trigger courses_rebuild_site
after insert or update or delete on public.courses
for each row
execute function public.trigger_site_rebuild();
