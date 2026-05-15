// send-welcome-email — invoked by the trigger_notify_welcome_email trigger on
// public.user_subscriptions, which fires when a row enters
// (plan IN ('premium','repremium'), status = 'active') from outside that state.
//
// Body: { user_id: uuid, plan: 'premium' | 'repremium' }
//
// Sends one welcome email per user, ever.
// Idempotency: UNIQUE(user_id) on welcome_email_queue.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://productprepa.com";
const MENTORIA_URL = `${SITE_URL}/mentoria`;
const CAREER_URL = `${SITE_URL}/progreso`;
const DOWNLOADS_URL = `${SITE_URL}/preguntas`;

function planLabel(plan: string): string {
  if (plan === "premium") return "Premium";
  if (plan === "repremium") return "RePremium";
  return plan;
}

function buildEmailHtml(name: string, plan: string): string {
  const firstName = name?.split(" ")[0] || "ahí";
  const label = planLabel(plan);

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>¡Bienvenida/o a ${label}!</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">

<!-- Header -->
<tr><td style="background:#18181b;padding:32px 40px;text-align:center;">
  <h1 style="color:#ffffff;font-size:22px;margin:0;">🥪 ProductPrepa</h1>
</td></tr>

<!-- Body -->
<tr><td style="padding:40px;">
  <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 16px;">
    Hola ${firstName}, ¿cómo estás?
  </p>

  <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 16px;">
    Te escribo porque te diste de alta en la versión <strong>${label}</strong> de ProductPrepa y por tal motivo te doy la bienvenida! Qué bueno acompañarte en tu crecimiento en Producto.
  </p>

  <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 16px;">
    Para agendar la <strong>mentoría personalizada de 45 minutos</strong>, podés agendarme desde <a href="${MENTORIA_URL}" style="color:#18181b;font-weight:600;">esta sección</a> dentro de ProductPrepa. Tenemos un espacio durante este mes, aunque si es necesario más tiempo no hay problema!
  </p>

  <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 16px;">
    Por otro lado, en <a href="${CAREER_URL}" style="color:#18181b;font-weight:600;">esta sección</a> vas a tener acceso a una funcionalidad que te permite ir construyendo tu propio <strong>Plan de Carrera</strong>, si querés dale una mirada.
  </p>

  <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 24px;">
    Por último, en <a href="${DOWNLOADS_URL}" style="color:#18181b;font-weight:600;">esta sección</a> vas a tener acceso a <strong>documentos descargables</strong> que te pueden ser útiles para el momento en el que estás. Dale una mirada.
  </p>

  <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 8px;">
    Seguimos en contacto, ojalá pronto podamos charlar en la sesión de Mentoría.
  </p>

  <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0;">
    Un abrazo!
  </p>
</td></tr>

<!-- Footer -->
<tr><td style="background:#fafafa;padding:24px 40px;border-top:1px solid #e4e4e7;text-align:center;">
  <p style="font-size:13px;color:#a1a1aa;margin:0;">
    © ${new Date().getFullYear()} ProductPrepa · hola@productprepa.com
  </p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const userId = body?.user_id;
    const plan = body?.plan;

    if (!userId || typeof userId !== "string") {
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (plan !== "premium" && plan !== "repremium") {
      return new Response(
        JSON.stringify({ error: "plan must be 'premium' or 'repremium'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: existing } = await supabase
      .from("welcome_email_queue")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      console.log(`[send-welcome-email] SKIP ${userId}: already sent`);
      return new Response(
        JSON.stringify({ message: "Already sent", skipped: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, name, email")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      console.error(`[send-welcome-email] Profile ${userId} not found:`, profileError);
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!profile.email) {
      console.error(`[send-welcome-email] Profile ${userId} has no email`);
      return new Response(
        JSON.stringify({ error: "Profile has no email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const label = planLabel(plan);
    console.log(`[send-welcome-email] SENDING ${label} welcome to ${profile.email}`);

    const emailHtml = buildEmailHtml(profile.name || "", plan);

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "ProductPrepa <hola@productprepa.com>",
        to: [profile.email],
        subject: `¡Bienvenida/o a ${label}! 🎉`,
        html: emailHtml,
      }),
    });

    const resendBody = await resendRes.text();

    if (!resendRes.ok) {
      console.error(`[send-welcome-email] Resend error for ${profile.email}:`, resendBody);
      await supabase.from("welcome_email_queue").insert({
        user_id: profile.id,
        plan,
        email: profile.email,
        status: "error",
        error_message: resendBody,
      });
      return new Response(
        JSON.stringify({ error: "Failed to send", details: resendBody }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await supabase.from("welcome_email_queue").insert({
      user_id: profile.id,
      plan,
      email: profile.email,
      status: "sent",
    });

    console.log(`[send-welcome-email] SENT to ${profile.email}`);

    return new Response(
      JSON.stringify({ message: "Sent", email: profile.email }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[send-welcome-email] Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
