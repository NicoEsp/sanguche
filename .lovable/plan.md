

## Agregar metadata SEO de Productastic Review a la ruta /planes

### Qué se hará

Enriquecer la entrada de `/planes` en `src/seo/routes.ts` para que incluya referencias a Productastic Review en el título y descripción, y agregar un bloque JSON-LD de tipo `Service` que posicione el servicio en buscadores.

### Cambios

**Archivo: `src/seo/routes.ts`**

1. Actualizar el `title` y `description` de la ruta `/planes` para mencionar Productastic Review junto a los planes existentes.
2. Agregar un campo `jsonLd` con schema `Service` para Productastic Review (nombre, descripción, precio USD 50, provider ProductPrepa).

**Archivo: `src/pages/Planes.tsx`** (si no usa `<Seo />` aún)

3. Verificar que el componente `<Seo />` esté presente para que consuma los metadatos automáticamente.

### Ejemplo de JSON-LD a incluir

```json
{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "Productastic Review",
  "description": "Revisión experta de tu proceso de producto: research, hipótesis y decisiones con recomendaciones accionables.",
  "provider": {
    "@type": "Organization",
    "name": "ProductPrepa",
    "url": "https://productprepa.com"
  },
  "offers": {
    "@type": "Offer",
    "price": "50",
    "priceCurrency": "USD",
    "availability": "https://schema.org/PreOrder"
  }
}
```

### Impacto

- Sin nuevas rutas ni componentes.
- Mejora el posicionamiento de "Productastic Review" en búsquedas sin necesidad de landing dedicada.
- Compatible con la estrategia SEO existente (SPA + `Seo.tsx` automático).

