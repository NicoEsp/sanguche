// "Olvidé mi contraseña" — sends the recovery mail through Resend.
//
// Replaces supabase.auth.resetPasswordForEmail() from the client, which goes
// out through Supabase's built-in mailer (noreply@mail.app.supabase.io): that
// sender is capped at a couple of mails per hour project-wide and is routinely
// spam-foldered or dropped by Outlook/Hotmail. Every other transactional mail
// we send already goes through Resend from hola@productprepa.com, which is the
// domain our users actually receive.
//
// The link itself points at our own /auth page carrying the hashed token — see
// _shared/recovery.ts for why that matters for scanned inboxes.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { emailShell, ctaButton, firstNameFrom, sendResendEmail } from "../_shared/email.ts";
import { maskEmail } from "../_shared/pii.ts";
import { generateRecoveryLink } from "../_shared/recovery.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Same table the checkout uses; the `pwreset:` prefix keeps the two counters
// on separate rows.
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 3;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Answered for unknown addresses too, so the endpoint can't be used to find out
// who has an account.
const GENERIC_OK = { ok: true };

async function isRateLimited(supabase: any, identifier: string): Promise<boolean> {
  const { data: row } = await supabase
    .from("checkout_rate_limit")
    .select("request_count, first_request_at")
    .eq("identifier", identifier)
    .maybeSingle();

  const now = new Date();

  if (!row) {
    await supabase.from("checkout_rate_limit").insert({
      identifier,
      request_count: 1,
      first_request_at: now.toISOString(),
      last_request_at: now.toISOString(),
    });
    return false;
  }

  const elapsed = now.getTime() - new Date(row.first_request_at).getTime();

  if (elapsed >= RATE_LIMIT_WINDOW_MS) {
    await supabase
      .from("checkout_rate_limit")
      .update({
        request_count: 1,
        first_request_at: now.toISOString(),
        last_request_at: now.toISOString(),
      })
      .eq("identifier", identifier);
    return false;
  }

  if (row.request_count >= RATE_LIMIT_MAX) {
    return true;
  }

  await supabase
    .from("checkout_rate_limit")
    .update({
      request_count: row.request_count + 1,
      last_request_at: now.toISOString(),
    })
    .eq("identifier", identifier);
  return false;
}

function buildHtml(name: string | null, link: string): string {
  const firstName = firstNameFrom(name);
  return emailShell(
    "Restablecé tu contraseña",
    `<tr><td style="padding:40px;">
  <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 16px;">
    ¡Hola ${firstName}!
  </p>
  <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 24px;">
    Pediste restablecer tu contraseña de ProductPrepa. Hacé clic en el botón y elegí una nueva:
  </p>

  ${ctaButton(link, "Crear nueva contraseña →")}

  <p style="font-size:14px;color:#71717a;line-height:1.5;margin:0 0 8px;">
    El enlace es de un solo uso y vence en 1 hora. Si vence, podés pedir otro desde "¿Olvidaste tu contraseña?" en el login.
  </p>
  <p style="font-size:14px;color:#71717a;line-height:1.5;margin:0;">
    Si no pediste este cambio, ignorá este mail: tu contraseña actual sigue funcionando.
  </p>
</td></tr>`,
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const { email: rawEmail } = await req.json().catch(() => ({ email: null }));
    const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";

    if (!email || !EMAIL_RE.test(email)) {
      return json({ error: "invalid_email" }, 400);
    }

    const emailMasked = maskEmail(email);
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (await isRateLimited(supabase, `pwreset:${email}`)) {
      console.warn(`[send-password-reset] Rate limited ${emailMasked}`);
      return json({ error: "rate_limited" }, 429);
    }

    const { link, userNotFound, error: linkError } = await generateRecoveryLink(supabase, email);

    if (!link) {
      if (userNotFound) {
        // No account for this address: stay silent and return the same shape.
        console.log(`[send-password-reset] No account for ${emailMasked}`);
        return json(GENERIC_OK);
      }
      console.error(`[send-password-reset] generateLink failed for ${emailMasked}: ${linkError}`);
      return json({ error: "link_generation_failed" }, 500);
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("[send-password-reset] RESEND_API_KEY not configured");
      return json({ error: "email_not_configured" }, 500);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("email", email)
      .maybeSingle();

    const result = await sendResendEmail({
      apiKey: resendApiKey,
      to: email,
      subject: "Restablecé tu contraseña de ProductPrepa 🔑",
      html: buildHtml(profile?.name ?? null, link),
    });

    if (!result.ok) {
      console.error(
        `[send-password-reset] Resend error for ${emailMasked} (${result.status}): ${result.body}`,
      );
      return json({ error: "email_send_failed" }, 502);
    }

    console.log(`[send-password-reset] Sent to ${emailMasked}`);
    return json(GENERIC_OK);
  } catch (err) {
    console.error("[send-password-reset] Unexpected error:", err);
    return json({ error: "unexpected_error" }, 500);
  }
});
