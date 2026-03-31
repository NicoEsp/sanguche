

## Conectar Productastic Review al checkout de Lemon Squeezy

### Resumen

Reemplazar el botón "Quiero saber más" (que abre un modal de waitlist) por un botón "Pagar USD 50" que lleva directo al checkout de Lemon Squeezy con el producto ID 933251 / variant 1467096.

### Cambios

**1. `src/components/LemonSqueezyCheckout.tsx`** — Agregar `productastic_review` al tipo `PlanType`:
```ts
export type PlanType = 'premium' | 'repremium' | 'curso_estrategia' | 'cursos_all' | 'productastic_review';
```
Y agregar el texto default del botón para este plan.

**2. `supabase/functions/lemon-squeezy-checkout/index.ts`** — Agregar variant en `VARIANT_CONFIG`:
```ts
'productastic_review': { variantId: '1467096', purchaseType: 'one_time' },
```

**3. `supabase/functions/lemon-squeezy-webhook/index.ts`** — Agregar mapping en `VARIANT_TO_PLAN`:
```ts
'1467096': { plan: 'productastic_review', purchaseType: 'one_time' },
```

**4. `src/pages/Planes.tsx`** — Reemplazar el botón actual (líneas 474-482) que abre el modal por el componente `<LemonSqueezyCheckout>`:
```tsx
<LemonSqueezyCheckout
  plan="productastic_review"
  buttonText="Pagar USD 50"
  className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold shadow-lg rounded-xl border-0"
/>
```
El `ProductReviewModal` y su estado se pueden mantener como referencia informativa (o eliminar si preferís), pero el CTA principal pasará a ser checkout directo.

### Qué NO cambia

- No se crea nueva ruta ni página.
- No se modifica `constants/plans.ts` porque Productastic Review no es un plan de suscripción ni otorga acceso a features premium/cursos.
- La Edge Function ya soporta `one_time` purchases y checkouts anónimos.

### Flujo resultante

```text
Usuario en /planes → Click "Pagar USD 50"
  ├─ Logueado → checkout directo en Lemon Squeezy
  └─ No logueado → EmailCaptureDialog → checkout con email
→ Lemon Squeezy procesa pago → webhook registra en user_subscriptions
```

