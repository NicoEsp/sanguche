

# Plan: Resolver problemas de indexación en Google Search Console

## Diagnóstico

Google Search Console reporta dos problemas:

1. **"Página alternativa con etiqueta canónica adecuada"** — El `index.html` tiene un `<link rel="canonical" href="https://productprepa.com/" />` hardcodeado. Como es una SPA, TODAS las páginas sirven inicialmente ese mismo HTML. Aunque `Seo.tsx` actualiza el canonical dinámicamente con JavaScript, Google puede leer el canonical estático antes de ejecutar JS, interpretando cada página como "alternativa" de la homepage.

2. **"Página con redirección"** — La ruta `/premium` hace un `<Navigate to="/planes" replace />` del lado del cliente. Google la detecta como redirect.

## Cambios

### 1. Eliminar canonical hardcodeado de `index.html`
- Quitar la línea `<link rel="canonical" href="https://productprepa.com/" />` del HTML estático
- `Seo.tsx` ya crea el `<link rel="canonical">` dinámicamente para cada ruta, así que no se pierde nada

### 2. Eliminar OG tags estáticos duplicados de `index.html`
- Quitar los `og:title`, `og:description`, `twitter:title`, `twitter:description` hardcodeados (líneas 38-41)
- `Seo.tsx` ya los inyecta correctamente por ruta
- Mantener los tags que `Seo.tsx` no sobreescribe si no hay data (og:image, twitter:card, etc.)

### 3. Agregar `/descargables` al mapa de SEO en `routes.ts`
- La ruta `/preguntas` mapea al componente `Descargables` y ya tiene entry en `routes.ts`
- Pero `/descargables` aparece en el sitemap y en Search Console sin canonical propio
- Agregar entry para `/descargables` apuntando canonical a `/preguntas` (o viceversa, según cuál quieras que sea la principal)

### 4. Agregar rutas dinámicas de cursos al SEO
- `CourseDetail.tsx` usa `<Seo>` pero necesito verificar que pase canonical correctamente — ya lo revisé, no pasa canonical explícito, así que hereda el de `index.html` (el problemático)
- Con el fix del punto 1, `Seo.tsx` usará `routeData?.canonical` que será `undefined` para rutas dinámicas como `/cursos/product-management-101`
- Agregar lógica en `CourseDetail.tsx` para pasar `canonical={/cursos/${slug}}` explícitamente

### 5. Limpiar ruta `/premium` del sitemap
- Verificar que `/premium` no esté en el sitemap (no lo está, bien)
- Opcionalmente cambiar de redirect client-side a un entry en el sitemap con canonical a `/planes`

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `index.html` | Quitar canonical hardcodeado y OG tags duplicados |
| `src/seo/routes.ts` | Agregar entry para `/descargables` |
| `src/pages/CourseDetail.tsx` | Agregar prop `canonical` al `<Seo>` |
| `src/pages/Descargables.tsx` | Verificar que usa `<Seo />` correctamente |

## Resultado esperado
- Cada página tendrá un canonical único que apunta a sí misma (no a `/`)
- Google dejará de marcar páginas como "alternativas" de la homepage
- La redirección de `/premium` seguirá funcionando pero no afectará indexación (no está en sitemap)

