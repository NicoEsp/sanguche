

## Plan: Mejoras al Dashboard de Admin

### Resumen de Cambios

| # | Problema | Solución |
|---|----------|----------|
| 1 | "Crecimiento de Usuarios (30 días)" usa rolling 30 días | Cambiar a mes calendario en curso (ej: "Enero 2026") |
| 2 | Falta métrica de día con más evaluaciones | Agregar nueva fila con día, cantidad y fecha |
| 3 | MRR/ARR usa precios base ($120k), no reales ($60k con descuento) | Guardar `total` del webhook y usarlo para calcular MRR |
| 4 | RePremium no aparece en /admin/suscripciones | Agregar todos los planes al filtro, tabla y badges |
| 5 | Resumen de Actividad Reciente | Sí, los datos son en tiempo real, actualizados cada vez que cargas el dashboard |

---

### Detalle de Cambios

#### 1. Mes en Curso (no últimos 30 días)

**Archivos:**
- `src/hooks/useAdminAnalytics.ts`
- `src/pages/admin/AdminDashboard.tsx`

**Cambios:**
- Calcular inicio del mes actual (`monthStart = new Date(year, month, 1)`)
- Filtrar `userGrowth` solo a días del mes actual
- Agregar `monthName` al objeto analytics (ej: "Enero 2026")
- Actualizar promedio diario para dividir entre días transcurridos del mes

**UI:**
- Título: "Crecimiento de Usuarios (Enero 2026)"
- Promedio: calculado sobre días transcurridos, no 30 fijos

---

#### 2. Día con Más Evaluaciones

**Archivos:**
- `src/hooks/useAdminAnalytics.ts`
- `src/pages/admin/AdminDashboard.tsx`

**Cambios:**
- Agregar cálculo de `peakAssessmentDay` similar a `peakDay` (agrupar assessments por fecha)
- Nueva propiedad en `AdminAnalytics`: `peakAssessmentDay: { count: number; date: string | null }`

**UI:**
- Nueva fila en "Crecimiento de Usuarios":

```
┌─────────────────────────────────────────────────────────────┐
│ Día con más evaluaciones                              5     │
│                                                      15/01  │
└─────────────────────────────────────────────────────────────┘
```

---

#### 3. MRR/ARR con Precios Reales (Descuentos Aplicados)

Este es el cambio más importante. Verificamos que Jonathan Glantz pagó $60,002 ARS (no $120,000) por RePremium con cupón 50%.

**Paso 1: Migración de Base de Datos**

Agregar columna `paid_amount` a `user_subscriptions`:

```sql
ALTER TABLE user_subscriptions 
ADD COLUMN paid_amount integer DEFAULT NULL;

COMMENT ON COLUMN user_subscriptions.paid_amount IS 
  'Precio efectivamente pagado en centavos (incluye descuentos aplicados)';
```

**Paso 2: Modificar Webhook**

**Archivo:** `supabase/functions/lemon-squeezy-webhook/index.ts`

Extraer `total` del evento `order_created` y guardarlo:

```typescript
// En order_created:
const orderTotal = event.data.attributes.total; // Ya viene en centavos

// Guardar en user_subscriptions
await supabase
  .from('user_subscriptions')
  .upsert({
    user_id: userId,
    paid_amount: orderTotal,  // Precio real pagado
    // ... resto de campos
  });
```

**Paso 3: Modificar Cálculo de MRR**

**Archivo:** `src/hooks/useAdminAnalytics.ts`

1. Agregar `paid_amount` al select de subscriptions
2. Usar `paid_amount` si existe, sino fallback a precio del plan:

```typescript
const monthlyPrice = sub.paid_amount 
  ? sub.paid_amount / 100  // convertir centavos a pesos
  : (sub.plan === 'premium' ? premiumMonthlyPrice : repremiumMonthlyPrice);
```

**Paso 4: Backfill Datos Existentes**

Actualizar suscripción de Jonathan Glantz manualmente:

```sql
UPDATE user_subscriptions 
SET paid_amount = 6000231  -- $60,002.31 en centavos
WHERE lemon_squeezy_subscription_id = '1830123';
```

---

#### 4. RePremium y Otros Planes en /admin/suscripciones

**Archivos:**
- `src/hooks/useAdminSubscriptions.ts`
- `src/pages/admin/AdminSubscriptions.tsx`

**Cambios en tipos:**

```typescript
// SubscriptionFilters
plan?: 'free' | 'premium' | 'repremium' | 'curso_estrategia' | 'cursos_all' | 'all';

// SubscriptionWithProfile
plan: 'free' | 'premium' | 'repremium' | 'curso_estrategia' | 'cursos_all';
```

**Cambios en UI:**

1. Agregar opciones al Select de planes:
   - Todos
   - Premium
   - RePremium
   - Curso Estrategia
   - Cursos All
   - Free

2. Actualizar `getPlanBadge()` con colores para cada plan:
   - Premium: amber
   - RePremium: purple
   - Curso Estrategia: blue
   - Cursos All: cyan
   - Free: secondary

3. Actualizar `useSubscriptionStats()` para incluir RePremium en conteos.

---

#### 5. Resumen de Actividad Reciente (Confirmación)

Los datos mostrados:
- **Evaluaciones hoy**: `analytics.assessmentsToday` - cuenta assessments con `created_at >= today`
- **Usuarios activos (30 días)**: `analytics.activeUsers` - usuarios únicos que hicieron assessment en últimos 30 días
- **Tasa de conversión**: `analytics.conversionRate` - % de usuarios con plan premium
- **Opcionales**: `analytics.usersWithOptionalAnswers` - usuarios que completaron Growth/IA

Todos estos datos se calculan en tiempo real cada vez que se carga el dashboard y se actualizan con el botón "Actualizar".

---

### Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/hooks/useAdminAnalytics.ts` | Mes en curso, peakAssessmentDay, MRR con paid_amount |
| `src/pages/admin/AdminDashboard.tsx` | Título mes, nueva fila evaluaciones |
| `src/hooks/useAdminSubscriptions.ts` | Tipos con todos los planes |
| `src/pages/admin/AdminSubscriptions.tsx` | Select y badges para todos los planes |
| `supabase/functions/lemon-squeezy-webhook/index.ts` | Guardar paid_amount |
| Migración SQL | Agregar columna paid_amount |

### Orden de Implementación

1. Migración SQL (agregar columna `paid_amount`)
2. Webhook (guardar precio real)
3. Backfill de Jonathan Glantz
4. Hook de analytics (usar paid_amount para MRR)
5. Dashboard UI (mes en curso, peak assessment day)
6. Subscriptions UI (filtros y badges para todos los planes)

### Riesgos

- **Bajo:** Cambios de UI en dashboard son solo visuales
- **Medio:** Modificación del webhook requiere pruebas (pero no afecta pagos existentes)
- **Bajo:** Backfill es manual y controlado

