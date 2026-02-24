
## Eliminar StickyBanner de resultados de evaluacion

### Cambios

1. **`src/pages/SkillGaps.tsx`**: Eliminar la importacion de `StickyBanner` y el bloque JSX que lo renderiza (lineas 68-74 aprox). El evento `handleCtaClick('sticky_banner')` deja de invocarse automaticamente al quitar el componente.

2. **`src/components/StickyBanner.tsx`**: Eliminar el archivo completo, ya que no se usa en ningun otro lugar.

### Lo que NO cambia

- `handleCtaClick` se mantiene porque lo usan otros CTAs en la misma pagina (`contextual_skill_card`, `premium_cta_card`).
- El resto de la pagina de resultados queda intacta.
