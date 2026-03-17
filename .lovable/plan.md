

## Plan: Agregar card "Review de tu Producto" en /planes

### Ubicación

Nueva sección entre el bloque de "Courses Info" (línea 379) y la "Comparison Table" (línea 402). Visualmente separada como una oferta independiente de pago único.

### Implementación

**Archivo:** `src/pages/Planes.tsx`

1. Agregar una nueva `<section>` con una `Card` estilizada de forma diferenciada (borde y fondo con tono distinto a los planes, por ejemplo `border-emerald-500/30 bg-emerald-500/5`) para que se perciba como algo diferente a las suscripciones.

2. **Contenido de la card:**
   - Icono: `Search` o `Eye` de lucide-react (revisión/inspección)
   - Título: "Review de tu Producto"
   - Badge: "Pago único"
   - Copy sugerido (mejorado para claridad y acción):
     > "¿Ya tenés tu propio producto digital? Conseguí una review profesional de punta a punta: UX, propuesta de valor, flujos críticos y oportunidades de mejora. Un pago único, y en 72 hs recibís un documento detallado con hallazgos y recomendaciones accionables."
   - Precio: "Próximamente" (ya que no hay producto en LemonSqueezy todavía)
   - CTA: Botón deshabilitado con texto "Próximamente" o un mailto/link de interés tipo "Quiero saber más" que abra mail a nicoproducto@hey.com

3. **Tracking:** Disparar `product_review_interest_clicked` cuando el usuario clickea el CTA de interés.

4. **Sin cambios en:** constants/plans.ts, edge functions, ni webhook — esto es solo UI exploratoria por ahora.

### Sugerencia de wording

El copy original está bien pero le agregaría especificidad sobre qué se revisa para que el usuario entienda el valor:
> "¿Ya tenés tu propio producto? Pedí una review profesional de punta a punta: UX, propuesta de valor, flujos críticos y oportunidades de mejora. Un pago único — en 72 hs recibís un informe detallado con recomendaciones accionables."

### Resumen

| Archivo | Cambio |
|---|---|
| `src/pages/Planes.tsx` | Nueva section con card de "Review de tu Producto" entre cursos y comparativa |

