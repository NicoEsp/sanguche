
# Cambiar ícono del item de recursos dedicados

## Cambio

**Archivo**: `src/components/landing/SocialProofStrip.tsx`

Cambiar el ícono `Award` por `Gift` en el item "+20 recursos dedicados exclusivos" para diferenciarlo visualmente del item anterior que también usa `Award`.

### Actualización de imports (línea 1)
```tsx
import { Users, Star, Award, Gift } from 'lucide-react';
```

### Actualización del ícono (línea ~26)
```tsx
<div className="flex items-center gap-2">
  <Gift className="h-5 w-5 text-primary" />
  <span><strong>+20</strong> recursos dedicados exclusivos</span>
</div>
```

## Resultado
Los 4 items tendrán íconos distintos: Users, Star, Award, y Gift.
