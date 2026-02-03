

# Plan: Separar Precios de Cursos de la Página de Planes

## Resumen del Cambio

**Objetivo**: Diferenciar claramente los planes de suscripción (mentoría) de los productos de cursos, moviendo toda la información de precios de cursos a `/cursos-info` y dejando `/planes` enfocada únicamente en las suscripciones.

---

## Estado Actual

| Página | Contenido actual |
|--------|------------------|
| `/planes` | 3 planes de suscripción + 2 tarjetas de cursos con precios + tabla comparativa |
| `/cursos-info` | Curso destacado con precio + curso gratuito + próximos cursos + FAQ |

**Problema**: Mezclar ambos en `/planes` confunde el valor de cada propuesta y diluye el mensaje de los planes de suscripción.

---

## Propuesta de Arquitectura

### `/planes` - Solo Suscripciones

1. **Mantener**: Gratuito, Premium, RePremium
2. **Eliminar**: Sección "Cursos Especializados" con tarjetas de precios
3. **Agregar al final**: Un bloque informativo sobre cursos (sin precios)

### `/cursos-info` - Hub de Cursos

1. **Mantener**: Todo el contenido actual
2. **Agregar**: 
   - Tarjeta prominente de "Todos los Cursos" con precio
   - Tabla comparativa de opciones de compra de cursos
   - Upgrade CTAs para usuarios con `curso_estrategia`

---

## Sugerencia: Bloque de Cursos en `/planes`

En lugar de mostrar precios de cursos, agregaría un bloque informativo elegante al final de los planes:

```
┌─────────────────────────────────────────────────────────────┐
│  📚 ¿También te interesan nuestros cursos?                 │
│                                                             │
│  Además de los planes de suscripción, ofrecemos cursos     │
│  especializados con acceso de por vida.                     │
│                                                             │
│  • Curso individual o bundle completo                       │
│  • Los usuarios RePremium ya tienen acceso incluido         │
│                                                             │
│  [Ver cursos disponibles →]                                 │
└─────────────────────────────────────────────────────────────┘
```

**Beneficios**:
- Refuerza que RePremium incluye cursos (incentivo a esa suscripción)
- No compite visualmente con los planes de suscripción
- Mantiene el funnel: usuarios que buscan cursos van a `/cursos-info`

---

## Cambios en `/cursos-info`

### Agregar sección "Opciones de Compra"

Después del curso destacado, agregar una sección clara con las opciones:

| Opción | Precio | Incluye |
|--------|--------|---------|
| Curso individual | $49.000 | Estrategia de Producto |
| Todos los Cursos | $75.000 | Actuales + futuros |
| RePremium | $120.000/mes | Cursos + mentoría + todo |

Con CTAs directos de compra para cada opción.

### Mover lógica de upgrade

Los CTAs de upgrade que estaban en `/planes` para usuarios de cursos se mueven a `/cursos-info`:

```tsx
{hasCursoEstrategia && !hasCursosAll && !hasActiveRePremium && (
  <UpgradeBanner 
    options={["cursos_all", "repremium"]}
  />
)}
```

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/pages/Planes.tsx` | Eliminar sección cursos, agregar bloque informativo, actualizar tabla comparativa |
| `src/pages/CursosInfo.tsx` | Agregar sección de opciones de compra, tabla comparativa, upgrade CTAs |

---

## Sección Técnica

### Planes.tsx - Nuevo bloque informativo

```tsx
{/* Courses Info Block - Replaces course cards */}
<section className="px-4 py-8">
  <div className="max-w-4xl mx-auto">
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
        <div className="flex-shrink-0">
          <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-2">¿También te interesan nuestros cursos?</h3>
          <p className="text-muted-foreground mb-4">
            Además de los planes de suscripción, ofrecemos cursos especializados 
            con acceso de por vida. Comprá un curso individual o el bundle completo.
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            <strong>Tip:</strong> Los usuarios RePremium ya tienen acceso a todos los cursos incluido.
          </p>
          <Button asChild>
            <Link to="/cursos-info">
              Ver cursos disponibles
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  </div>
</section>
```

### Planes.tsx - Elementos a eliminar

- Líneas 404-411: Divider "O compra acceso a cursos"
- Líneas 413-506: Sección completa "Cursos Especializados" con ambas PlanCards y CTAs de upgrade
- Actualizar schema JSON-LD para remover ofertas de cursos (solo mantener Premium y RePremium)
- En tabla comparativa: mantener referencia a cursos pero sin precios

### CursosInfo.tsx - Nueva sección de opciones de compra

```tsx
{/* Pricing Options Section */}
<section className="px-4 py-12 bg-muted/30">
  <div className="max-w-4xl mx-auto">
    <h2 className="text-2xl font-bold text-center mb-2">Opciones de compra</h2>
    <p className="text-center text-muted-foreground mb-8">
      Elige la opción que mejor se adapte a tus necesidades
    </p>
    
    <div className="grid md:grid-cols-3 gap-6">
      {/* Curso individual */}
      <Card className="p-6 text-center">
        <BookOpen className="w-8 h-8 text-primary mx-auto mb-4" />
        <h3 className="font-bold mb-2">Curso Individual</h3>
        <p className="text-2xl font-bold mb-1">{curso_estrategia.formatted}</p>
        <p className="text-sm text-muted-foreground mb-4">pago único</p>
        <ul className="text-sm text-left space-y-2 mb-6">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            Estrategia de Producto
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            Acceso de por vida
          </li>
        </ul>
        <LemonSqueezyCheckout plan="curso_estrategia" buttonText="Comprar curso" />
      </Card>
      
      {/* Todos los cursos */}
      <Card className="p-6 text-center border-primary bg-primary/5 relative">
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Mejor valor</Badge>
        <Sparkles className="w-8 h-8 text-amber-500 mx-auto mb-4" />
        <h3 className="font-bold mb-2">Todos los Cursos</h3>
        <p className="text-2xl font-bold mb-1">{cursos_all.formatted}</p>
        <p className="text-sm text-muted-foreground mb-4">pago único</p>
        <ul className="text-sm text-left space-y-2 mb-6">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            Todos los cursos actuales
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            Cursos futuros incluidos
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            Acceso de por vida
          </li>
        </ul>
        <LemonSqueezyCheckout plan="cursos_all" buttonText="Comprar bundle" />
      </Card>
      
      {/* RePremium */}
      <Card className="p-6 text-center">
        <Crown className="w-8 h-8 text-amber-500 mx-auto mb-4" />
        <h3 className="font-bold mb-2">Con Mentoría</h3>
        <p className="text-2xl font-bold mb-1">{repremium.formatted}</p>
        <p className="text-sm text-muted-foreground mb-4">/mes</p>
        <ul className="text-sm text-left space-y-2 mb-6">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            Todos los cursos incluidos
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            2 sesiones mensuales 1:1
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            Career Path personalizado
          </li>
        </ul>
        <LemonSqueezyCheckout plan="repremium" buttonText="Suscribirse" />
      </Card>
    </div>
    
    {/* Upgrade CTA for curso_estrategia users */}
    {hasCursoEstrategia && !hasCursosAll && !hasActiveRePremium && (
      <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="font-medium">Ya tenés el curso Estrategia de Producto</p>
            <p className="text-sm text-muted-foreground">¿Querés acceder a todos los cursos actuales y futuros?</p>
          </div>
          <LemonSqueezyCheckout 
            plan="cursos_all" 
            buttonText="Upgrade a Todos los Cursos"
            variant="default"
          />
        </div>
      </div>
    )}
  </div>
</section>
```

### Hooks necesarios en CursosInfo.tsx

Agregar imports y hooks que faltan:

```tsx
import { useSubscription } from "@/hooks/useSubscription";
import { Crown } from "lucide-react";

// Dentro del componente:
const { 
  hasActiveRePremium, 
  hasCursoEstrategia, 
  hasCursosAll 
} = useSubscription();
```

---

## Resultado Final

| Página | Contenido |
|--------|-----------|
| `/planes` | Planes de suscripción + bloque informativo de cursos (sin precios) |
| `/cursos-info` | Curso destacado + opciones de compra con precios + upgrade CTAs |

**Beneficios**:
1. Propuestas de valor claramente diferenciadas
2. Usuarios que buscan mentoría ven solo planes de suscripción
3. Usuarios que buscan cursos tienen una página dedicada con todas las opciones
4. El bloque en `/planes` funciona como cross-sell sin competir visualmente

