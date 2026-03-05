

## Automatizar email de descuento 3 días post-evaluación

Tengo todo lo necesario para implementar. Resumen de datos:

- **From**: `hola@productprepa.com`
- **RESEND_API_KEY**: `re_Am46GxsM_...` (se guardará como secret)
- **Cupón**: `SANGUCHITO15` — 15% OFF primer mes
- **URL checkout**: `https://nicoproducto.lemonsqueezy.com/checkout/buy/0e2df4bf-c8da-4a40-ae06-625beaec3986?checkout[discount_code]=SANGUCHITO15`

### Pasos de implementación

**1. Guardar secret `RESEND_API_KEY`** en Supabase.

**2. Migración SQL — tabla `discount_email_queue`**

Tabla para trackear emails enviados y evitar duplicados (unique por `assessment_id`). RLS: solo `service_role` puede escribir, admins pueden leer.

**3. Edge Function `send-discount-email/index.ts`**

- `verify_jwt = false` (para cron)
- Usa `SUPABASE_SERVICE_ROLE_KEY` para queries sin RLS
- Query: assessments con `created_at` entre 3 y 4 días atrás
- Join con `profiles` (name, email) y `user_subscriptions` (plan)
- Filtra:
  - Plan = `free`
  - `isDiscountCandidate` = true (misma lógica existente: 3+ gaps, promedio < 3.0, o Junior con 2+ gaps alta prioridad)
  - No existe en `discount_email_queue`
- Envía email via Resend con template HTML personalizado
- Registra envío en `discount_email_queue`

**4. Config `supabase/config.toml`** — agregar `[functions.send-discount-email]` con `verify_jwt = false`

**5. Cron job via SQL insert** — ejecutar diariamente a las 13:00 UTC (10 AM Argentina) usando `pg_cron` + `pg_net`

### Template del email

Email HTML con:
- Subject: "Tu diagnóstico reveló oportunidades de mejora 🎯"
- Saludo personalizado con nombre
- Resumen: nivel + cantidad de gaps detectados
- Propuesta de valor RePremium (mentoría personalizada, cursos, career path)
- CTA: "Activá tu 15% OFF" con link al checkout con cupón
- Footer con branding ProductPrepa

### Archivos a crear/modificar
- `supabase/functions/send-discount-email/index.ts` — nueva edge function
- `supabase/config.toml` — agregar función
- Migración SQL — tabla `discount_email_queue`
- SQL insert — cron job schedule

