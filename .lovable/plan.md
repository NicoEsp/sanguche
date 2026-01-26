

## Plan: Skeleton Loading Específico por Página Destino

### Resumen

Este plan modifica el sistema de skeleton loading durante la redirección para que muestre una animación más específica que coincida con el layout real de cada página destino (`/progreso`, `/mejoras`, `/autoevaluacion`).

---

### Análisis de Layouts Existentes

El proyecto ya tiene skeletons específicos en `src/components/skeletons/`:

| Skeleton | Estructura |
|----------|------------|
| `SkeletonProgress` | Header + 3 columnas (Cards con objetivos) |
| `SkeletonAssessment` | Título + Card con 4 preguntas (radio groups de 5 opciones) |
| `SkeletonMentoria` | Título + Grid 3 columnas + 2 Cards verticales |

**Problema actual**: `LoadingScreen` muestra un skeleton genérico de 3 columnas para todas las páginas, sin importar el destino.

---

### Solución Propuesta

Agregar una prop `destination` al `LoadingScreen` que determine qué skeleton renderizar según la página destino.

---

### Cambios Requeridos

#### 1. Actualizar `LoadingScreen.tsx`

**Agregar nuevo prop `destination`**:

```typescript
interface LoadingScreenProps {
  isFading?: boolean;
  variant?: 'spinner' | 'skeleton';
  destination?: '/progreso' | '/mejoras' | '/autoevaluacion' | null;
}
```

**Importar skeletons específicos**:

```typescript
import SkeletonProgress from "@/components/skeletons/SkeletonProgress";
import SkeletonAssessment from "@/components/skeletons/SkeletonAssessment";
```

**Crear nuevo skeleton para `/mejoras` (SkillGaps)**:

```typescript
const SkeletonMejoras = () => (
  <div className="container mx-auto px-4 py-8 space-y-8">
    {/* Header: Título + descripción */}
    <div className="space-y-3">
      <Skeleton className="h-10 w-3/4 max-w-md" />
      <Skeleton className="h-5 w-1/2 max-w-sm" />
    </div>
    
    {/* Sección: Tus fortalezas */}
    <div className="space-y-4">
      <Skeleton className="h-7 w-40" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-md" />
        ))}
      </div>
    </div>
    
    {/* Sección: Competencias sólidas */}
    <div className="space-y-4">
      <Skeleton className="h-7 w-48" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-20 rounded-md" />
        ))}
      </div>
    </div>
    
    {/* Sección: Áreas de mejora */}
    <div className="space-y-4">
      <Skeleton className="h-7 w-44" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 rounded-md" />
        ))}
      </div>
    </div>
    
    {/* CTAs */}
    <div className="flex gap-3">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-10 w-24" />
    </div>
  </div>
);
```

**Lógica de selección de skeleton**:

```typescript
if (variant === 'skeleton') {
  const renderSkeleton = () => {
    switch (destination) {
      case '/progreso':
        return <SkeletonProgress />;
      case '/autoevaluacion':
        return <SkeletonAssessment />;
      case '/mejoras':
        return <SkeletonMejoras />;
      default:
        // Skeleton genérico como fallback
        return <GenericSkeleton />;
    }
  };

  return (
    <div className={cn("min-h-screen bg-background", isFading && "animate-fade-out")}>
      {renderSkeleton()}
    </div>
  );
}
```

---

#### 2. Actualizar `useHomeRedirect.ts`

**Exponer la variable `destination`** para que `Index.tsx` pueda pasarla al `LoadingScreen`:

```typescript
export function useHomeRedirect() {
  // ... código existente ...
  const [destination, setDestination] = useState<string | null>(null);
  
  useEffect(() => {
    // ... lógica existente ...
    
    // Guardar destino antes de navegar
    setDestination(dest);
    
    setTimeout(() => {
      navigate(dest, { replace: true });
    }, FADE_DURATION);
  }, [/* deps */]);

  return { isRedirecting, isFading, destination };
}
```

---

#### 3. Actualizar `Index.tsx`

**Pasar `destination` al `LoadingScreen`**:

```typescript
const { isRedirecting, isFading, destination } = useHomeRedirect();

if (isRedirecting) {
  return (
    <LoadingScreen 
      isFading={isFading} 
      variant="skeleton" 
      destination={destination as '/progreso' | '/mejoras' | '/autoevaluacion' | null}
    />
  );
}
```

---

### Resumen de Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/components/LoadingScreen.tsx` | Agregar prop `destination`, importar skeletons, lógica de selección |
| `src/hooks/useHomeRedirect.ts` | Exponer `destination` en el return |
| `src/pages/Index.tsx` | Pasar `destination` al `LoadingScreen` |

---

### Flujo Visual Esperado

```text
Usuario Premium se autentica
     ↓
useHomeRedirect determina destination = '/progreso'
     ↓
Index.tsx renderiza <LoadingScreen destination="/progreso" />
     ↓
LoadingScreen muestra SkeletonProgress (3 columnas con cards de objetivos)
     ↓
Fade-out → Navega a /progreso
     ↓
Transición suave porque el skeleton coincide con el layout real
```

---

### Beneficios

1. **Mejor UX percibida**: El skeleton anticipa visualmente el contenido real de la página destino
2. **Transición más suave**: Reducción del "salto" visual entre loading y contenido
3. **Reutilización**: Aprovecha los skeletons existentes del proyecto
4. **Mantenibilidad**: Fácil agregar nuevos destinos en el futuro

