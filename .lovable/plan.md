

## Plan: Fix Build Errors + Auto-cancel de suscripcion anterior en upgrade

---

### Parte 1: Fix 8 Build Errors en Edge Functions

**1.1 `lemon-squeezy-checkout/index.ts` (linea 261)**
- Cambiar `error.name` por `(error as Error).name`

**1.2 `lemon-squeezy-webhook/index.ts` (linea 90)**
- Cambiar el tipo del parametro `supabase` en `logWebhookEvent` de `ReturnType<typeof createClient>` a `any`
- Esto resuelve los 5 errores en lineas 240, 268, 413, 438 donde se pasa el cliente

**1.3 `pricing-config/index.ts` (linea 166)**
- Cambiar `error.message` por `(error as Error).message`

**1.4 `publish-scheduled-courses/index.ts` (linea 79)**
- Cambiar `error.message` por `(error as Error).message`

**1.5 `src/pages/CourseDetail.tsx` (lineas 248, 250)**
- Cambiar `lesson.duration_seconds` por `lesson.duration_minutes` (la propiedad correcta segun el tipo `CourseLesson`)

---

### Parte 2: Auto-cancel de suscripcion anterior en upgrade

Cuando un usuario hace upgrade (ej: premium a repremium), el webhook recibe un `subscription_created` para la nueva suscripcion. El problema es que la suscripcion anterior en Lemon Squeezy sigue activa y cobrando.

**Cambio en `lemon-squeezy-webhook/index.ts`, dentro del case `subscription_created` (lineas 329-358):**

Antes del `upsert`, agregar logica para:

1. Buscar la suscripcion actual del usuario en `user_subscriptions` donde `status = 'active'` y `lemon_squeezy_subscription_id IS NOT NULL`
2. Si existe una suscripcion activa anterior **con un `lemon_squeezy_subscription_id` diferente al nuevo**, cancelarla via API de Lemon Squeezy (`DELETE /v1/subscriptions/{id}`)
3. Loggear la cancelacion automatica en consola
4. Continuar con el upsert normalmente

Pseudocodigo del bloque a agregar:

```
// Before upsert: auto-cancel previous subscription if upgrading
const { data: currentSub } = await supabase
  .from('user_subscriptions')
  .select('lemon_squeezy_subscription_id, plan')
  .eq('user_id', userId)
  .eq('status', 'active')
  .not('lemon_squeezy_subscription_id', 'is', null)
  .maybeSingle();

if (currentSub?.lemon_squeezy_subscription_id 
    && currentSub.lemon_squeezy_subscription_id !== subscriptionId) {
  console.log(`[Webhook] Auto-cancelling previous subscription: ${currentSub.lemon_squeezy_subscription_id} (plan: ${currentSub.plan})`);
  
  const lsApiKey = Deno.env.get('LEMON_SQUEEZY_API_KEY');
  if (lsApiKey) {
    const cancelResponse = await fetch(
      `https://api.lemonsqueezy.com/v1/subscriptions/${currentSub.lemon_squeezy_subscription_id}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${lsApiKey}`,
          'Accept': 'application/vnd.api+json',
        },
      }
    );
    
    if (cancelResponse.ok) {
      console.log('[Webhook] Previous subscription cancelled successfully');
    } else {
      console.error('[Webhook] Failed to cancel previous subscription:', await cancelResponse.text());
      // No lanzar error - continuar con el upgrade igualmente
    }
  }
}
```

**Punto clave:** Si la cancelacion falla por cualquier motivo, NO bloquea el upgrade. El nuevo plan se activa igual y se loggea el error para revision manual.

---

### Secuencia

1. Fix los 8 build errors (desbloquea deploys)
2. Agregar auto-cancel en el webhook
3. Redesplegar edge functions
4. Verificar en logs que funcione correctamente

