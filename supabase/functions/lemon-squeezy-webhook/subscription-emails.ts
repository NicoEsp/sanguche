// Subscription-lifecycle emails sent from the LemonSqueezy webhook:
//   C1 · sendPaymentFailedEmail        — dunning when a renewal charge fails
//   C2 · sendSubscriptionCancelledEmail — confirmation / soft win-back on cancel
//
// These are webhook-event-driven (one email per discrete LS event), not cron
// re-scans, so they don't need a dedup queue like the cron email flows do.
// Both are best-effort: callers wrap them in try/catch so the webhook still
// returns 200 if Resend fails.

import {
  ctaButton,
  emailShell,
  escapeHtml,
  firstNameFrom,
  sendResendEmail,
  SITE_URL,
} from "../_shared/email.ts";
import { maskEmail } from "../_shared/pii.ts";

// ── C1 · Dunning ────────────────────────────────────────────────────────────

function buildPaymentFailedHtml(name: string, updateUrl: string): string {
  const body = `<!-- Body -->
<tr><td style="padding:40px;">
  <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 16px;">Hola ${escapeHtml(firstNameFrom(name))}, ¿cómo estás?</p>
  <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 16px;">
    Intentamos renovar tu suscripción a ProductPrepa pero <strong>el pago no se pudo procesar</strong>. Suele pasar por una tarjeta vencida, sin fondos o un bloqueo del banco.
  </p>
  <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 24px;">
    Para no perder el acceso a tu mentoría, cursos y recursos, actualizá tu método de pago:
  </p>
  ${ctaButton(updateUrl, "Actualizar método de pago →")}
  <p style="font-size:14px;color:#71717a;line-height:1.5;margin:0;">
    Vamos a reintentar el cobro automáticamente durante los próximos días. Si ya lo resolviste, ignorá este mensaje. Cualquier duda, respondé este mail.
  </p>
</td></tr>`;
  return emailShell("Tu pago no se pudo procesar", body);
}

export async function sendPaymentFailedEmail(opts: {
  email: string;
  name: string | null;
  updatePaymentUrl: string | null;
}): Promise<void> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.error("[subscription-emails] RESEND_API_KEY not configured; skipping dunning email");
    return;
  }

  // Fall back to the profile page when LS doesn't hand us a direct link.
  const html = buildPaymentFailedHtml(opts.name ?? "", opts.updatePaymentUrl || `${SITE_URL}/perfil`);
  const result = await sendResendEmail({
    apiKey: resendApiKey,
    to: opts.email,
    subject: "No pudimos procesar tu pago de ProductPrepa 💳",
    html,
  });

  if (result.ok) console.log(`[subscription-emails] SENT dunning to ${maskEmail(opts.email)}`);
  else console.error(`[subscription-emails] Resend error (dunning) for ${maskEmail(opts.email)}: ${result.body}`);
}

// ── C2 · Cancellation / win-back ─────────────────────────────────────────────

function buildCancelledHtml(name: string, endsAt: string | null): string {
  let accessLine = "";
  if (endsAt) {
    const d = new Date(endsAt);
    if (!isNaN(d.getTime())) {
      const formatted = d.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
      accessLine = `<p style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 16px;">
    Vas a <strong>seguir con acceso completo hasta el ${formatted}</strong>, así que aprovechá tus cursos y recursos hasta entonces.
  </p>`;
    }
  }

  const body = `<!-- Body -->
<tr><td style="padding:40px;">
  <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 16px;">Hola ${escapeHtml(firstNameFrom(name))},</p>
  <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 16px;">
    Confirmamos que cancelaste tu suscripción a ProductPrepa. Fue un gusto acompañarte en tu crecimiento en Producto.
  </p>
  ${accessLine}
  <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 24px;">
    Si en algún momento querés retomar, tu cuenta y tu progreso te esperan. Podés reactivar cuando quieras:
  </p>
  ${ctaButton(`${SITE_URL}/planes`, "Reactivar mi plan →")}
  <p style="font-size:14px;color:#71717a;line-height:1.5;margin:0;">
    ¿Nos cancelaste por algo que podamos mejorar? Respondé este mail y contame — lo leo yo.
  </p>
</td></tr>`;
  return emailShell("Cancelaste tu suscripción", body);
}

export async function sendSubscriptionCancelledEmail(opts: {
  email: string;
  name: string | null;
  endsAt: string | null;
}): Promise<void> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.error("[subscription-emails] RESEND_API_KEY not configured; skipping cancellation email");
    return;
  }

  const html = buildCancelledHtml(opts.name ?? "", opts.endsAt);
  const result = await sendResendEmail({
    apiKey: resendApiKey,
    to: opts.email,
    subject: "Confirmamos la cancelación de tu suscripción",
    html,
  });

  if (result.ok) console.log(`[subscription-emails] SENT cancellation to ${maskEmail(opts.email)}`);
  else console.error(`[subscription-emails] Resend error (cancellation) for ${maskEmail(opts.email)}: ${result.body}`);
}
