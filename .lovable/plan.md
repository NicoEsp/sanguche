

## Agregar verificación de Google Search Console

Google Search Console usa un archivo HTML estático para verificar la propiedad del dominio. El archivo `google4beffc2ecb55af49.html` debe servirse en la raíz del sitio.

### Cambio

| Archivo | Acción |
|---------|--------|
| `public/google4beffc2ecb55af49.html` | Copiar el archivo de verificación al directorio `public/` |

Al estar en `public/`, Vite lo sirve tal cual en `https://productprepa.com/google4beffc2ecb55af49.html`, que es exactamente lo que Google Search Console espera encontrar.

### Después de implementar

1. Publicá los cambios
2. Volvé a Google Search Console y hacé clic en **Verificar**
3. Una vez verificado, andá a **Sitemaps** y enviá: `https://productprepa.com/functions/v1/sitemap`

