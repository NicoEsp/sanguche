

## Recuperar el detalle de Productastic Review y mejorar el CTA

### Problema

Al reemplazar el botón por el checkout directo, se perdió el contenido rico del modal: "Qué se revisa", "Qué NO es esto" y "Cómo funciona". Además, "Pagar USD 50" es un CTA frío y transaccional.

### Solución

Convertir el flujo en dos pasos: el botón de la card abre el modal existente (`ProductReviewModal`) con todo el detalle, pero **reemplazando el formulario de waitlist** al final por el componente `LemonSqueezyCheckout` con un CTA más atractivo.

### Cambios

**1. `src/pages/Planes.tsx`**
- Volver a conectar el botón de la card al modal: reemplazar `<LemonSqueezyCheckout>` por un `<Button>` que haga `setReviewModalOpen(true)` con texto "Quiero mi review".

**2. `src/components/planes/ProductReviewModal.tsx`**
- Actualizar el paso "Cómo funciona" para reflejar el flujo directo (sin lista de espera): 1. Pagás, 2. Te contacto para coordinar materiales, 3. En 72 hs recibís el informe.
- Reemplazar el formulario de waitlist (líneas 143-171) por `<LemonSqueezyCheckout>` con CTA "Quiero mi review. USD 50" y el mismo estilo esmeralda.
- Importar `LemonSqueezyCheckout`.

### CTA final

El botón en la card dirá **"Quiero mi review"** (invita a explorar). El botón dentro del modal dirá **"Solicitar mi review. USD 50"** (cierra la venta con contexto).

