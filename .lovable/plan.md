## Plan: Productastic Review — nueva card + modal waitlist

### Cambios en la card existente (src/pages/Planes.tsx)

1. **Renombrar** "Review de tu Producto" → "Productastic Review"
2. **Pricing**: mostrar USD 100 tachado + USD 50 destacado + sub-label "precio de lanzamiento"
3. **Reescribir el copy** basado en el feedback del usuario — enfocar en revisión de research, hipótesis y decisiones de producto (no "opinión sobre el producto"):
  - Descripción: "¿Tomaste decisiones de producto y querés validarlas con alguien externo? Reviso tu research, hipótesis y decisiones hasta acá No opino sobre tu producto porqué si, analizo tu proceso de construcción."
  - Features actualizadas:
    - "Revisión de tu research y hallazgos clave"
    - "Análisis de hipótesis y decisiones de producto"
    - "Feedback sobre flujos críticos y priorización"
    - "Informe detallado en 72 hs"
    - "Recomendaciones accionables paso a paso"
4. **CTA "Quiero saber más"** → abre un modal en vez de mailto

### Nuevo componente: ProductReviewModal

**Archivo:** `src/components/planes/ProductReviewModal.tsx`

Un Dialog que contiene:

- Título "Productastic Review" con badge "Precio de lanzamiento"
- Explicación expandida del servicio (qué se revisa, qué NO se revisa, cómo funciona)
- Pricing visible (USD 100 → USD 50)
- Formulario de waitlist: solo campo de email + botón "Anotarme en la lista de espera"
- Al submit: inserta en una nueva tabla `product_review_waitlist` y dispara evento de tracking `productastic_review_waitlist_joined`
- Toast de confirmación

### Nueva tabla en Supabase

**Tabla:** `product_review_waitlist`

- `id` uuid PK default gen_random_uuid()
- `email` text NOT NULL
- `user_id` uuid nullable (si está logueado, se asocia)
- `created_at` timestamptz default now()

RLS: admin SELECT all, service_role ALL, authenticated INSERT own (con user_id = profile id), anon denied.

### Resumen de archivos


| Archivo                                        | Cambio                                                                                   |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `src/pages/Planes.tsx`                         | Card renombrada, pricing actualizado, copy reescrito, botón abre modal, import del modal |
| `src/components/planes/ProductReviewModal.tsx` | Nuevo componente con detalle + formulario email waitlist                                 |
| Migration SQL                                  | Tabla `product_review_waitlist` con RLS                                                  |
