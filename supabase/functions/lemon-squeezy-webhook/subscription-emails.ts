// Subscription-lifecycle emails sent from the LemonSqueezy webhook:
//   C1 · sendPaymentFailedEmail       — dunning when a renewal charge fails
//   C2 · sendSubscriptionCancelledEmail — confirmation / soft win-back on
//        cancellation or expiry
//
// Both are best-effort: the webhook must still return 200 even if the email
// fails, so callers wrap these in try/catch. Idempotency is enforced by the
// subscription_email_queue table via a UNIQUE dedup_key.

import {
  ctaButton,
  emailShell,
  firstNameFrom,
  sendResendEmail,
  SITE_URL,
} from "../_shared/email.ts";
import { maskEmail } from "../_shared/pii.ts";

type EmailType = "payment_failed" | "cancelled";

// Returns true if we've already logged a send for this dedup_key. Any error
// (e.g. table missing in an unmigrated env) is treated as "not sent" so we
// fail open rather than silently swallow the email.
async function alreadySent(supabase: any, dedupKey: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("subscription_email_queue")
    .select("id")
    .eq("dedup_key", dedupKey)
    .maybeSingle();
  if (error) {
    console.warn(`[subscription-emails] dedup check failed for ${dedupKey}:`, error.message);
    return false;
  }
  return !!data;
}

async function record(
  supabase: any,
  row: {
    userId: string | null;
    subscriptionId: string | null;
    emailType: EmailType;
    dedupKey: string;
    email: string;
    status: "sent" | "error";
    errorMessage?: string | null;
  },
): Promise<void> {
  const { error } = await supabase.from("subscription_email_queue").insert({
    user_id: row.userId,
    lemon_squeezy_subscription_id: row.subscriptionId,
    email_type: row.emailType,
    dedup_key: row.dedupKey,
    email: row.email,
    status: row.status,
    error_message: row.errorMessage ?? null,
  });
  if (error) {
    // A duplicate dedup_key (23505) just means a concurrent delivery beat us
    // to it — harmless. Anything else is worth a noisy log.
    if (error.code !== "23505") {
      console.error(`[subscription-emails] Failed to record ${row.emailType} for ${maskEmail(row.email)}:`, error.message);
    }
  }
}

// ── C1 · Dunning ────────────────────────────────────────────────────────────

function buildPaymentFailedHtml(name: string, updateUrl: string): string {
  const firstName = firstNameFrom(name);
  const body = `<!-- Body -->
<tr><td style="padding:40px;">
  <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 16px;">
    Hola ${firstName}, ¿cómo estás?
  </p>
  <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 16px;">
    Intentamos renovar tu suscripción a ProductPrepa pero <strong>el pago no se pudo procesar</strong>. Suele pasar por una tarjeta vencida, sin fondos o un bloqueo del banco.
  </p>
  <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 24px;">
    Para no perder el acceso a tu mentoría, cursos y recursos, actualizá tu método de pago desde este botón:
  </p>

  ${ctaButton(updateUrl, "Actualizar método de pago →")}

  <p style="font-size:14px;color:#71717a;line-height:1.5;margin:0;">
    Vamos a reintentar el cobro automáticamente durante los próximos días. Si ya lo resolviste, podés ignorar este mensaje. Cualquier duda, respondé este mail y te damos una mano.
  </p>
</td></tr>`;
  return emailShell("Tu pago no se pudo procesar", body);
}

export async function sendPaymentFailedEmail(
  supabase: any,
  opts: {
    userId: string | null;
    email: string;
    name: string | null;
    subscriptionId: string | null;
    updatePaymentUrl: string | null;
    eventDate: string; // YYYY-MM-DD — one dunning email per sub per day
  },
): Promise<void> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.error("[subscription-emails] RESEND_API_KEY not configured; skipping dunning email");
    return;
  }

  const dedupKey = `dunning:${opts.subscriptionId ?? "unknown"}:${opts.eventDate}`;
  if (await alreadySent(supabase, dedupKey)) {
    console.log(`[subscription-emails] SKIP dunning ${maskEmail(opts.email)}: already sent (${dedupKey})`);
    return;
  }

  // Fall back to the profile/subscription page when LemonSqueezy doesn't hand
  // us a direct update-payment-method URL.
  const updateUrl = opts.updatePaymentUrl || `${SITE_URL}/perfil`;
  const html = buildPaymentFailedHtml(opts.name ?? "", updateUrl);

  const result = await sendResendEmail({
    apiKey: resendApiKey,
    to: opts.email,
    subject: "No pudimos procesar tu pago de ProductPrepa 💳",
    html,
  });

  await record(supabase, {
    userId: opts.userId,
    subscriptionId: opts.subscriptionId,
    emailType: "payment_failed",
    dedupKey,
    email: opts.email,
    status: result.ok ? "sent" : "error",
    errorMessage: result.ok ? null : result.body,
  });

  if (result.ok) {
    console.log(`[subscription-emails] SENT dunning to ${maskEmail(opts.email)}`);
  } else {
    console.error(`[subscription-emails] Resend error (dunning) for ${maskEmail(opts.email)}: ${result.body}`);
  }
}

// ── C2 · Cancellation / expiry ───────────────────────────────────────────────

function buildCancelledHtml(name: string, expired: boolean, endsAt: string | null): string {
  const firstName = firstNameFrom(name);

  // "Access until" line only makes sense while the subscription is cancelled
  // but still within its paid period.
  let accessLine = "";
  if (!expired && endsAt) {
    const d = new Date(endsAt);
    if (!isNaN(d.getTime())) {
      const formatted = d.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
      accessLine = `<p style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 16px;">
    Vas a <strong>seguir con acceso completo hasta el ${formatted}</strong>, así que podés aprovechar tus cursos y recursos hasta entonces.
  </p>`;
    }
  }

  const intro = expired
    ? "Tu suscripción a ProductPrepa finalizó y tu acceso premium quedó pausado. Fue un gusto acompañarte en tu crecimiento en Producto."
    : "Confirmamos que cancelaste tu suscripción a ProductPrepa. Fue un gusto acompañarte en tu crecimiento en Producto.";

  const body = `<!-- Body -->
<tr><td style="padding:40px;">
  <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 16px;">
    Hola ${firstName},
  </p>
  <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 16px;">
    ${intro}
  </p>
  ${accessLine}
  <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 24px;">
    Si en algún momento querés retomar, tu cuenta y tu progreso te esperan. Podés reactivar cuando quieras desde tu perfil:
  </p>

  ${ctaButton(`${SITE_URL}/planes`, "Reactivar mi plan →")}

  <p style="font-size:14px;color:#71717a;line-height:1.5;margin:0;">
    ¿Nos cancelaste por algo que podamos mejorar? Respondé este mail y contame — lo leo yo.
  </p>
</td></tr>`;

  return emailShell(expired ? "Tu suscripción finalizó" : "Cancelaste tu suscripción", body);
}

export async function sendSubscriptionCancelledEmail(
  supabase: any,
  opts: {
    userId: string | null;
    email: string;
    name: string | null;
    subscriptionId: string | null;
    endsAt: string | null;
    expired: boolean;
  },
): Promise<void> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.error("[subscription-emails] RESEND_API_KEY not configured; skipping cancellation email");
    return;
  }

  // One goodbye per subscription: whichever of cancelled/expired fires first
  // wins, so we never send two.
  const dedupKey = `cancel:${opts.subscriptionId ?? "unknown"}`;
  if (await alreadySent(supabase, dedupKey)) {
    console.log(`[subscription-emails] SKIP cancellation ${maskEmail(opts.email)}: already sent (${dedupKey})`);
    return;
  }

  const html = buildCancelledHtml(opts.name ?? "", opts.expired, opts.endsAt);

  const result = await sendResendEmail({
    apiKey: resendApiKey,
    to: opts.email,
    subject: opts.expired
      ? "Tu suscripción a ProductPrepa finalizó"
      : "Confirmamos la cancelación de tu suscripción",
    html,
  });

  await record(supabase, {
    userId: opts.userId,
    subscriptionId: opts.subscriptionId,
    emailType: "cancelled",
    dedupKey,
    email: opts.email,
    status: result.ok ? "sent" : "error",
    errorMessage: result.ok ? null : result.body,
  });

  if (result.ok) {
    console.log(`[subscription-emails] SENT cancellation to ${maskEmail(opts.email)}`);
  } else {
    console.error(`[subscription-emails] Resend error (cancellation) for ${maskEmail(opts.email)}: ${result.body}`);
  }
}
