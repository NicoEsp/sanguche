
## Plan: Limpiar pre-rendering fallido y fortalecer SEO existente

### Contexto

El plugin de Vite para generar HTML estatico por ruta no funciona porque Lovable/Cloudflare siempre sirve el `index.html` raiz (SPA fallback), ignorando los subdirectorios generados. Sin embargo, Google Search Console confirma que Googlebot SI ejecuta el JavaScript y detecta correctamente los datos estructurados inyectados por `Seo.tsx`.

### Cambios propuestos

#### 1. Eliminar el plugin de pre-rendering que no funciona

- Eliminar `vite-plugin-seo-pages.ts`
- Quitar la referencia al plugin en `vite.config.ts`
- Mantener `src/seo/routes.ts` como fuente centralizada de datos SEO

#### 2. Mejorar `Seo.tsx` como fuente unica de meta tags

Actualizar el componente `Seo.tsx` para que use los datos de `src/seo/routes.ts`, creando una fuente unica de verdad para toda la metadata SEO. Esto evita duplicar titles y descriptions en cada pagina individual.

#### 3. Enriquecer el bloque `<noscript>` en `index.html`

Agregar contenido semantico mas rico al bloque `<noscript>` existente con enlaces internos a todas las rutas publicas, descripciones de cada seccion, y palabras clave naturales. Esto ayuda a crawlers que no ejecutan JavaScript (Bing, previews de redes sociales, etc.).

#### 4. Agregar datos estructurados faltantes

Revisar que rutas que aun no tienen JSON-LD lo tengan. Actualmente `/planes` y `/cursos-info` tienen FAQPage y BreadcrumbList. Agregar esquemas relevantes a:
- `/` (Organization + WebSite con SearchAction)
- `/starterpack` (Course o LearningResource)
- `/soy-dev` (WebPage con keywords especificas)

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `vite-plugin-seo-pages.ts` | Eliminar |
| `vite.config.ts` | Quitar import y uso del plugin `seoPages()` |
| `src/seo/routes.ts` | Mantener, posiblemente enriquecer con JSON-LD adicional |
| `src/components/Seo.tsx` | Actualizar para consumir datos de `routes.ts` |
| `index.html` | Enriquecer contenido `<noscript>` |

### Resultado esperado

- Se elimina codigo muerto (plugin que no funciona)
- Se centraliza la gestion de meta tags en un solo lugar
- Se mejora la cobertura de datos estructurados
- Se mantiene el funcionamiento actual que Google ya valida correctamente
