

## Plan de Verificación y Corrección de Accesos

### 1. Investigar el caso del usuario RePremium

El código parece correcto para RePremium. Necesitamos verificar el caso específico del usuario que reporta problemas.

**Verificar en DB:**
```sql
SELECT 
  p.id, p.name, p.email, p.mentoria_completed,
  us.plan, us.status, us.purchase_type
FROM profiles p
JOIN user_subscriptions us ON us.user_id = p.id
WHERE p.email = '[EMAIL_DEL_USUARIO]';
```

**Posibles causas:**
- El status de la suscripción no es 'active'
- El plan no es exactamente 'repremium' (typo, mayúsculas, etc.)
- Cache del navegador mostrando datos antiguos

### 2. Corregir la Edge Function para `curso_estrategia`

**Archivo:** `supabase/functions/get-resource-access/index.ts`

**Cambio propuesto:** Remover `curso_estrategia` del array de planes premium

```typescript
// ANTES (actual)
const PREMIUM_PLANS = ['premium', 'repremium', 'cursos_all', 'curso_estrategia'];

// DESPUÉS (corregido)
const PREMIUM_PLANS = ['premium', 'repremium'];
```

**Razonamiento:** 
- Los usuarios de `curso_estrategia` pagan por el curso únicamente
- Los recursos premium del Starter Pack son parte de la oferta Premium/RePremium
- El plan `cursos_all` también es solo cursos, no debería incluir recursos premium

**Nuevo código propuesto:**
```typescript
// Planes con acceso a recursos premium del Starter Pack
// Solo premium y repremium tienen este beneficio
const PREMIUM_PLANS = ['premium', 'repremium'];
```

### 3. Matriz Final de Accesos

| Funcionalidad | Free | Curso Estrategia | Cursos All | Premium | RePremium |
|--------------|------|------------------|------------|---------|-----------|
| Autoevaluación | ✅ | ✅ | ✅ | ✅ | ✅ |
| Áreas de Mejora | ✅ | ✅ | ✅ | ✅ | ✅ |
| Curso Estrategia | ❌ | ✅ | ✅ | ❌ | ✅ |
| Todos los Cursos | ❌ | ❌ | ✅ | ❌ | ✅ |
| Mentoría | ❌ | ❌ | ❌ | ✅ | ✅ |
| Career Path | ❌ | ❌ | ❌ | ✅ | ✅ |
| Recursos Premium SP | ❌ | ❌ | ❌ | ✅ | ✅ |

### 4. Actualizar `src/constants/plans.ts`

Agregar comentarios más claros sobre qué planes tienen acceso a qué:

```typescript
// Planes con acceso a mentoría, career path, y recursos premium del Starter Pack
export const PREMIUM_PLANS = ['premium', 'repremium'] as const;

// Planes con acceso a cursos (total o parcial)
export const COURSE_PLANS = ['curso_estrategia', 'cursos_all', 'repremium'] as const;

// Todos los planes pagos (útil para verificar si es usuario de pago)
export const ALL_PAID_PLANS = ['premium', 'repremium', 'curso_estrategia', 'cursos_all'] as const;
```

### 5. Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/get-resource-access/index.ts` | Remover `curso_estrategia` y `cursos_all` del array PREMIUM_PLANS |

### Sección Técnica

La corrección consiste en una sola línea en la edge function. El array actual:
```typescript
const PREMIUM_PLANS = ['premium', 'repremium', 'cursos_all', 'curso_estrategia'];
```

Debe ser:
```typescript
const PREMIUM_PLANS = ['premium', 'repremium'];
```

Esto asegura que solo los usuarios con planes Premium o RePremium puedan acceder a recursos marcados como `access_level: 'premium'` en la tabla `resources`.

