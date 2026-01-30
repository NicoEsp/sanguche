
# Plan de Optimización SEO para Conversión en Cursos

## Resumen Ejecutivo

Tras analizar la implementación SEO actual, ProductPrepa tiene una base sólida pero hay oportunidades significativas para mejorar el tráfico orgánico y la conversión hacia cursos.

---

## Lo que ya está bien implementado

| Elemento | Estado |
|----------|--------|
| Meta tags básicos (title, description) | ✅ |
| Open Graph y Twitter Cards | ✅ |
| Canonical URLs | ✅ |
| JSON-LD para cursos (Course schema) | ✅ |
| Sitemap dinámico con cursos | ✅ |
| robots.txt configurado | ✅ |
| Keywords en páginas principales | ✅ |

---

## Oportunidades de Mejora Identificadas

### 1. Agregar FAQPage Schema a páginas clave

**Problema**: Las páginas de cursos y planes no tienen schema FAQ, lo cual es muy valorado por Google para aparecer en rich snippets.

**Solución**: Agregar sección FAQ visible con JSON-LD `FAQPage` en:
- `/cursos-info` - Preguntas frecuentes sobre los cursos
- `/planes` - Preguntas sobre precios y qué incluye cada plan

**Ejemplos de FAQs para cursos**:
- "¿Cuánto dura el curso Estrategia de Producto?"
- "¿Los cursos tienen certificado?"
- "¿Puedo acceder desde móvil?"
- "¿Qué pasa si compro el curso y lanzan nuevos contenidos?"

### 2. Implementar BreadcrumbList Schema

**Problema**: No hay breadcrumbs estructurados, lo cual ayuda a Google a entender la jerarquía del sitio.

**Solución**: Agregar BreadcrumbList JSON-LD a:
- `/cursos-info` → Home > Cursos
- `/cursos/[slug]` → Home > Cursos > [Nombre del Curso]
- `/starterpack/build` → Home > Starter Pack > Build

### 3. Optimizar Keywords para Long-Tail de Cursos

**Problema actual**: Keywords genéricas como "curso product manager"

**Oportunidad**: Keywords long-tail más específicas que convierten mejor:

| Página | Keywords actuales | Keywords sugeridas adicionales |
|--------|-------------------|-------------------------------|
| `/cursos-info` | curso product manager principiantes | "como ser product manager sin experiencia", "curso estrategia de producto online", "formación product manager latinoamérica", "curso PM en español" |
| `/cursos` | cursos product management | "curso product manager gratis", "capacitación PM online", "aprender producto desde cero" |
| `/planes` | precios productprepa | "mentoría product manager precio", "curso PM con tutor", "inversión formación producto" |


### 5. Agregar VideoObject Schema a Cursos

**Problema**: Los cursos tienen videos pero no tienen schema `VideoObject`.

**Solución**: En la página de detalle de cada curso, agregar JSON-LD para cada lección con:
- name, description, thumbnailUrl
- uploadDate, duration
- contentUrl (si es público) o embedUrl

### 6. Mejorar la Página de Autoevaluación para SEO

**Problema actual**: La página `/autoevaluacion` no tiene meta tags optimizados para atraer tráfico orgánico.

**Oportunidad**: Esta es una herramienta gratuita que puede atraer mucho tráfico.

**Cambios sugeridos**:
- Title: "Autoevaluación Product Manager Gratis | Descubre tu nivel PM"
- Description: "Test gratuito de 5 minutos para conocer tu nivel como Product Manager. Identifica tus fortalezas, áreas de mejora y recibe recomendaciones personalizadas."
- Keywords: "test product manager gratis, autoevaluación PM, nivel seniority PM, evaluación habilidades producto"

### 7. Agregar Hreflang para Mercado LATAM/España

**Oportunidad futura**: Si el target es específicamente LATAM, considerar agregar hreflang para diferenciar del español de España:
```html
<link rel="alternate" hreflang="es-AR" href="https://productprepa.com/cursos-info" />
```

### 8. Mejorar Internal Linking hacia Cursos

**Problema**: El flujo de internal links hacia cursos puede mejorar.

**Solución**:
- En página de resultados de autoevaluación → Link directo a curso relevante
- En Starter Pack → Mencionar cursos como siguiente paso
- En Mejoras → Recomendar curso específico según área débil

### 9. Agregar Offer Schema con Precio en Múltiples Monedas

**Mejora para /cursos-info**:
```json
{
  "@type": "Offer",
  "price": "45000",
  "priceCurrency": "ARS",
  "priceValidUntil": "2025-02-15",
  "availability": "https://schema.org/PreOrder",
  "validFrom": "2025-01-15"
}
```

### 10. Optimizar robots.txt con Sitemap URL

**Cambio menor**: Agregar referencia al sitemap en robots.txt:
```
Sitemap: https://productprepa.com/sitemap.xml
```

---

## Priorización por Impacto

| Prioridad | Mejora | Esfuerzo | Impacto SEO |
|-----------|--------|----------|-------------|
| 🔴 Alta | FAQPage Schema en /cursos-info y /planes | Medio | Alto (rich snippets) |
| 🔴 Alta | Optimizar keywords autoevaluación | Bajo | Alto (tráfico orgánico) |
| 🟡 Media | BreadcrumbList Schema | Bajo | Medio |
| 🟡 Media | Keywords long-tail en cursos | Bajo | Medio-Alto |
| 🟡 Media | Agregar Sitemap a robots.txt | Muy bajo | Bajo |
| 🟢 Futura | Blog de contenidos | Alto | Muy alto (largo plazo) |
| 🟢 Futura | VideoObject Schema | Medio | Medio |

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/pages/CursosInfo.tsx` | Agregar sección FAQ visible + FAQPage JSON-LD, mejorar keywords, agregar BreadcrumbList |
| `src/pages/Planes.tsx` | Agregar sección FAQ + FAQPage JSON-LD |
| `src/pages/Assessment.tsx` | Optimizar title, description y keywords para SEO |
| `src/pages/CourseDetail.tsx` | Agregar BreadcrumbList JSON-LD |
| `public/robots.txt` | Agregar línea Sitemap |
| `src/components/Seo.tsx` | (Opcional) Soporte para múltiples schemas más limpio |

---

## Sección Técnica

### FAQPage Schema para /cursos-info

```typescript
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "¿Cuánto dura el curso Estrategia de Producto?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "El curso tiene una duración de 80 minutos, dividido en videos cortos de menos de 10 minutos cada uno para que puedas avanzar a tu ritmo."
      }
    },
    {
      "@type": "Question", 
      "name": "¿Los cursos tienen acceso de por vida?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sí, todos nuestros cursos incluyen acceso de por vida con un único pago. Además, recibirás actualizaciones futuras sin costo adicional."
      }
    },
    {
      "@type": "Question",
      "name": "¿Puedo acceder desde el celular?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sí, la plataforma es 100% responsive y puedes ver los videos y hacer ejercicios desde cualquier dispositivo."
      }
    }
  ]
};
```

### BreadcrumbList Schema

```typescript
const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Inicio",
      "item": "https://productprepa.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Cursos",
      "item": "https://productprepa.com/cursos-info"
    }
  ]
};
```

### Optimización Assessment.tsx

```typescript
<Seo 
  title="Autoevaluación Product Manager Gratis | Descubre tu nivel"
  description="Test gratuito de 5 minutos para conocer tu nivel como Product Manager. Identifica fortalezas, áreas de mejora y recibe un roadmap personalizado."
  canonical="/autoevaluacion"
  keywords="test product manager gratis, autoevaluación PM, nivel seniority PM, evaluación habilidades producto, quiz product manager"
/>
```

### robots.txt actualizado

```
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: *
Allow: /

Sitemap: https://productprepa.com/sitemap.xml
```
