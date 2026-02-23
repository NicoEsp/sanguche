

## Programar publicación de artículos del blog

### Resumen

Agregar la posibilidad de programar la publicación de artículos del blog desde `/admin/blog`. Cuando un post se marca como "Programado" con una fecha futura, permanece invisible para los visitantes hasta que un cron job lo publique automáticamente.

Google no penaliza las publicaciones programadas. Es una práctica estándar en todos los CMS (WordPress, Ghost, etc.). Google indexa el contenido cuando lo encuentra publicado, sin importar el mecanismo.

---

### Cambios necesarios

#### 1. Base de datos

Agregar el valor `scheduled` como estado válido en `blog_posts.status`. Actualmente acepta `draft` y `published`; se agrega `scheduled`.

Agregar columna `scheduled_at` (timestamp with time zone, nullable) para guardar la fecha/hora programada.

#### 2. Admin UI (`src/pages/admin/AdminBlog.tsx`)

- Agregar opción "Programado" al selector de estado
- Mostrar un campo de fecha/hora (datetime-local input) cuando el estado es `scheduled`
- Guardar `scheduled_at` junto con el post
- Mostrar badge "Programado" en la tabla con la fecha/hora
- Validar que si el estado es `scheduled`, la fecha sea futura

#### 3. Edge Function: `publish-scheduled-blog`

Nueva edge function (similar a `publish-scheduled-courses`) que:
- Busca posts con `status = 'scheduled'` y `scheduled_at <= now()`
- Los actualiza a `status = 'published'` y setea `published_at = scheduled_at`
- Loguea cuantos posts publicó

#### 4. Cron Job

Configurar un cron job en Supabase (via `pg_cron` + `pg_net`) que llame a la edge function cada 5 minutos.

#### 5. Query pública (BlogList)

No necesita cambios. Ya filtra por `status = 'published'`, asi que los posts programados no se muestran hasta que el cron los publique.

#### 6. RLS

No necesita cambios. La policy pública ya filtra por `status = 'published'`, y la policy de admin permite ALL. Los posts `scheduled` solo son visibles para el admin.

---

### Archivos a crear/modificar

| Archivo | Accion |
|---------|--------|
| Migracion SQL | Agregar `scheduled` como status valido y columna `scheduled_at` |
| `src/pages/admin/AdminBlog.tsx` | Agregar UI de programacion (selector + datetime picker) |
| `supabase/functions/publish-scheduled-blog/index.ts` | Nueva edge function para publicar posts programados |
| `supabase/config.toml` | Registrar la nueva edge function |
| SQL (insert tool) | Crear cron job que ejecute la edge function cada 5 minutos |

---

### Flujo del usuario

1. Crea un post en el admin
2. Selecciona estado "Programado"
3. Elige fecha y hora de publicacion
4. Guarda el post
5. El post queda invisible para visitantes
6. Cada 5 minutos el cron revisa si hay posts para publicar
7. Cuando llega la hora, se publica automaticamente

---

### Nota sobre el sitemap

Cuando un post se publique (manual o programado), hay que actualizar `public/sitemap.xml` manualmente pidiendome que lo haga, ya que es un archivo estatico.
