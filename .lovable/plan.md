
## Solución: Sitemap estático en `public/sitemap.xml`

### El problema

El custom domain `productprepa.com` apunta al hosting de Lovable, no a Supabase. Por eso, la URL `productprepa.com/functions/v1/sitemap` devuelve el `index.html` de la SPA (HTML) en vez del XML del sitemap. Google Search Console necesita que el sitemap esté en el mismo dominio.

### La solución

Crear un archivo **estático** `public/sitemap.xml` con todas las rutas (estaticas + dinamicas actuales). Al estar en `public/`, Vite lo sirve directamente en `productprepa.com/sitemap.xml`.

### Contenido del sitemap

Se incluiran las 16 URLs actuales:

**12 rutas estaticas:**
- `/` (priority 1.0)
- `/planes`, `/cursos-info`, `/autoevaluacion` (priority 0.9)
- `/preguntas`, `/starterpack`, `/soy-dev`, `/blog` (priority 0.8)
- `/starterpack/build`, `/starterpack/lead`, `/descargables` (priority 0.7)
- `/mejoras` (priority 0.6)

**1 curso publicado:**
- `/cursos/product-management-101`

**3 blog posts publicados:**
- `/blog/como-saber-si-eres-un-buen-product-manager-en-una-startup-y-que-mejorar`
- `/blog/como-prepararse-para-entrevistas-pm`
- `/blog/diferencia-entre-pm-y-po`

### Tambien actualizar `robots.txt`

Agregar la linea `Sitemap: https://productprepa.com/sitemap.xml` al archivo `public/robots.txt` para que los bots lo encuentren automaticamente.

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `public/sitemap.xml` | Crear archivo estatico con las 16 URLs |
| `public/robots.txt` | Agregar referencia al sitemap |

### Importante

Cada vez que publiques un nuevo blog post o curso, hay que actualizar manualmente este archivo (o pedirme que lo haga). La edge function de Supabase sigue funcionando como respaldo si en el futuro se configura un proxy.

### Despues de implementar

1. Publica los cambios
2. Anda a Google Search Console > Sitemaps
3. Envia: `sitemap.xml`
4. Deberia mostrar ~16 URLs descubiertas sin errores
