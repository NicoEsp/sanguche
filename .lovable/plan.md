

## Plan de SEO técnico: Sitemap + article:published_time

### 1. Sitemap (supabase/functions/sitemap/index.ts)

**Quitar:**
- `/auth` (no tiene valor SEO, es una pagina de login)

**Agregar:**
- `/autoevaluacion` (priority 0.9, changefreq monthly) -- pagina clave de conversion
- `/descargables` (priority 0.7, changefreq monthly)
- `/mejoras` (priority 0.6, changefreq monthly)

### 2. Routes metadata (src/seo/routes.ts)

**Agregar entrada para `/descargables`:**
- title: "Recursos Descargables | ProductPrepa"
- description: "Descarga guias y recursos practicos para prepararte como Product Manager."
- canonical, keywords, image estandar

### 3. article:published_time en Seo.tsx

**Agregar prop opcional `articlePublishedTime?: string` a SeoProps.**

En el useEffect, cuando `articlePublishedTime` tenga valor, crear/actualizar la meta tag:
```
<meta property="article:published_time" content="2025-01-15T..." />
```

Tambien agregar `article:author` apuntando a ProductPrepa.

### 4. BlogPost.tsx -- pasar published_at al Seo

Agregar `articlePublishedTime={post.published_at}` al componente `<Seo>` que ya esta en BlogPost.tsx.

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/sitemap/index.ts` | Quitar /auth, agregar /autoevaluacion, /descargables, /mejoras |
| `src/seo/routes.ts` | Agregar entrada /descargables |
| `src/components/Seo.tsx` | Agregar prop articlePublishedTime y meta tag article:published_time |
| `src/pages/BlogPost.tsx` | Pasar articlePublishedTime al Seo |

