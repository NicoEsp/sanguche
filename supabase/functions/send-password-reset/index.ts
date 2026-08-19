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
// Second dimension, so one client can't mail-bomb many different addresses.
// Looser than the per-email cap because whole offices share an IP.
const IP_RATE_LIMIT_MAX = 15;

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

// `identifier` carries a plain index, not a unique one, so two requests racing
// on a first-ever reset can each insert a row. Every read therefore treats the
// identifier as a set of rows rather than one: duplicates add up towards the
// limit instead of defeating it, and the window reset collapses them back to a
// single row. (A .maybeSingle() here would error on the duplicate and hand back
// a null row, which reads as "no attempts yet" and would let the limit be
// bypassed indefinitely.)
async function isRateLimited(
  supabase: any,
  identifier: string,
  max: number,
): Promise<boolean> {
  const { data: rows, error } = await supabase
    .from("checkout_rate_limit")
    .select("id, request_count, first_request_at")
    .eq("identifier", identifier)
    .order("first_request_at", { ascending: true })
    .limit(20);

  // Can't tell how many attempts came before: refuse rather than send.
  if (error) {
    console.error(`[send-password-reset] Rate limit read failed for ${identifier}:`, error);
    return true;
  }

  const now = new Date();

  if (!rows || rows.length === 0) {
    await supabase.from("checkout_rate_limit").insert({
      identifier,
      request_count: 1,
      first_request_at: now.toISOString(),
      last_request_at: now.toISOString(),
    });
    return false;
  }

  const oldest = rows[0];
  const elapsed = now.getTime() - new Date(oldest.first_request_at).getTime();

  if (elapsed >= RATE_LIMIT_WINDOW_MS) {
    await supabase
      .from("checkout_rate_limit")
      .update({
        request_count: 1,
        first_request_at: now.toISOString(),
        last_request_at: now.toISOString(),
      })
      .eq("id", oldest.id);

    if (rows.length > 1) {
      await supabase
        .from("checkout_rate_limit")
        .delete()
        .in("id", rows.slice(1).map((r: { id: string }) => r.id));
    }
    return false;
  }

  const attempts = rows.reduce(
    (total: number, r: { request_count: number | null }) => total + (r.request_count ?? 1),
    0,
  );

  if (attempts >= max) {
    return true;
  }

  await supabase
    .from("checkout_rate_limit")
    .update({
      request_count: oldest.request_count + 1,
      last_request_at: now.toISOString(),
    })
    .eq("id", oldest.id);
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

    // First hop in x-forwarded-for is the client as seen by the edge.
    const clientIp = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();

    if (await isRateLimited(supabase, `pwreset:${email}`, RATE_LIMIT_MAX)) {
      console.warn(`[send-password-reset] Rate limited ${emailMasked}`);
      return json({ error: "rate_limited" }, 429);
    }

    if (clientIp && await isRateLimited(supabase, `pwreset-ip:${clientIp}`, IP_RATE_LIMIT_MAX)) {
      console.warn(`[send-password-reset] Rate limited IP ${clientIp}`);
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

    // Only used for the greeting: a failed lookup degrades to "¡Hola ahí!"
    // rather than holding back the email, but it shouldn't do so silently.
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("name")
      .eq("email", email)
      .maybeSingle();

    if (profileError) {
      console.error(
        `[send-password-reset] Profile lookup failed for ${emailMasked}:`,
        profileError,
      );
    }

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
