# Rebuild automático al publicar o editar contenido

El HTML de los artículos y de los cursos se genera **en build time**
(`scripts/prerender-seo.ts`). Eso es lo que hace que Googlebot vea el contenido
sin ejecutar JS, pero también significa que publicar ya no alcanza: hace falta un
deploy. Estos pasos lo dejan automático.

## 1. Crear el Deploy Hook en Vercel

**Settings → Git → Deploy Hooks**, branch `main`. Copiá la URL:

```
https://api.vercel.com/v1/integrations/deploy/prj_XXXXXXXX/YYYYYYYY
```

Es un secreto operativo (permite disparar builds, no leer nada). No lo pongas en
el repo.

## 2. Guardarla en Supabase Vault

En el SQL Editor, con tu URL:

```sql
select vault.create_secret(
  'https://api.vercel.com/v1/integrations/deploy/prj_XXXXXXXX/YYYYYYYY',
  'vercel_deploy_hook_url',
  'Deploy hook de Vercel para regenerar el HTML prerenderizado'
);
```

Para rotarla más adelante: `vault.update_secret((select id from vault.secrets
where name = 'vercel_deploy_hook_url'), '<nueva-url>')`.

## 3. Aplicar la migración

```bash
supabase db push
```

`supabase/migrations/20260820234500_rebuild_site_on_content_change.sql` crea un
trigger sobre `blog_posts` y `courses` que postea al hook vía `pg_net`. Sólo
dispara cuando el contenido es público antes o después del cambio, así que
editar un borrador diez veces no gasta diez builds. Cubre tanto la publicación
manual desde `/admin/blog` como la automática de `publish-scheduled-blog`, que
es un UPDATE sobre la misma tabla.

Si el secreto no está cargado deja un `warning` en los logs pero **no** aborta la
escritura: perder el artículo sería peor que publicarlo tarde.

## 4. Variables de entorno del build

En Vercel, **Settings → Environment Variables**, scope Production y Preview:

| Variable | Valor |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://lgscevufwnetegglgpnw.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | la anon key del proyecto |

Son las mismas que usa el cliente: el prerender lee lo que ve un visitante
anónimo bajo la RLS que ya existe, sin service role. Si faltan, el build **falla
a propósito** — seguir sin datos publicaría el blog vacío, que es el problema que
esto viene a resolver.

## Probar

```sql
-- Postgres no acepta LIMIT en UPDATE: hay que elegir la fila en un subselect.
update blog_posts
set updated_at = now()
where id = (select id from blog_posts where status = 'published' limit 1);
```

Después, `select status_code, url from net._http_response order by created desc
limit 3;` tiene que mostrar un 201 contra `api.vercel.com`, y en Vercel aparece
un deploy con source `Deploy Hook`. Cuando termina:

```bash
curl -s https://productprepa.com/blog/<slug> | grep -c "<h1"
```

## La ventana entre publicar y desplegar

Entre publicar y que termine el build hay uno o dos minutos en los que la URL
funciona (el SPA la renderiza desde Supabase) pero los meta tags son los
genéricos del sitio. Si compartís el link en redes justo ahí, el preview sale
genérico. En la práctica: publicá, esperá el deploy, después compartí.

> Antes esto lo tapaba `middleware.ts`, un Edge Middleware que en cada request de
> `/blog/:slug` consultaba Supabase y reescribía los meta del shell. Se eliminó
> porque el prerender lo reemplaza: genera meta **y** contenido para todos los
> artículos. Además, al correr antes que el filesystem, habría interceptado las
> páginas prerenderizadas y servido el shell sin contenido.
