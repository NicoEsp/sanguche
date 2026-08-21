-- Dispara un rebuild de Vercel cuando cambia contenido público.
--
-- Por qué hace falta: el HTML de las rutas públicas ahora se genera en build
-- time (scripts/prerender-seo.ts trae los artículos de Supabase y escribe un
-- dist/blog/<slug>/index.html por cada uno). Eso es lo que hace que Google vea
-- el artículo completo, pero también significa que publicar o editar un post ya
-- no se refleja solo: hace falta un deploy nuevo.
--
-- El trigger cubre los dos caminos por los que un artículo se publica:
--   * manual, desde /admin/blog
--   * automático, desde la edge function publish-scheduled-blog (pasa de
--     status='scheduled' a 'published', o sea un UPDATE sobre la misma tabla)
--
-- También cubre `courses`, porque sus URLs entran al sitemap.
--
-- ANTES DE APLICAR: hay que cargar la URL del deploy hook en Vault. Está
-- documentado paso a paso en docs/seo-deploy-hook.md. Si el secreto no existe,
-- el trigger no rompe la escritura: sólo deja un warning en los logs.

-- pg_net ya está instalado en el proyecto (extensions.pg_net). Se declara acá
-- para que la migración sea reproducible en un entorno limpio.
create extension if not exists pg_net with schema extensions;

create or replace function public.trigger_site_rebuild()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, vault
as $$
declare
  hook_url text;
  was_public boolean;
  is_public boolean;
begin
  -- Sólo interesa el contenido visible para un anónimo. Un borrador que se
  -- edita diez veces no debería gastar diez builds.
  was_public := (tg_op <> 'INSERT') and (old.status = 'published');
  is_public  := (tg_op <> 'DELETE') and (new.status = 'published');

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
  perform extensions.net.http_post(
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
