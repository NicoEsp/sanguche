
## Plan: Actualizar Sección de Planes en Landing Page

### Situación Actual
La landing page (`src/pages/Index.tsx`) muestra solo **2 planes**: Gratis y Premium. La página `/planes` ya tiene los **3 planes** con su estructura y beneficios actualizados.

### Cambios a Realizar

#### 1. Restructurar la sección "Free vs Premium" → "Nuestros Planes"

**Ubicación:** Líneas 168-257 de `src/pages/Index.tsx`

**Cambios:**
- Título: "Todo lo que necesitas para crecer" → "Elige tu plan"
- Layout: Grid de 2 columnas → Grid de 3 columnas (responsivo)
- Agregar el plan **RePremium** con sus beneficios específicos

#### 2. Estructura de los 3 Planes

| Plan | Precio | Beneficios Clave |
|------|--------|------------------|
| **Gratis** | $0/mes | Autoevaluación, áreas de mejora, recursos introductorios |
| **Premium** | $50.000/mes | Todo gratis + 1 sesión mensual 1:1, Career Path, Starter Pack |
| **RePremium** | $120.000/mes | Todo Premium + 2 sesiones 1:1, acceso completo a Cursos |

#### 3. Agregar botón "Ver más detalles"
- Ubicación: Después de las cards de planes
- Enlace a `/planes`
- Estilo: Botón outline con ícono ArrowRight

### Diseño Visual

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                         Elige tu plan                                      │
│    Desde autoevaluación gratuita hasta mentoría y cursos especializados   │
├────────────────────┬────────────────────┬────────────────────────────────┤
│                    │                    │                                  │
│   🥪 Gratis        │   ⭐ Premium       │   👑 RePremium                   │
│   $0/mes           │   $50.000/mes      │   $120.000/mes                   │
│                    │   (+35 usuarios)   │   (Nuevo)                        │
│   ✓ Autoevaluación │   ✓ Todo Gratis    │   ✓ Todo Premium                 │
│   ✓ Áreas mejora   │   ✓ 1 sesión 1:1   │   ✓ 2 sesiones 1:1               │
│   ✓ Recursos intro │   ✓ Career Path    │   ✓ Acceso a Cursos              │
│   ✓ PDFs gratis    │   ✓ Starter Pack   │   ✓ Feedback personalizado       │
│                    │                    │                                  │
│   [Comenzar]       │   [Suscribirse]    │   [Suscribirse]                  │
├────────────────────┴────────────────────┴────────────────────────────────┤
│                                                                            │
│                    [ Ver más detalles → ]                                  │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘
```

### Código a Modificar

**Archivo:** `src/pages/Index.tsx`

**1. Agregar imports necesarios:**
```typescript
import { Crown } from "lucide-react";
```

**2. Agregar hook de pricing para RePremium:**
```typescript
const { premium, repremium, loading: pricingLoading } = usePricing();
```

**3. Definir beneficios de RePremium:**
```typescript
const repremiumBenefits = [
  "Todo lo incluido en Premium",
  <>2 sesiones mensuales 1:1 con NicoProducto</>,
  "Acceso completo a todos los Cursos",
  "Feedback personalizado en ejercicios",
  "Acceso prioritario a nuevos contenidos"
];
```

**4. Actualizar la sección de planes (líneas 168-257):**
- Cambiar grid de `md:grid-cols-2` a `md:grid-cols-3`
- Agregar tercera card para RePremium
- Actualizar título y descripción
- Agregar botón "Ver más detalles" al final

**5. Ajustes responsivos:**
- En móvil: Stack vertical de las 3 cards
- En tablet/desktop: 3 columnas

### Detalles Técnicos

#### Card de Gratis (simplificada)
- Mantener beneficios actuales
- Botón: "Comenzar gratis" → `/auth`

#### Card de Premium
- Badge: "+35 usuarios activos"
- Border destacado: `border-primary`
- Usar `LemonSqueezyCheckout` con `plan="premium"`

#### Card de RePremium
- Badge: "Nuevo" con variant especial
- Ícono: `Crown` en color amber
- Usar `LemonSqueezyCheckout` con `plan="repremium"`

#### Botón "Ver más detalles"
```tsx
<div className="flex justify-center mt-8">
  <Button asChild variant="outline" size="lg">
    <Link to="/planes">
      Ver más detalles
      <ArrowRight className="ml-2 h-4 w-4" />
    </Link>
  </Button>
</div>
```

### Riesgo
**Bajo** - Son cambios visuales y de estructura en la landing page. No afectan la lógica de checkout ni otras funcionalidades.
