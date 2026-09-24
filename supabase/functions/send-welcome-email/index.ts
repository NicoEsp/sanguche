// send-welcome-email — invoked by the trigger_notify_welcome_email trigger on
// public.user_subscriptions, which fires when a row enters
// (plan IN ('premium','repremium','productprepa_business','productastic_review'),
//  status = 'active') from outside that state.
//
// Body: { user_id: uuid, plan: WelcomePlan }
//
// Sends one welcome email per (user, welcome category). Premium and RePremium
// share the same category ('premium'); B2B and Review each have their own.
// Idempotency: the queue row is claimed (status "pending") before sending, and
// UNIQUE(user_id, plan) on welcome_email_queue lets only one request through.
// A failed send leaves the row retryable (see reclaimRow). The function is
// public, so it only sends when the user really has that plan active, and it
// never returns or logs the email.

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://productprepa.com";
const MENTORIA_URL = `${SITE_URL}/mentoria`;
const CAREER_URL = `${SITE_URL}/progreso`;
const DOWNLOADS_URL = `${SITE_URL}/descargables`;
const SERVICES_CONTACT_EMAIL = "nicoproducto@hey.com";

const WELCOME_PLANS = [
  "premium",
  "repremium",
  "productprepa_business",
  "productastic_review",
] as const;
type WelcomePlan = typeof WELCOME_PLANS[number];

function isWelcomePlan(value: unknown): value is WelcomePlan {
  return typeof value === "string" &&
    (WELCOME_PLANS as readonly string[]).includes(value);
}

// Welcome category: groups plans whose welcome email is the same. Used as the
// `plan` value stored in welcome_email_queue so the UNIQUE(user_id, plan)
// constraint dedups correctly across premium ↔ repremium.
function welcomeCategory(plan: WelcomePlan): string {
  if (plan === "premium" || plan === "repremium") return "premium";
  return plan;
}

function planLabel(plan: WelcomePlan): string {
  switch (plan) {
    case "premium":
      return "Premium";
    case "repremium":
      return "RePremium";
    case "productprepa_business":
      return "ProductPrepa for B2B";
    case "productastic_review":
      return "Productastic Review";
  }
}

function subjectLine(plan: WelcomePlan): string {
  return `¡Bienvenida/o a ${planLabel(plan)}! 🎉`;
}

function htmlShell(title: string, bodyInner: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">

<!-- Header -->
<tr><td style="background:#18181b;padding:32px 40px;text-align:center;">
  <h1 style="color:#ffffff;font-size:22px;margin:0;">🥪 ProductPrepa</h1>
</td></tr>

${bodyInner}

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

function buildPremiumHtml(name: string, plan: WelcomePlan): string {
  const firstName = name?.split(" ")[0] || "ahí";
  const label = planLabel(plan);

  const body = `<!-- Body -->
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
</td></tr>`;

  return htmlShell(`¡Bienvenida/o a ${label}!`, body);
}

function buildBusinessHtml(name: string): string {
  const firstName = name?.split(" ")[0] || "ahí";

  const body = `<!-- Body -->
<tr><td style="padding:40px;">
  <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 16px;">
    Hola ${firstName}, ¿cómo estás?
  </p>

  <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 16px;">
    Te escribo porque reservaste el cupo de <strong>ProductPrepa for B2B</strong> y por tal motivo te doy la bienvenida! Qué bueno arrancar a trabajar con el equipo.
  </p>

  <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 16px;">
    En las próximas <strong>24 hs</strong> te escribo para coordinar el <strong>kickoff de diagnóstico</strong> con el líder del equipo. Después de ese diagnóstico inicial te paso el plan de capacitación a medida y arrancamos con las sesiones grupales.
  </p>

  <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 16px;">
    Para acelerar el kickoff, respondé a este mail (o escribime a <a href="mailto:${SERVICES_CONTACT_EMAIL}" style="color:#18181b;font-weight:600;">${SERVICES_CONTACT_EMAIL}</a>) con:
  </p>

  <ul style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 24px;padding-left:20px;">
    <li>Tamaño del equipo y seniority promedio</li>
    <li>Dos o tres objetivos de negocio que quieran trabajar</li>
    <li>Contexto del producto / industria (lo que tengas a mano, no hace falta que esté ordenado)</li>
  </ul>

  <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 16px;">
    Aparte de las sesiones, todo el equipo va a tener acceso a los <strong>cursos de ProductPrepa</strong>. En el kickoff vemos cómo darles las invitaciones para que cada uno entre con su cuenta.
  </p>

  <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 8px;">
    Seguimos en contacto, nos vemos pronto en el kickoff.
  </p>

  <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0;">
    Un abrazo!
  </p>
</td></tr>`;

  return htmlShell("¡Bienvenida/o a ProductPrepa for B2B!", body);
}

function buildReviewHtml(name: string): string {
  const firstName = name?.split(" ")[0] || "ahí";

  const body = `<!-- Body -->
<tr><td style="padding:40px;">
  <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 16px;">
    Hola ${firstName}, ¿cómo estás?
  </p>

  <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 16px;">
    Te escribo porque solicitaste tu <strong>Productastic Review</strong> y por tal motivo te doy la bienvenida! Qué bueno poder revisar juntos tu proceso de construcción de producto.
  </p>

  <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 16px;">
    Para arrancar, respondé a este mail (o escribime a <a href="mailto:${SERVICES_CONTACT_EMAIL}" style="color:#18181b;font-weight:600;">${SERVICES_CONTACT_EMAIL}</a>) con los materiales del review:
  </p>

  <ul style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 24px;padding-left:20px;">
    <li>Link a tu producto</li>
    <li>Research que hiciste (entrevistas, datos, métricas, lo que tengas)</li>
    <li>Hipótesis principales que estés trabajando</li>
    <li>La decisión de producto puntual que querés validar con el review</li>
  </ul>

  <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 16px;">
    <strong>Tip:</strong> cuanto más contexto me pases, más útil va a ser la review. No hace falta que esté ordenado: yo me encargo de eso.
  </p>

  <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 24px;">
    Una vez que reciba los materiales, en <strong>72 hs</strong> te mando el informe detallado con recomendaciones accionables para los próximos pasos.
  </p>

  <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 8px;">
    Quedo atento a tu mail con los materiales.
  </p>

  <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0;">
    Un abrazo!
  </p>
</td></tr>`;

  return htmlShell("¡Bienvenida/o a Productastic Review!", body);
}

function buildEmailHtml(name: string, plan: WelcomePlan): string {
  if (plan === "productprepa_business") return buildBusinessHtml(name);
  if (plan === "productastic_review") return buildReviewHtml(name);
  return buildPremiumHtml(name, plan);
}

// Resend guarda cada Idempotency-Key 24 horas. Se deja una de margen.
const RESEND_KEY_WINDOW_MS = 23 * 60 * 60 * 1000;
// Resend responde en menos de un segundo. Colgado más que esto, el pedido se
// corta y la fila queda "unconfirmed" en vez de "pending" para siempre.
const RESEND_TIMEOUT_MS = 10_000;

// Vuelve a reservar una fila que ya existe, si quedó reintentable. Cada UPDATE
// es atómico: de dos pedidos en paralelo, uno solo la pasa a "pending".
// - "error": Resend respondió con un error que asegura que no mandó nada. Se
//   reintenta con una idempotency key nueva (sent_at nuevo).
// - "unconfirmed": no se sabe si el mail salió (el pedido falló sin respuesta,
//   o Resend respondió 5xx o un 409 de idempotencia). Se reintenta con la
//   misma key (mismo sent_at): si ya había salido, Resend devuelve la respuesta
//   original sin mandar otro. Pasadas las 24 horas de la key no se reintenta,
//   para no duplicar el mail.
// "pending" y "sent" no se tocan.
async function reclaimRow(
  supabase: SupabaseClient,
  userId: string,
  category: string,
  email: string,
) {
  const failed = await supabase
    .from("welcome_email_queue")
    .update({ status: "pending", email, error_message: null, sent_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("plan", category)
    .eq("status", "error")
    .select("id, sent_at")
    .maybeSingle();
  if (failed.error || failed.data) return failed;

  return await supabase
    .from("welcome_email_queue")
    .update({ status: "pending" })
    .eq("user_id", userId)
    .eq("plan", category)
    .eq("status", "unconfirmed")
    .gt("sent_at", new Date(Date.now() - RESEND_KEY_WINDOW_MS).toISOString())
    .select("id, sent_at")
    .maybeSingle();
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

    if (!isWelcomePlan(plan)) {
      return new Response(
        JSON.stringify({ error: `plan must be one of ${WELCOME_PLANS.join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const category = welcomeCategory(plan);

    // La función es pública (el trigger la llama con la anon key, que está en
    // el front), así que no confía en el body: solo manda la bienvenida si el
    // usuario tiene ese plan activo. Sin esto, cualquiera con el id de un perfil
    // podía hacerle llegar una bienvenida de un plan que no compró.
    const [
      { data: subscription, error: subscriptionError },
      { data: profile, error: profileError },
    ] = await Promise.all([
      supabase
        .from("user_subscriptions")
        .select("plan, status")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("id, name, email")
        .eq("id", userId)
        .maybeSingle(),
    ]);

    // Un error de la base no es "no tiene el plan": se responde 500 y no 409.
    if (subscriptionError) {
      console.error(`[send-welcome-email] Could not read subscription for ${userId}:`, subscriptionError);
      return new Response(
        JSON.stringify({ error: "Subscription unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (
      subscription?.status !== "active" ||
      !isWelcomePlan(subscription.plan) ||
      welcomeCategory(subscription.plan) !== category
    ) {
      console.warn(`[send-welcome-email] SKIP ${userId} (${category}): no active ${category} plan`);
      return new Response(
        JSON.stringify({ error: "No active plan for this welcome" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    // La fila de la cola se reserva antes de mandar: UNIQUE(user_id, plan) deja
    // pasar un solo pedido. Antes se consultaba, se mandaba y recién después se
    // insertaba, así que dos llamadas en paralelo mandaban dos mails.
    const inserted = await supabase
      .from("welcome_email_queue")
      .insert({
        user_id: profile.id,
        plan: category,
        email: profile.email,
        status: "pending",
      })
      .select("id, sent_at")
      .single();
    let claim = inserted.data;
    let claimError = inserted.error;

    if (claimError?.code === "23505") {
      const reclaimed = await reclaimRow(supabase, profile.id, category, profile.email);
      if (!reclaimed.error && !reclaimed.data) {
        console.log(`[send-welcome-email] SKIP ${userId} (${category}): already sent`);
        return new Response(
          JSON.stringify({ message: "Already sent", skipped: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      claim = reclaimed.data;
      claimError = reclaimed.error;
    }

    if (claimError || !claim) {
      console.error(`[send-welcome-email] Could not claim queue row for ${userId} (${category}):`, claimError);
      return new Response(
        JSON.stringify({ error: "Queue unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const label = planLabel(plan);
    console.log(`[send-welcome-email] SENDING ${label} welcome to user=${profile.id}`);

    const emailHtml = buildEmailHtml(profile.name || "", plan);

    let resendRes: Response;
    let resendBody: string;
    try {
      resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
          // Estable mientras la fila no cambie de sent_at: ver reclaimRow.
          "Idempotency-Key": `welcome-email/${claim.id}/${claim.sent_at}`,
        },
        body: JSON.stringify({
          from: "ProductPrepa <hola@productprepa.com>",
          to: [profile.email],
          subject: subjectLine(plan),
          html: emailHtml,
        }),
        signal: AbortSignal.timeout(RESEND_TIMEOUT_MS),
      });
      resendBody = await resendRes.text();
    } catch (err) {
      // Sin respuesta no se sabe si el mail salió: "unconfirmed" se reintenta
      // con la misma key. Si la fila quedara en "pending", bloquearía la
      // bienvenida para siempre.
      console.error(`[send-welcome-email] Resend request failed for user=${profile.id} plan=${category}:`, err);
      const { error: markError } = await supabase
        .from("welcome_email_queue")
        .update({ status: "unconfirmed", error_message: String(err) })
        .eq("id", claim.id);
      if (markError) {
        console.error(
          `[send-welcome-email] Failed to record unconfirmed send for user=${profile.id} plan=${category}:`,
          markError,
        );
      }
      return new Response(
        JSON.stringify({ error: "Failed to send" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!resendRes.ok) {
      // Un 5xx o un 409 de idempotencia (otro pedido con la misma key en curso,
      // o la key ya usada) no dicen si el mail salió: se reintenta con la misma
      // key. Los demás errores sí dicen que no salió nada.
      const outcomeUnknown = resendRes.status >= 500 ||
        (resendRes.status === 409 &&
          /concurrent_idempotent_requests|invalid_idempotent_request/.test(resendBody));
      const failedStatus = outcomeUnknown ? "unconfirmed" : "error";
      // El cuerpo de Resend puede traer el email: queda en error_message.
      console.error(
        `[send-welcome-email] Resend error ${resendRes.status} for user=${profile.id} plan=${category} (${failedStatus})`,
      );
      const { error: errorUpdateError } = await supabase
        .from("welcome_email_queue")
        .update({ status: failedStatus, error_message: resendBody })
        .eq("id", claim.id);
      if (errorUpdateError) {
        console.error(
          `[send-welcome-email] Failed to record error for user=${profile.id} plan=${category}:`,
          errorUpdateError,
        );
      }
      return new Response(
        JSON.stringify({ error: "Failed to send" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // The email was sent: if this update fails the row stays as "pending",
    // which still blocks a second send.
    const { error: queueUpdateError } = await supabase
      .from("welcome_email_queue")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", claim.id);
    if (queueUpdateError) {
      console.error(
        `[send-welcome-email] Email sent but queue update failed for user=${profile.id} plan=${category}:`,
        queueUpdateError,
      );
    }

    console.log(`[send-welcome-email] SENT ${label} to user=${profile.id}`);

    return new Response(
      JSON.stringify({ message: "Sent" }),
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
