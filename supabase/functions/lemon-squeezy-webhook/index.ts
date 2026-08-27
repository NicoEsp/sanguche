import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { findOrCreateUser, type Defer } from './helpers.ts';
import { sendPaymentFailedEmail, sendSubscriptionCancelledEmail } from './subscription-emails.ts';
import { maskEmail } from '../_shared/pii.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

// Mapping from variant ID to plan configuration
const VARIANT_TO_PLAN: Record<string, { plan: string; purchaseType: 'subscription' | 'one_time' }> = {
  '1071322': { plan: 'premium', purchaseType: 'subscription' },
  '1170898': { plan: 'repremium', purchaseType: 'subscription' },
  '1170897': { plan: 'curso_estrategia', purchaseType: 'one_time' },
  '1170900': { plan: 'cursos_all', purchaseType: 'one_time' },
  '1037226': { plan: 'productprepa_business', purchaseType: 'one_time' }, // legacy B2B variant (mantener por backward compat)
  '1626770': { plan: 'productprepa_business', purchaseType: 'one_time' }, // ProductPrepa for B2B (hosted checkout actual)
  '1467096': { plan: 'productastic_review', purchaseType: 'one_time' }, // Productastic Review (hosted checkout)
};

// Plans whose variant IDs are not registered in VARIANT_TO_PLAN (e.g. hosted
// `/checkout/buy/...` URLs configured directly in LemonSqueezy). For these we
// trust `meta.custom_data.plan` because the checkout URL itself sets the value.
// IMPORTANT: this whitelist intentionally excludes subscription plans
// (premium/repremium). Subscription plans must be identified strictly by
// variant_id to prevent privilege escalation via tampered custom_data.
const CUSTOM_DATA_PLAN_FALLBACK: Record<string, { plan: string; purchaseType: 'one_time' }> = {
  productastic_review: { plan: 'productastic_review', purchaseType: 'one_time' },
  productprepa_business: { plan: 'productprepa_business', purchaseType: 'one_time' },
};

// Events this function acts on. Anything else is acknowledged with 200 and
// dropped before we touch the database — see the early return in the handler.
const HANDLED_EVENTS = new Set([
  'order_created',
  'subscription_created',
  'subscription_updated',
  'subscription_cancelled',
  'subscription_expired',
  'subscription_payment_success',
  'subscription_payment_failed',
]);

// Known-noise events: LemonSqueezy fires these alongside every purchase and we
// have nothing to do with them. Dropped without an audit-log row so they stop
// burying real failures in the admin webhook log. Any *other* unhandled event
// still gets logged, so a new event type (order_refunded, license_key_created…)
// shows up instead of vanishing.
const IGNORED_EVENTS = new Set([
  'customer_created',
  'customer_updated',
]);

interface LemonSqueezyWebhookEvent {
  meta: {
    event_name: string;
    custom_data?: {
      user_id?: string;
      plan?: string;
      purchase_type?: string;
    };
  };
  data: {
    id: string;
    type: string;
    attributes: {
      status: string;
      customer_id: number;
      order_id?: number;
      variant_id?: number;
      first_order_item?: {
        variant_id?: number;
      };
      renews_at?: string;
      ends_at?: string;
      trial_ends_at?: string;
      created_at: string;
      updated_at: string;
      user_email?: string;
      customer_email?: string;
      // Customer objects carry the address as plain `email`.
      email?: string;
      user_name?: string;
      name?: string;
      total?: number; // Total amount in cents (includes discounts)
      subtotal?: number;
      discount_total?: number;
      // subscription_payment_* events deliver a subscription-INVOICE object, so
      // data.id is the invoice id and its `urls` only expose invoice_url. The
      // update-payment-method link lives on the Subscription object, which we
      // fetch from the LS API using this subscription_id (C1 dunning).
      subscription_id?: number;
    };
  };
}

// ── Background work ─────────────────────────────────────────────────────────
// Everything that isn't required for LemonSqueezy to consider the event
// delivered (analytics, audit logs, transactional emails, LS API side calls)
// runs after the response is flushed. This is what keeps p95 in the low
// hundreds of ms instead of ~2s.
function makeDefer(): Defer {
  const runtime = (globalThis as { EdgeRuntime?: { waitUntil?: (p: Promise<unknown>) => void } }).EdgeRuntime;
  const guard = (promise: Promise<unknown>) =>
    promise.catch((error) => console.error('[Webhook] Deferred task failed:', error));

  if (runtime && typeof runtime.waitUntil === 'function') {
    return (promise) => runtime.waitUntil!(guard(promise));
  }
  // Local `supabase functions serve` has no EdgeRuntime: fire and forget.
  return (promise) => { void guard(promise); };
}

// ── Signature verification ──────────────────────────────────────────────────

// Importing the HMAC key costs a few ms; the secret never changes within an
// instance, so import it once and reuse it across warm invocations.
let cachedKey: { secret: string; key: CryptoKey } | null = null;

async function hmacKey(secret: string): Promise<CryptoKey> {
  if (cachedKey?.secret === secret) return cachedKey.key;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  cachedKey = { secret, key };
  return key;
}

// Constant-time hex comparison: a plain `===` leaks how many leading bytes of
// a forged signature were correct.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function verifySignature(rawBody: string, signature: string | null, secret: string): Promise<boolean> {
  if (!signature) {
    console.error('[Webhook] Missing x-signature header');
    return false;
  }

  const signatureBytes = await crypto.subtle.sign(
    'HMAC',
    await hmacKey(secret),
    new TextEncoder().encode(rawBody),
  );

  const expected = Array.from(new Uint8Array(signatureBytes))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return timingSafeEqual(signature.trim().toLowerCase(), expected);
}

// ── Analytics ───────────────────────────────────────────────────────────────

// Mixpanel only accepts alphanumerics and hyphens in $insert_id, up to 36
// bytes — a colon or underscore makes it drop the value and fall back to a
// generated one, which defeats deduplication entirely.
function mixpanelInsertId(prefix: string, id: string): string {
  return `${prefix}-${id}`.replace(/[^A-Za-z0-9-]/g, '-').slice(0, 36);
}

// Mixpanel dedupes on event + distinct_id + time + $insert_id, so `time` has to
// come from the event itself. Using Date.now() would make every LemonSqueezy
// retry look like a distinct conversion no matter how stable $insert_id is.
function eventTimeSeconds(createdAt: string | undefined): number {
  const parsed = createdAt ? Date.parse(createdAt) : NaN;
  return Math.floor((Number.isNaN(parsed) ? Date.now() : parsed) / 1000);
}

async function trackMixpanelServerEvent(
  eventName: string,
  distinctId: string,
  insertId: string,
  timeSeconds: number,
  properties: Record<string, unknown>,
) {
  const MIXPANEL_TOKEN = '35fe7a2706398ebc90ae3f1012d0a558';
  try {
    const eventData = [{
      event: eventName,
      properties: {
        token: MIXPANEL_TOKEN,
        distinct_id: distinctId,
        // Both derived from the event, not from wall clock, so a LemonSqueezy
        // retry of the same order dedupes instead of double-counting the sale.
        time: timeSeconds,
        $insert_id: insertId,
        ...properties,
      },
    }];

    const response = await fetch('https://api.mixpanel.com/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'text/plain' },
      body: JSON.stringify(eventData),
    });

    console.log(`[Mixpanel] Tracked "${eventName}" for ${distinctId}: ${await response.text()}`);
  } catch (error) {
    // Non-fatal: don't break webhook processing for analytics
    console.error(`[Mixpanel] Failed to track "${eventName}":`, error);
  }
}

// ── Audit log ───────────────────────────────────────────────────────────────

interface WebhookLogRow {
  eventName: string;
  eventData: LemonSqueezyWebhookEvent | Record<string, never>;
  userEmail: string | null;
  userId: string | null;
  subscriptionId: string | null;
  customerId: string | null;
  orderId: string | null;
  status: 'success' | 'error';
  errorMessage: string | null;
  // Time until the 200 was returned, not including deferred work.
  processingTimeMs: number;
}

async function logWebhookEvent(supabase: any, row: WebhookLogRow) {
  try {
    const { error } = await supabase.from('payment_webhook_logs').insert({
      event_name: row.eventName,
      event_data: row.eventData,
      user_email: row.userEmail,
      user_id: row.userId,
      lemon_squeezy_subscription_id: row.subscriptionId,
      lemon_squeezy_customer_id: row.customerId,
      lemon_squeezy_order_id: row.orderId,
      status: row.status,
      error_message: row.errorMessage,
      processing_time_ms: row.processingTimeMs,
    });
    // PostgREST resolves with `{ error }` rather than throwing, so without this
    // check a rejected audit row would vanish silently.
    if (error) console.error('[Webhook] Failed to log webhook event:', error);
  } catch (error) {
    console.error('[Webhook] Failed to log webhook event:', error);
  }
}

// ── Event shape helpers ─────────────────────────────────────────────────────

interface EventIds {
  subscriptionId: string | null;
  orderId: string | null;
  customerId: string | null;
}

/**
 * `data.id` means a different thing per event type, and getting it wrong is
 * silent: the `.eq('lemon_squeezy_subscription_id', …)` updates just match
 * zero rows.
 *   order_created            → data is an Order, data.id IS the order id
 *   subscription_payment_*   → data is a Subscription Invoice, data.id is the
 *                              invoice id; the subscription is in attributes
 *   subscription_*           → data is a Subscription, data.id is its id
 */
function extractIds(eventName: string, event: LemonSqueezyWebhookEvent): EventIds {
  const attrs = event.data.attributes;
  const dataId = event.data.id?.toString() ?? null;
  const customerId = attrs.customer_id?.toString() ?? null;

  if (eventName === 'order_created') {
    return { subscriptionId: null, orderId: dataId, customerId };
  }

  if (eventName.startsWith('subscription_payment_')) {
    return {
      subscriptionId: attrs.subscription_id?.toString() ?? null,
      orderId: attrs.order_id?.toString() ?? null,
      customerId,
    };
  }

  return {
    subscriptionId: dataId,
    orderId: attrs.order_id?.toString() ?? null,
    customerId,
  };
}

function extractVariantId(event: LemonSqueezyWebhookEvent): string | null {
  return (
    event.data.attributes.variant_id?.toString() ||
    event.data.attributes.first_order_item?.variant_id?.toString() ||
    null
  );
}

// ── Subscription row updates ────────────────────────────────────────────────

/**
 * Applies `patch` to the row carrying `subscriptionId`.
 *
 * Returns a warning string instead of throwing when nothing matched: a retry
 * won't conjure the row, so we ack the event (200) and surface the miss in
 * payment_webhook_logs rather than letting LemonSqueezy hammer the endpoint.
 */
async function updateSubscriptionByLsId(
  supabase: any,
  eventName: string,
  subscriptionId: string | null,
  userId: string | null,
  patch: Record<string, unknown>,
): Promise<string | null> {
  if (!subscriptionId) {
    return `${eventName}: event carried no subscription id`;
  }

  const { data: updated, error } = await supabase
    .from('user_subscriptions')
    .update(patch)
    .eq('lemon_squeezy_subscription_id', subscriptionId)
    .select('id');

  if (error) throw new Error(`Failed to update ${eventName}: ${error.message}`);
  if (updated?.length) return null;

  // Nothing carries this LS subscription id. The usual cause: order_created
  // created the row (an Order payload has no subscription id to store) and
  // subscription_created never landed. Adopt that orphan row — otherwise a
  // cancellation never reaches the user and they keep paid access forever.
  if (!userId) {
    return `${eventName}: no row for subscription ${subscriptionId} and no user to adopt it`;
  }

  const { data: adopted, error: adoptError } = await supabase
    .from('user_subscriptions')
    .update({ ...patch, lemon_squeezy_subscription_id: subscriptionId })
    .eq('user_id', userId)
    .eq('purchase_type', 'subscription')
    .is('lemon_squeezy_subscription_id', null)
    .select('id');

  if (adoptError) throw new Error(`Failed to adopt subscription on ${eventName}: ${adoptError.message}`);

  if (!adopted?.length) {
    return `${eventName}: no user_subscriptions row matched subscription ${subscriptionId}`;
  }

  console.log(`[Webhook] ${eventName}: adopted orphan row for user ${userId} → subscription ${subscriptionId}`);
  return null;
}

// Resolve the recipient's email + name for lifecycle emails. Prefers the
// profile row (canonical) and falls back to the values carried on the webhook
// event. Returns null when we have no address to send to.
async function loadRecipient(
  supabase: any,
  userId: string | null,
  fallbackEmail: string | null,
  fallbackName: string | null,
): Promise<{ email: string; name: string | null } | null> {
  let email = fallbackEmail;
  let name = fallbackName;

  if (userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, name')
      .eq('id', userId)
      .maybeSingle();
    if (profile?.email) email = profile.email;
    if (profile?.name) name = profile.name;
  }

  if (!email) return null;
  return { email, name: name ?? null };
}

// Cancels the subscription the user is upgrading away from. Deferred: it's a
// ~300ms LemonSqueezy API round trip and the new plan is already active.
async function cancelPreviousSubscription(previousId: string, plan: string | null) {
  const lsApiKey = Deno.env.get('LEMON_SQUEEZY_API_KEY');
  if (!lsApiKey) {
    console.warn('[Webhook] LEMON_SQUEEZY_API_KEY missing; cannot cancel previous subscription');
    return;
  }

  const res = await fetch(`https://api.lemonsqueezy.com/v1/subscriptions/${previousId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${lsApiKey}`,
      'Accept': 'application/vnd.api+json',
    },
  });

  if (res.ok) {
    console.log(`[Webhook] Cancelled previous subscription ${previousId} (plan: ${plan})`);
  } else {
    console.error(`[Webhook] Failed to cancel previous subscription ${previousId}:`, await res.text());
  }
}

// Dunning email needs the update-payment-method URL, which lives on the
// Subscription object rather than on the invoice the event delivered.
async function sendDunningEmail(
  supabase: any,
  userId: string | null,
  subscriptionId: string | null,
  fallbackEmail: string | null,
  fallbackName: string | null,
) {
  let updateUrl: string | null = null;
  const lsApiKey = Deno.env.get('LEMON_SQUEEZY_API_KEY');

  if (lsApiKey && subscriptionId) {
    try {
      const res = await fetch(`https://api.lemonsqueezy.com/v1/subscriptions/${subscriptionId}`, {
        headers: { 'Authorization': `Bearer ${lsApiKey}`, 'Accept': 'application/vnd.api+json' },
      });
      if (res.ok) {
        const json = await res.json();
        updateUrl = json?.data?.attributes?.urls?.update_payment_method || null;
      } else {
        console.warn(`[Webhook] Could not fetch subscription ${subscriptionId} for update URL: ${res.status}`);
      }
    } catch (error) {
      console.warn('[Webhook] Error fetching update_payment_method URL:', error);
    }
  }

  const recipient = await loadRecipient(supabase, userId, fallbackEmail, fallbackName);
  if (!recipient) {
    console.warn('[Webhook] subscription_payment_failed: no recipient email resolved');
    return;
  }

  await sendPaymentFailedEmail({
    email: recipient.email,
    name: recipient.name,
    updatePaymentUrl: updateUrl,
  });
}

// C2 · Confirmation / soft win-back. Skipped when this is really an
// upgrade/downgrade swap: subscription_created auto-cancels the previous LS
// subscription, which fires subscription_cancelled even though the user still
// has an active plan. Only email genuine churn.
async function sendCancellationEmail(
  supabase: any,
  userId: string | null,
  fallbackEmail: string | null,
  fallbackName: string | null,
  endsAt: string | null,
) {
  // `.eq('user_id', null)` does not mean "no user" in PostgREST, so without
  // this guard an unresolved user would read as churned and get the email.
  if (!userId) return;

  const { data: activeSubs } = await supabase
    .from('user_subscriptions')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(1);

  if (activeSubs?.length) {
    console.log('[Webhook] subscription_cancelled: user still active — skipping goodbye email (upgrade swap)');
    return;
  }

  const recipient = await loadRecipient(supabase, userId, fallbackEmail, fallbackName);
  if (!recipient) return;

  await sendSubscriptionCancelledEmail({
    email: recipient.email,
    name: recipient.name,
    endsAt,
  });
}

// ── Handler ─────────────────────────────────────────────────────────────────

serve(async (req) => {
  const startTime = Date.now();
  const defer = makeDefer();

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let event: LemonSqueezyWebhookEvent | null = null;
  let eventName = 'unknown';
  let userEmail: string | null = null;
  let userId: string | null = null;
  // profiles.id is what every user_subscriptions row is keyed by; auth.users.id
  // is what the browser reports to Mixpanel. Keep both — they are not the same
  // UUID and mixing them up is what broke checkout_completed_server attribution.
  let authUserId: string | null = null;
  let ids: EventIds = { subscriptionId: null, orderId: null, customerId: null };
  let variantId: string | null = null;

  try {
    const webhookSecret = Deno.env.get('LEMON_SQUEEZY_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('[Webhook] LEMON_SQUEEZY_WEBHOOK_SECRET not configured');
      return new Response(JSON.stringify({ error: 'Webhook secret not configured' }), { status: 500, headers: jsonHeaders });
    }

    // Read the body exactly once — the old code cloned the request and parsed
    // the payload twice (once as text for the HMAC, once as JSON).
    const rawBody = await req.text();
    if (!await verifySignature(rawBody, req.headers.get('x-signature'), webhookSecret)) {
      console.error('[Webhook] Invalid webhook signature');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401, headers: jsonHeaders });
    }

    event = JSON.parse(rawBody) as LemonSqueezyWebhookEvent;
    eventName = event.meta?.event_name ?? 'unknown';

    // Ack-and-drop events we don't act on, before any user resolution.
    // LemonSqueezy delivers customer_created/customer_updated for every
    // purchase; those payloads carry the address as `email`, so the old code
    // answered 400 ("No user email provided") and LS retried each one three
    // times — 63 bogus error rows in payment_webhook_logs.
    if (IGNORED_EVENTS.has(eventName)) {
      console.log(`[Webhook] Ignoring known-noise event: ${eventName}`);
      return new Response(JSON.stringify({ received: true, ignored: true }), { status: 200, headers: jsonHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    if (!HANDLED_EVENTS.has(eventName)) {
      console.log(`[Webhook] Unhandled event type: ${eventName}`);
      defer(logWebhookEvent(supabase, {
        eventName,
        eventData: event,
        userEmail: null,
        userId: null,
        ...extractIds(eventName, event),
        status: 'success',
        errorMessage: 'Unhandled event type — acknowledged, no action taken',
        processingTimeMs: Date.now() - startTime,
      }));
      return new Response(JSON.stringify({ received: true, ignored: true }), { status: 200, headers: jsonHeaders });
    }

    const attrs = event.data.attributes;
    const status = attrs.status;
    ids = extractIds(eventName, event);
    variantId = extractVariantId(event);

    let planConfig: { plan: string; purchaseType: 'subscription' | 'one_time' } | null =
      variantId ? VARIANT_TO_PLAN[variantId] ?? null : null;

    // Fallback for products whose variant is not in VARIANT_TO_PLAN: trust
    // meta.custom_data.plan only if it's in the safe whitelist (one-time plans
    // only, never subscriptions).
    if (!planConfig) {
      const customPlan = event.meta?.custom_data?.plan;
      if (customPlan && CUSTOM_DATA_PLAN_FALLBACK[customPlan]) {
        planConfig = CUSTOM_DATA_PLAN_FALLBACK[customPlan];
        console.log(`[Webhook] Resolved plan via custom_data fallback: ${planConfig.plan} (variant ${variantId} not in VARIANT_TO_PLAN)`);
      }
    }

    userEmail = attrs.user_email || attrs.customer_email || attrs.email || null;
    const userName = attrs.user_name || attrs.name || null;

    console.log(
      `[Webhook] START ${eventName} · email=${maskEmail(userEmail)} · variant=${variantId ?? 'N/A'} · ` +
      `plan=${planConfig?.plan ?? 'N/A'} · sub=${ids.subscriptionId ?? 'N/A'} · order=${ids.orderId ?? 'N/A'}`,
    );

    if (!userEmail) {
      console.error('[Webhook] No user email in webhook event');
      defer(logWebhookEvent(supabase, {
        eventName, eventData: event, userEmail: null, userId: null, ...ids,
        status: 'error', errorMessage: 'No user email provided', processingTimeMs: Date.now() - startTime,
      }));
      return new Response(JSON.stringify({ error: 'No user email provided' }), { status: 400, headers: jsonHeaders });
    }

    try {
      const result = await findOrCreateUser(userEmail, userName, supabase, defer);
      userId = result.profileId;
      authUserId = result.authUserId;
    } catch (error) {
      console.error('[Webhook] Failed to find or create user:', error);
      defer(logWebhookEvent(supabase, {
        eventName, eventData: event, userEmail, userId: null, ...ids,
        status: 'error', errorMessage: `Failed to process user account: ${error}`,
        processingTimeMs: Date.now() - startTime,
      }));
      return new Response(JSON.stringify({ error: 'Failed to process user account' }), { status: 500, headers: jsonHeaders });
    }

    // Non-fatal problems worth seeing in the admin webhook log without making
    // LemonSqueezy retry the delivery.
    const warnings: string[] = [];

    switch (eventName) {
      case 'order_created': {
        const orderTotal = attrs.total ?? null;
        console.log(`[Webhook] order_created · plan=${planConfig?.plan ?? 'unknown'} · type=${planConfig?.purchaseType ?? 'unknown'} · total=${orderTotal} centavos`);

        if (planConfig) {
          const isOneTime = planConfig.purchaseType === 'one_time';
          const { error: upsertError } = await supabase
            .from('user_subscriptions')
            .upsert({
              user_id: userId,
              plan: planConfig.plan,
              status: 'active',
              purchase_type: planConfig.purchaseType,
              lemon_squeezy_variant_id: variantId,
              lemon_squeezy_order_id: ids.orderId,
              lemon_squeezy_customer_id: ids.customerId,
              paid_amount: orderTotal,
              // One-time purchases grant permanent access. For subscriptions we
              // set the plan proactively so the buyer isn't locked out if
              // subscription_created is delayed; renews_at arrives with it.
              ...(isOneTime ? { current_period_end: null } : {}),
              updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id', ignoreDuplicates: false });

          if (upsertError) {
            throw new Error(`Failed to upsert ${planConfig.purchaseType} order: ${upsertError.message}`);
          }
        } else {
          // Unknown variant and no safe custom_data fallback: do NOT grant any
          // plan. Record the event for debugging but skip the upsert to avoid
          // accidentally elevating the buyer to Premium.
          warnings.push(`order_created with unmapped variant ${variantId} and no custom_data plan match — no plan granted`);
          console.error(`[Webhook] ${warnings[warnings.length - 1]}`);
        }

        // Server-side checkout tracking (captures 100% of conversions).
        //
        // distinct_id MUST be auth.users.id: the browser calls
        // Mixpanel.identify(user.id) with the Supabase *auth* id, so sending
        // profiles.id here created a second, orphan Mixpanel profile per buyer
        // and the funnel never joined the client-side checkout_started to this
        // event. Falling back to profileId only when the auth id is unavailable
        // keeps the event flowing instead of dropping the conversion.
        defer(trackMixpanelServerEvent(
          'checkout_completed_server',
          authUserId ?? userId!,
          mixpanelInsertId('oc', ids.orderId ?? event.data.id),
          eventTimeSeconds(attrs.created_at),
          {
            plan: planConfig?.plan || 'unknown',
            purchase_type: planConfig?.purchaseType || 'unknown',
            variant_id: variantId,
            paid_amount_cents: orderTotal ?? 0,
            email: userEmail,
            order_id: ids.orderId,
            // Ambos ids explícitos: permite reconciliar los eventos históricos
            // que se mandaron con profiles.id como distinct_id.
            supabase_user_id: authUserId,
            profile_id: userId,
            source: 'webhook',
          },
        ));
        break;
      }

      case 'subscription_created': {
        const subscriptionPlan = planConfig?.plan || 'premium';
        console.log(`[Webhook] subscription_created · plan=${subscriptionPlan}`);

        // Auto-cancel the subscription being upgraded away from.
        const { data: currentSub } = await supabase
          .from('user_subscriptions')
          .select('lemon_squeezy_subscription_id, plan')
          .eq('user_id', userId)
          .eq('status', 'active')
          .not('lemon_squeezy_subscription_id', 'is', null)
          .maybeSingle();

        if (currentSub?.lemon_squeezy_subscription_id
            && currentSub.lemon_squeezy_subscription_id !== ids.subscriptionId) {
          defer(cancelPreviousSubscription(currentSub.lemon_squeezy_subscription_id, currentSub.plan));
        }

        const { error: subCreatedError } = await supabase
          .from('user_subscriptions')
          .upsert({
            user_id: userId,
            plan: subscriptionPlan,
            status: 'active',
            purchase_type: 'subscription',
            lemon_squeezy_subscription_id: ids.subscriptionId,
            lemon_squeezy_customer_id: ids.customerId,
            lemon_squeezy_variant_id: variantId,
            // order_created may not have landed yet; keep the id when it did.
            ...(ids.orderId ? { lemon_squeezy_order_id: ids.orderId } : {}),
            current_period_end: attrs.renews_at ? new Date(attrs.renews_at).toISOString() : null,
            trial_end: attrs.trial_ends_at ? new Date(attrs.trial_ends_at).toISOString() : null,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id', ignoreDuplicates: false });

        if (subCreatedError) {
          throw new Error(`Failed to upsert subscription_created: ${subCreatedError.message}`);
        }
        break;
      }

      case 'subscription_updated': {
        // LS statuses: active, paused, past_due, unpaid, cancelled, expired
        const mappedStatus =
          status === 'active' ? 'active' as const
          : (status === 'cancelled' || status === 'expired') ? 'cancelled' as const
          : 'inactive' as const;

        console.log(`[Webhook] subscription_updated · LS "${status}" → DB "${mappedStatus}"`);

        const warning = await updateSubscriptionByLsId(supabase, eventName, ids.subscriptionId, userId, {
          status: mappedStatus,
          current_period_end: attrs.renews_at ? new Date(attrs.renews_at).toISOString() : null,
          updated_at: new Date().toISOString(),
        });
        if (warning) warnings.push(warning);
        break;
      }

      case 'subscription_cancelled':
      case 'subscription_expired': {
        const warning = await updateSubscriptionByLsId(supabase, eventName, ids.subscriptionId, userId, {
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        });

        if (warning) {
          // Expected miss: on an upgrade, subscription_created already replaced
          // the stored id with the new subscription and then auto-cancelled the
          // old one, so this event names a subscription we no longer track.
          const { data: liveSub } = await supabase
            .from('user_subscriptions')
            .select('lemon_squeezy_subscription_id')
            .eq('user_id', userId)
            .eq('status', 'active')
            .maybeSingle();

          if (liveSub?.lemon_squeezy_subscription_id
              && liveSub.lemon_squeezy_subscription_id !== ids.subscriptionId) {
            console.log(`[Webhook] ${eventName}: subscription ${ids.subscriptionId} already superseded by ${liveSub.lemon_squeezy_subscription_id} (upgrade swap)`);
          } else {
            warnings.push(warning);
          }
        }

        // Email only on subscription_cancelled — one event, one goodbye;
        // subscription_expired would double it.
        if (eventName === 'subscription_cancelled') {
          defer(sendCancellationEmail(supabase, userId, userEmail, userName, attrs.ends_at || null));
        }
        break;
      }

      case 'subscription_payment_success': {
        // This event delivers a subscription-INVOICE, which has no `renews_at`
        // (verified against the stored payloads: 0/4 invoices carry it, while
        // 100% of Subscription payloads do). Omitting the column leaves the
        // renewal date set by subscription_created/_updated intact — writing
        // `null` here would wipe it, which is what happened once the id fix
        // made this update start matching real rows.
        const warning = await updateSubscriptionByLsId(supabase, eventName, ids.subscriptionId, userId, {
          status: 'active',
          ...(attrs.renews_at ? { current_period_end: new Date(attrs.renews_at).toISOString() } : {}),
          updated_at: new Date().toISOString(),
        });
        if (warning) warnings.push(warning);
        break;
      }

      case 'subscription_payment_failed': {
        // C1 · Dunning. We deliberately do NOT change the plan/status here —
        // LemonSqueezy keeps the subscription active during its retry grace
        // period, and any real downgrade arrives later via subscription_updated
        // (past_due/unpaid → inactive). Our only job is to warn the user so
        // they can fix their card before access is cut.
        defer(sendDunningEmail(supabase, userId, ids.subscriptionId, userEmail, userName));
        break;
      }
    }

    const processingTimeMs = Date.now() - startTime;
    const errorMessage = warnings.length ? warnings.join(' | ') : null;
    console.log(`[Webhook] END ${eventName} · ${errorMessage ? 'WARN' : 'OK'} · ${processingTimeMs}ms${errorMessage ? ` · ${errorMessage}` : ''}`);

    defer(logWebhookEvent(supabase, {
      eventName, eventData: event, userEmail, userId, ...ids,
      status: errorMessage ? 'error' : 'success',
      errorMessage,
      processingTimeMs,
    }));

    return new Response(JSON.stringify({ received: true }), { status: 200, headers: jsonHeaders });

  } catch (error) {
    const processingTimeMs = Date.now() - startTime;
    console.error(`[Webhook] Error processing ${eventName} after ${processingTimeMs}ms:`, error);

    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      );
      defer(logWebhookEvent(supabase, {
        eventName,
        eventData: event || {},
        userEmail, userId, ...ids,
        status: 'error',
        errorMessage: `Error processing webhook: ${error}`,
        processingTimeMs,
      }));
    } catch (logError) {
      console.error('[Webhook] Failed to log error event:', logError);
    }

    return new Response(JSON.stringify({ error: 'Error procesando webhook' }), { status: 500, headers: jsonHeaders });
  }
});
