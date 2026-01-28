

## Plan: Corregir Pantalla en Blanco Después de Enviar Evaluación

### Problema
Después de completar y enviar la autoevaluación, la pantalla queda en blanco porque:
- El resultado se guarda en Supabase de forma asíncrona
- La UI cambia a "modo resultados" (`setIsReevaluating(false)`) antes de que el cache de React Query se actualice
- El hook `useAssessmentData()` tiene un `staleTime` de 5 minutos, así que `savedResult` permanece `null`

### Solución
Guardar el resultado calculado en estado local (`localResult`) y mostrarlo inmediatamente, sin esperar la respuesta del servidor.

---

### Cambios en `src/pages/Assessment.tsx`

#### 1. Agregar imports y estado local

```typescript
import { useQueryClient } from '@tanstack/react-query';
import type { AssessmentResult, AssessmentValues } from '@/utils/scoring';

// Dentro del componente:
const queryClient = useQueryClient();
const [localResult, setLocalResult] = useState<AssessmentResult | null>(null);
const [localValues, setLocalValues] = useState<AssessmentValues | null>(null);
```

#### 2. Modificar la función `onSubmit` (líneas 297-347)

Después de calcular el resultado, guardarlo localmente ANTES del guardado async:

```typescript
async function onSubmit(data: AssessmentValues) {
  setIsSaving(true);
  
  try {
    const hasOptionalAnswers = Object.keys(optionalValues).length > 0;
    const result = computeSeniorityScore(data, hasOptionalAnswers ? optionalValues : undefined);
    
    // NUEVO: Guardar resultado localmente para mostrar inmediatamente
    setLocalResult(result);
    setLocalValues(data);
    
    // Guardar en servidor (async)
    await saveAssessment(data, hasOptionalAnswers ? optionalValues : undefined, result, supabase);
    
    // Invalidar cache para sincronizar
    await queryClient.invalidateQueries({ queryKey: ['assessment-data'] });
    
    // ... resto igual (tracking, toast, localStorage cleanup, etc.)
    
    setIsReevaluating(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (error) {
    // Limpiar resultado local en caso de error
    setLocalResult(null);
    setLocalValues(null);
    // ... manejo de error existente
  } finally {
    setIsSaving(false);
  }
}
```

#### 3. Crear variables para resultado efectivo

Agregar antes del return:

```typescript
// Usar resultado local si existe, sino el del servidor
const effectiveResult = localResult || savedResult;
const effectiveValues = localValues || savedValues;
const effectiveHasAssessment = hasAssessment || !!localResult;
```

#### 4. Actualizar condición de renderizado (línea 402)

**Antes:**
```typescript
{!assessmentLoading && hasAssessment && !isReevaluating && savedResult && (
```

**Después:**
```typescript
{!assessmentLoading && effectiveHasAssessment && !isReevaluating && effectiveResult && (
```

#### 5. Reemplazar referencias a `savedResult` y `savedValues`

En el bloque de resultados (líneas 403-516), cambiar:
- `savedResult` → `effectiveResult`
- `savedValues` → `effectiveValues`

#### 6. Limpiar estado local al re-evaluar

En `handleStartReevaluation` (líneas 248-255), agregar:

```typescript
const handleStartReevaluation = () => {
  setIsReevaluating(true);
  setCurrentStep(0);
  setLocalResult(null);  // Limpiar resultado local
  setLocalValues(null);
  localStorage.setItem(ASSESSMENT_IN_PROGRESS_KEY, 'true');
  localStorage.removeItem(ASSESSMENT_PARTIAL_ANSWERS_KEY);
};
```

---

### Flujo Corregido

```text
ANTES (problemático):
Usuario envía → saveAssessment() → setIsReevaluating(false)
                                    ↓
                              savedResult = null
                                    ↓
                              PANTALLA EN BLANCO

DESPUÉS (correcto):
Usuario envía → computeSeniorityScore() → setLocalResult(result)
                                           ↓
                                    setIsReevaluating(false)
                                           ↓
                                    effectiveResult = localResult
                                           ↓
                                    MUESTRA RESULTADOS INMEDIATAMENTE
```

---

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/Assessment.tsx` | Agregar estado local, modificar onSubmit, actualizar renderizado |

### Riesgo
**Muy bajo** - El resultado mostrado es idéntico al guardado en Supabase (viene del mismo `computeSeniorityScore()`). No hay cambios en la lógica de guardado ni en la base de datos.

