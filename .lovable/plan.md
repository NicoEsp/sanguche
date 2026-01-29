

## Revisión Exhaustiva: Verificación de Planes de Suscripción

He auditado completamente el código del proyecto. A continuación presento los hallazgos organizados por criticidad.

---

### Resumen Ejecutivo

| Estado | Archivo | Problema |
|--------|---------|----------|
| ✅ YA CORREGIDO | `useSubscription.ts` | Ya incluye `repremium` en `hasActivePremium` |
| 🔴 CRÍTICO | `get-resource-access/index.ts` | Solo verifica `plan !== 'premium'` |
| 🟡 UI ADMIN | `AdminUsers.tsx` | Badges y botones solo para `premium` |
| ✅ CORRECTO | `useCourseAccess.ts` | Ya incluye `repremium` |
| ✅ CORRECTO | `useAdminSubscriptions.ts` | Ya incluye todos los planes |
| ✅ CORRECTO | `AdminSubscriptions.tsx` | Ya incluye todos los planes |
| ✅ CORRECTO | `lemon-squeezy-webhook` | Mapeo correcto de variantes |
| ✅ CORRECTO | `features.ts` | Usa `hasSubscription` boolean |
| ✅ CORRECTO | `Profile.tsx` | Ya tiene cases para todos los planes |
| ✅ CORRECTO | `useStarterPackResources.ts` | Usa `hasActivePremium` (ahora corregido) |

---

### Problema Crítico: Edge Function `get-resource-access`

**Archivo:** `supabase/functions/get-resource-access/index.ts`  
**Línea 67**

**Código actual:**
```typescript
if (!subscription || subscription.plan !== 'premium' || subscription.status !== 'active') {
  throw new Error('Premium subscription required');
}
```

**Impacto:** Los usuarios RePremium, Cursos All y Curso Estrategia **no pueden acceder** a recursos premium del Starter Pack a través de esta edge function.

**Solución:**
```typescript
// Definir planes con acceso premium
const PREMIUM_PLANS = ['premium', 'repremium', 'cursos_all', 'curso_estrategia'];

// Cambiar verificación
if (!subscription || !PREMIUM_PLANS.includes(subscription.plan) || subscription.status !== 'active') {
  throw new Error('Premium subscription required');
}
```

---

### Problema de UI Admin: `AdminUsers.tsx`

**Archivo:** `src/pages/admin/AdminUsers.tsx`  
**Líneas afectadas:** 491, 671-672, 681, 716, 775-776, 789, 819

**Problemas identificados:**

1. **Conteo de Premium (línea 491):**
```typescript
// Solo cuenta 'premium', ignora 'repremium'
{users.filter(u => u.subscription?.plan === 'premium').length}
```

2. **Badge de plan (líneas 671-672, 775-776):**
```typescript
// Solo muestra "Premium" o "Gratuito", ignora otros planes
<Badge variant={user.subscription?.plan === 'premium' ? 'default' : 'secondary'}>
  {user.subscription?.plan === 'premium' ? 'Premium' : 'Gratuito'}
</Badge>
```

3. **Botón Toggle Mentoría (líneas 716, 819):**
```typescript
// Solo aparece para 'premium', no para 'repremium'
{user.subscription?.plan === 'premium' && (
  <Button onClick={() => toggleMentoriaStatus(...)}>
```

4. **Estado de Mentoría (líneas 681, 789):**
```typescript
// Solo muestra estado para 'premium'
{user.subscription?.plan === 'premium' && (
  <Badge>{user.mentoria_completed ? '✓ Completada' : '⏳ Pendiente'}</Badge>
)}
```

**Solución propuesta:**

Crear helpers al inicio del componente:
```typescript
const PREMIUM_PLANS = ['premium', 'repremium'];

const isPremiumPlan = (plan?: string) => PREMIUM_PLANS.includes(plan || '');

const getPlanBadge = (plan?: string) => {
  switch (plan) {
    case 'premium': return { variant: 'default', label: 'Premium', className: '' };
    case 'repremium': return { variant: 'secondary', label: 'RePremium', className: 'bg-purple-500/20 text-purple-600' };
    case 'curso_estrategia': return { variant: 'secondary', label: 'Curso Estrategia', className: 'bg-blue-500/20 text-blue-600' };
    case 'cursos_all': return { variant: 'secondary', label: 'Cursos All', className: 'bg-cyan-500/20 text-cyan-600' };
    default: return { variant: 'secondary', label: 'Free', className: '' };
  }
};
```

Luego actualizar:
- Conteo: `users.filter(u => isPremiumPlan(u.subscription?.plan)).length`
- Badge: usar helper `getPlanBadge()`
- Toggle mentoría: `isPremiumPlan(user.subscription?.plan) && ...`
- Estado mentoría: `isPremiumPlan(user.subscription?.plan) && ...`

---

### Archivos Ya Verificados como Correctos ✅

| Archivo | Verificación |
|---------|--------------|
| `useSubscription.ts` | ✅ `hasActivePremium` incluye `['premium', 'repremium']` |
| `useCourseAccess.ts` | ✅ `plan === 'repremium'` tiene acceso a todos los cursos |
| `useAdminSubscriptions.ts` | ✅ Cuenta `premium + repremium` juntos |
| `AdminSubscriptions.tsx` | ✅ `getPlanBadge()` incluye todos los planes |
| `lemon-squeezy-webhook` | ✅ `VARIANT_TO_PLAN` mapea correctamente las 4 variantes |
| `features.ts` | ✅ Usa `hasSubscription` como boolean, no verifica plan específico |
| `Profile.tsx` | ✅ `getPlanBadge()` tiene cases para `repremium`, `cursos_all`, etc. |
| `useStarterPackResources.ts` | ✅ Usa `hasActivePremium` del hook (ya corregido) |
| `useHomeRedirect.ts` | ✅ Usa `hasActivePremium` del hook |
| `Recommendations.tsx` | ✅ Usa `hasActivePremium` del hook |
| `SkillGaps.tsx` | ✅ Usa `hasActivePremium` del hook |
| `Progress.tsx` | ✅ Usa `useSubscription` (no verifica plan específico para acceso) |

---

### Plan de Implementación

| Prioridad | Archivo | Cambio |
|-----------|---------|--------|
| 🔴 Alta | `supabase/functions/get-resource-access/index.ts` | Usar array `PREMIUM_PLANS` para verificación |
| 🟡 Media | `src/pages/admin/AdminUsers.tsx` | Crear helpers y actualizar 8 ubicaciones |

---

### Detalle Técnico de Cambios

#### 1. Edge Function `get-resource-access/index.ts`

**Cambio en líneas 48-70:**

```typescript
// Check access level
if (resource.access_level === 'premium') {
  // Planes con acceso a recursos premium
  const PREMIUM_PLANS = ['premium', 'repremium', 'cursos_all', 'curso_estrategia'];
  
  // Verify user has premium subscription
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!profile) {
    throw new Error('Profile not found');
  }

  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('plan, status')
    .eq('user_id', profile.id)
    .single();

  if (!subscription || !PREMIUM_PLANS.includes(subscription.plan) || subscription.status !== 'active') {
    throw new Error('Premium subscription required');
  }
}
```

#### 2. AdminUsers.tsx

**Agregar helpers después de los imports:**

```typescript
// Helpers para planes
const PREMIUM_PLANS = ['premium', 'repremium'];

const isPremiumPlan = (plan?: string) => PREMIUM_PLANS.includes(plan || '');

const getPlanBadge = (plan?: string): { variant: string; label: string; className: string } => {
  switch (plan) {
    case 'premium':
      return { variant: 'default', label: 'Premium', className: 'bg-amber-500/20 text-amber-600 border-amber-500/30' };
    case 'repremium':
      return { variant: 'outline', label: 'RePremium', className: 'bg-purple-500/20 text-purple-600 border-purple-500/30' };
    case 'curso_estrategia':
      return { variant: 'outline', label: 'Curso', className: 'bg-blue-500/20 text-blue-600 border-blue-500/30' };
    case 'cursos_all':
      return { variant: 'outline', label: 'Cursos All', className: 'bg-cyan-500/20 text-cyan-600 border-cyan-500/30' };
    default:
      return { variant: 'secondary', label: 'Free', className: '' };
  }
};
```

**Actualizar las 8 ubicaciones que usan `plan === 'premium'`**

---

### Checklist para Futuros Planes

Cuando agregues un nuevo plan de suscripción, debes revisar TODOS estos archivos:

**Backend (DB):**
1. ☐ `has_active_premium()` - función SQL
2. ☐ `has_course_access()` - función SQL
3. ☐ Schema `subscription_plan` enum

**Edge Functions:**
4. ☐ `lemon-squeezy-webhook/index.ts` - VARIANT_TO_PLAN
5. ☐ `get-resource-access/index.ts` - verificación de plan

**Frontend Hooks:**
6. ☐ `useSubscription.ts` - hasActivePremium y otros flags
7. ☐ `useCourseAccess.ts` - lógica de acceso a cursos
8. ☐ `useAdminSubscriptions.ts` - tipos y conteos

**Frontend UI:**
9. ☐ `AdminSubscriptions.tsx` - filtros y badges
10. ☐ `AdminUsers.tsx` - conteos, badges, botones
11. ☐ `Profile.tsx` - getPlanBadge()
12. ☐ `Planes.tsx` - estado de suscripción

---

### Recomendación: Crear Archivo de Constantes

Para evitar que esto vuelva a pasar, recomiendo crear `src/constants/plans.ts`:

```typescript
// Planes que tienen acceso a funcionalidades premium (mentoría, career path)
export const PREMIUM_PLANS = ['premium', 'repremium'] as const;

// Planes que tienen acceso a cursos
export const COURSE_PLANS = ['curso_estrategia', 'cursos_all', 'repremium'] as const;

// Todos los planes de pago
export const ALL_PAID_PLANS = ['premium', 'repremium', 'curso_estrategia', 'cursos_all'] as const;

// Helpers
export const isPremiumPlan = (plan?: string) => PREMIUM_PLANS.includes(plan as any);
export const hasCoursesAccess = (plan?: string) => COURSE_PLANS.includes(plan as any);
export const isPaidPlan = (plan?: string) => ALL_PAID_PLANS.includes(plan as any);
```

Esto centralizaría la definición de planes y evitaría hardcodear strings en múltiples archivos.

