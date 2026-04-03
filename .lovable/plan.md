

## Forzar actualización de imagen OG en redes sociales

### Problema

La imagen fue reemplazada en `public/social-image.png`, pero Twitter y LinkedIn cachean agresivamente las imágenes OG. Como la URL no cambió (`/social-image.png`), siguen mostrando la versión anterior.

### Solución

1. Copiar la nueva imagen con un nombre distinto: `public/og-preview-v2.png`
2. Actualizar todas las referencias en `index.html` (líneas 23 y ~31) para apuntar a `https://productprepa.com/og-preview-v2.png`
3. Actualizar `src/seo/routes.ts` si tiene referencias a la imagen OG

Al cambiar la URL, las plataformas tratarán la imagen como nueva y la descargarán de cero.

### Post-deploy

Después de publicar, validar con:
- https://cards-dev.twitter.com/validator
- https://www.linkedin.com/post-inspector/

