

## Plan: Pre-rendering para SEO con Dynamic Rendering

### Problema actual

La app es una SPA pura (React + Vite). Los meta tags se inyectan via JavaScript en `Seo.tsx` usando `useEffect`, lo que significa que cuando Googlebot u otros crawlers visitan la pagina, pueden no ver los meta tags correctos ni el contenido de la pagina.

### Estrategia: Dynamic Rendering via Edge Function

Crear una Edge Function que actue como "pre-renderer". Cuando un bot (Googlebot, Bingbot, etc.) visita una URL publica, la funcion devuelve HTML estatico con todos los meta tags, JSON-LD y contenido visible ya incluidos. Los usuarios humanos siguen recibiendo la SPA normal.

Google recomienda oficialmente este patron para SPAs: https://developers.google.com/search/docs/crawling-indexing/javascript/dynamic-rendering

### Paginas a pre-renderizar (publicas, no protegidas)

| Ruta | Prioridad SEO |
|------|--------------|
| `/` | Alta - Landing principal |
| `/planes` | Alta - Conversion |
| `/cursos-info` | Alta - Conversion |
| `/starterpack` | Media - Contenido educativo |
| `/starterpack/build` | Media |
| `/starterpack/lead` | Media |
| `/soy-dev` | Media - Nicho especifico |
| `/preguntas` | Media - Descargables |
| `/cursos/:slug` | Alta - Dinamica, requiere DB |

---

### Implementacion tecnica

#### 1. Nueva Edge Function: `supabase/functions/prerender/index.ts`

La funcion recibe la ruta como query param, valida si es bot, y retorna HTML completo:

```
GET /prerender?path=/planes
```

Logica interna:
- Mapa de rutas estaticas con sus meta tags (title, description, canonical, OG, JSON-LD)
- Para `/cursos/:slug`: consulta a Supabase para obtener titulo, descripcion del curso
- Genera HTML completo con `<head>` poblado y `<body>` con contenido semantico basico (h1, p, links)
- Si la ruta no existe o no es bot: redirige a la SPA normal

#### 2. Modificar `index.html` - Agregar snippet de deteccion de bot

No aplica directamente en `index.html` ya que se sirve estaticamente. En su lugar, la redireccion de bots se configura a nivel de hosting/CDN.

**Alternativa viable en Lovable:** Dado que no tenemos control del servidor web (Lovable/Cloudflare sirve los archivos estaticos), la estrategia se implementa de forma diferente:

#### Estrategia adaptada: Meta Tag Injection en Build Time

En lugar de dynamic rendering (que requiere control del servidor), usaremos **vite-plugin-prerender** o un enfoque custom:

**Opcion A - Plugin de Vite para generar HTML estatico por ruta:**

Crear un plugin de Vite que en build time genere archivos HTML individuales para cada ruta publica, cada uno con los meta tags correctos ya incluidos en el HTML. Esto funciona porque Lovable/Cloudflare sirve archivos estaticos y respeta rutas con `index.html`.

Estructura generada:
```
dist/
  index.html          (landing /)
  planes/index.html   (meta tags de /planes)
  cursos-info/index.html
  starterpack/index.html
  soy-dev/index.html
  preguntas/index.html
```

Cada archivo contiene el mismo bundle JS pero con meta tags unicos en el `<head>`.

**Opcion B - Edge Function como proxy de pre-rendering (recomendada):**

Crear una edge function `prerender` que:
1. Recibe `path` y `user-agent`
2. Si es bot: devuelve HTML completo con meta tags, contenido semantico y JSON-LD
3. Si no es bot: devuelve redirect al SPA

Pero esto requiere que el DNS/CDN redirija bots a la edge function, lo cual no controlamos en Lovable.

### Recomendacion final: Opcion A (Plugin de Vite)

Es la unica opcion que funciona al 100% dentro de las limitaciones de Lovable (sin control de servidor, sin SSR).

#### Cambios concretos:

**1. Crear `vite-plugin-seo-pages.ts`** (en raiz del proyecto)

Plugin custom de Vite que durante el build:
- Define un mapa de rutas publicas con sus meta tags
- Para cada ruta, copia el `index.html` base y reemplaza los meta tags del `<head>` con los especificos de esa ruta
- Escribe los archivos en `dist/{ruta}/index.html`

**2. Actualizar `vite.config.ts`**

Importar y registrar el plugin.

**3. Crear `src/seo/routes.ts`**

Archivo centralizado con la definicion SEO de cada ruta publica:
```typescript
export const SEO_ROUTES = {
  '/': {
    title: 'ProductPrepa - Plataforma para crecer en Producto',
    description: 'Aprendé Producto en una plataforma que combina Cursos...',
    canonical: 'https://productprepa.com/',
    jsonLd: { /* schema existente */ }
  },
  '/planes': {
    title: 'Planes y Precios | ProductPrepa',
    description: '...',
    canonical: 'https://productprepa.com/planes',
  },
  // ... cada ruta publica
}
```

**4. Actualizar cada pagina** para importar sus meta tags desde `SEO_ROUTES` (opcional, para mantener single source of truth con `Seo.tsx`)

#### Para rutas dinamicas (`/cursos/:slug`)

Las rutas dinamicas no se pueden pre-renderizar en build time sin conocer los slugs. Opciones:
- Consultarlas en build time (requiere acceso a Supabase en CI, complejo)
- Dejarlas con el `Seo.tsx` actual (Googlebot moderno ejecuta JS razonablemente bien para paginas individuales)
- Crear una edge function especifica `prerender-course` que se linkea desde el sitemap

### Riesgo y mitigacion

- **Riesgo:** Cloudflare/Lovable podria no respetar los subdirectorios con `index.html` y siempre servir el root `index.html` (SPA fallback)
- **Mitigacion:** Probar con un deploy y verificar con `curl` que `/planes` sirve el HTML correcto. Si no funciona, la alternativa es usar el tag `<meta>` approach actual mejorado con `noscript` content mas rico por pagina.

### Alcance estimado

- 1 archivo nuevo: `vite-plugin-seo-pages.ts`
- 1 archivo nuevo: `src/seo/routes.ts`
- 1 archivo modificado: `vite.config.ts`
- Sin impacto en el comportamiento actual de la app para usuarios humanos

