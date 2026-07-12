import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AssessmentResult {
  promedioGlobal: number;
  nivel: string;
  gaps: Array<{ key: string; label: string; value: number; prioridad: string }>;
  strengths: Array<{ key: string; label: string; value: number }>;
}

type AssessmentType = "experimentado" | "sin_experiencia" | "builder" | "lider";

// Copy por evaluación. El descuento y el checkout directo son del producto
// RePremium, por eso solo aplican a la evaluación con experiencia (y a las
// legacy, que eran esa misma evaluación). Los demás perfiles reciben el pitch
// de su plan recomendado con CTA al sitio.
interface EmailVariant {
  subject: string;
  intro: (gapCount: number, nivel: string) => string;
  boxTitle: string;
  boxItems: string[];
  offerHtml: (checkoutUrl: string) => string;
  couponLine: string | null;
}

const REPREMIUM_VARIANT: EmailVariant = {
  subject: "Tu diagnóstico reveló oportunidades de mejora 🎯",
  intro: (gapCount, nivel) =>
    `Hace unos días completaste tu diagnóstico en ProductPrepa y detectamos <strong>${gapCount} áreas de mejora</strong> en tu perfil de <strong>PM ${nivel}</strong>.`,
  boxTitle: "Con RePremium podés:",
  boxItems: [
    "✅ Mentoría personalizada 1:1 para atacar tus brechas",
    "✅ Acceso a todos los cursos y recursos premium",
    "✅ Career path con objetivos claros y seguimiento",
    "✅ Ejercicios prácticos con feedback directo",
  ],
  offerHtml: (checkoutUrl) =>
    buildCtaOffer(
      "Preparamos un <strong>15% OFF en tu primer mes</strong> para que puedas arrancar con todo:",
      checkoutUrl,
      "Activá tu 15% OFF →"
    ),
  couponLine:
    'Usá el cupón <strong>SANGUCHITO15</strong> si preferís ir directo al checkout.',
};

function buildCtaOffer(text: string, url: string, label: string): string {
  return `
  <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 24px;">
    ${text}
  </p>

  <!-- CTA Button -->
  <table width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center" style="padding:8px 0 32px;">
    <a href="${url}" target="_blank" style="display:inline-block;background:#18181b;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">
      ${label}
    </a>
  </td></tr>
  </table>`;
}

const EMAIL_VARIANTS: Record<AssessmentType, EmailVariant> = {
  experimentado: REPREMIUM_VARIANT,
  sin_experiencia: {
    subject: "Tu mapa de afinidad marcó por dónde empezar 🎯",
    intro: (gapCount) =>
      `Hace unos días completaste tu mapa de afinidad en ProductPrepa y detectamos <strong>${gapCount} áreas por explorar</strong> antes de dar el salto a producto digital.`,
    boxTitle: "Con Premium podés:",
    boxItems: [
      "✅ Un plan de estudio ordenado para arrancar de cero",
      "✅ Mentoría 1:1 para orientar tu entrada a producto",
      "✅ Recursos y guías para cada dominio que te falta",
      "✅ Seguimiento de tu progreso paso a paso",
    ],
    offerHtml: () =>
      buildCtaOffer(
        "El salto es más corto con acompañamiento. Mirá lo que incluye el plan Premium:",
        "https://productprepa.com/planes",
        "Conocer Premium →"
      ),
    couponLine: null,
  },
  builder: {
    subject: "Tu diagnóstico de método reveló dónde enfocar 🎯",
    intro: (gapCount) =>
      `Hace unos días completaste tu diagnóstico de método en ProductPrepa y detectamos <strong>${gapCount} áreas donde estás construyendo a pura intuición</strong>.`,
    boxTitle: "Con Productastic Review obtenés:",
    boxItems: [
      "✅ Una revisión a fondo de tu producto, de punta a punta",
      "✅ Devolución concreta y priorizada sobre qué ajustar",
      "✅ La teoría que te falta, aplicada a lo que estás construyendo",
      "✅ Una mirada externa experta, sin comprometerte a una suscripción",
    ],
    offerHtml: () =>
      buildCtaOffer(
        "Tu producto merece una revisión a fondo. Mirá lo que incluye:",
        "https://productprepa.com/planes",
        "Conocer Productastic Review →"
      ),
    couponLine: null,
  },
  lider: {
    subject: "El diagnóstico de tu equipo reveló dónde nivelar 🎯",
    intro: (gapCount) =>
      `Hace unos días completaste el diagnóstico de tu equipo en ProductPrepa y detectamos <strong>${gapCount} dominios donde el equipo puede nivelar</strong> su forma de construir producto.`,
    boxTitle: "Con ProductPrepa for B2B tu equipo obtiene:",
    boxItems: [
      "✅ Un programa a medida según las brechas detectadas",
      "✅ Una base común de procesos para todo el equipo",
      "✅ Actualización a la forma actual de construir producto",
      "✅ Seguimiento del progreso del equipo en el tiempo",
    ],
    offerHtml: () =>
      buildCtaOffer(
        "Nivelá a tu equipo con un programa pensado para todo el grupo:",
        "https://productprepa.com/empresas",
        "Ver ProductPrepa for B2B →"
      ),
    couponLine: null,
  },
};

function isDiscountCandidate(result: AssessmentResult): boolean {
  const { gaps, promedioGlobal, nivel } = result;
  // 3+ gaps total
  if (gaps.length >= 3) return true;
  // Average < 3.0
  if (promedioGlobal < 3.0) return true;
  // Junior with 2+ high priority gaps
  if (
    nivel === "Junior" &&
    gaps.filter((g) => g.prioridad === "Alta").length >= 2
  )
    return true;
  return false;
}

function buildEmailHtml(
  name: string,
  nivel: string,
  gapCount: number,
  checkoutUrl: string,
  assessmentType: AssessmentType
): string {
  const firstName = name?.split(" ")[0] || "ahí";
  const variant = EMAIL_VARIANTS[assessmentType];
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Oportunidades de mejora detectadas</title>
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
    ¡Hola ${firstName}!
  </p>
  <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 16px;">
    ${variant.intro(gapCount, nivel)}
  </p>
  <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 24px;">
    Eso no es malo, al contrario: significa que hay mucho espacio para crecer rápido si enfocás bien los esfuerzos.
  </p>

  <!-- Value Prop Box -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border:1px solid #e4e4e7;border-radius:8px;margin-bottom:24px;">
  <tr><td style="padding:24px;">
    <p style="font-size:15px;font-weight:bold;color:#18181b;margin:0 0 12px;">${variant.boxTitle}</p>
    <p style="font-size:14px;color:#52525b;line-height:1.7;margin:0;">
      ${variant.boxItems.join("<br/>\n      ")}
    </p>
  </td></tr>
  </table>
${variant.offerHtml(checkoutUrl)}
${variant.couponLine ? `
  <p style="font-size:14px;color:#71717a;line-height:1.5;margin:0;">
    ${variant.couponLine}
  </p>` : ""}
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

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Window: assessments completed at least MIN_AGE_HOURS ago but no older
    // than MAX_AGE_DAYS. Wide window + idempotent index on assessment_id =
    // self-healing if the cron ever misses a day. Worst case mail delay:
    // ~24h after the user's assessment hits MIN_AGE_HOURS (cron is daily).
    const MIN_AGE_HOURS = 24;
    const MAX_AGE_DAYS = 7;

    const now = new Date();
    const youngestAllowed = new Date(now.getTime() - MIN_AGE_HOURS * 60 * 60 * 1000);
    const oldestAllowed = new Date(now.getTime() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000);

    console.log(`[send-discount-email] Date window: ${oldestAllowed.toISOString()} to ${youngestAllowed.toISOString()}`);
    console.log(`[send-discount-email] Current time: ${now.toISOString()}`);

    const { data: assessments, error: assessError } = await supabase
      .from("assessments")
      .select("id, user_id, assessment_result, assessment_type, created_at")
      .gte("created_at", oldestAllowed.toISOString())
      .lt("created_at", youngestAllowed.toISOString());

    if (assessError) {
      console.error("[send-discount-email] Error fetching assessments:", assessError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch assessments" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[send-discount-email] Assessments found in window: ${assessments?.length ?? 0}`);

    if (!assessments || assessments.length === 0) {
      console.log("[send-discount-email] No assessments in window. Exiting.");
      return new Response(
        JSON.stringify({ message: "No assessments found in window", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get already sent emails
    const assessmentIds = assessments.map((a) => a.id);
    const { data: alreadySent } = await supabase
      .from("discount_email_queue")
      .select("assessment_id")
      .in("assessment_id", assessmentIds);

    const sentIds = new Set((alreadySent || []).map((s) => s.assessment_id));
    const pendingAssessments = assessments.filter((a) => !sentIds.has(a.id));

    console.log(`[send-discount-email] Already sent: ${sentIds.size}, Pending: ${pendingAssessments.length}`);

    if (pendingAssessments.length === 0) {
      console.log("[send-discount-email] All emails already sent. Exiting.");
      return new Response(
        JSON.stringify({ message: "All emails already sent", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get profile + subscription data for pending users
    const userIds = [...new Set(pendingAssessments.map((a) => a.user_id))];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, email")
      .in("id", userIds);

    const { data: subscriptions } = await supabase
      .from("user_subscriptions")
      .select("user_id, plan, status")
      .in("user_id", userIds);

    const profileMap = new Map(
      (profiles || []).map((p) => [p.id, p])
    );
    const subMap = new Map(
      (subscriptions || []).map((s) => [s.user_id, s])
    );

    // Re-evaluarse crea un assessment nuevo (y borra el anterior), así que la
    // deduplicación por assessment_id no alcanza: un usuario que retoma la
    // evaluación volvería a entrar a la ventana. Un solo email por usuario.
    const { data: priorUserSends } = await supabase
      .from("discount_email_queue")
      .select("user_id")
      .in("user_id", userIds)
      .eq("status", "sent");

    const alreadyEmailedUsers = new Set(
      (priorUserSends || []).map((s) => s.user_id)
    );

    console.log(`[send-discount-email] Profiles loaded: ${profiles?.length ?? 0}, Subscriptions loaded: ${subscriptions?.length ?? 0}`);

    const checkoutUrl =
      "https://nicoproducto.lemonsqueezy.com/checkout/buy/0e2df4bf-c8da-4a40-ae06-625beaec3986?checkout[discount_code]=SANGUCHITO15";

    let sentCount = 0;
    let skippedNoEmail = 0;
    let skippedNotFree = 0;
    let skippedNotCandidate = 0;
    let skippedAlreadyEmailed = 0;
    const errors: string[] = [];

    for (const assessment of pendingAssessments) {
      const profile = profileMap.get(assessment.user_id);
      const sub = subMap.get(assessment.user_id);

      // Skip if no profile/email
      if (!profile?.email) {
        skippedNoEmail++;
        console.log(`[send-discount-email] SKIP user ${assessment.user_id}: no email`);
        continue;
      }

      // Skip if this user already received a discount email (any assessment)
      if (alreadyEmailedUsers.has(assessment.user_id)) {
        skippedAlreadyEmailed++;
        console.log(`[send-discount-email] SKIP ${profile.email}: already emailed for a previous assessment`);
        continue;
      }

      // Skip if not free plan
      if (sub?.plan !== "free") {
        skippedNotFree++;
        console.log(`[send-discount-email] SKIP ${profile.email}: plan is '${sub?.plan}' (not free)`);
        continue;
      }

      // Check discount candidate logic
      const result = assessment.assessment_result as AssessmentResult;
      if (!result || !isDiscountCandidate(result)) {
        skippedNotCandidate++;
        console.log(`[send-discount-email] SKIP ${profile.email}: not discount candidate (gaps: ${result?.gaps?.length ?? 0}, avg: ${result?.promedioGlobal ?? 'N/A'}, nivel: ${result?.nivel ?? 'N/A'})`);
        continue;
      }

      // Las evaluaciones legacy (sin tipo) eran la de experiencia previa.
      const assessmentType: AssessmentType =
        (assessment.assessment_type as AssessmentType | null) ?? "experimentado";

      console.log(`[send-discount-email] SENDING to ${profile.email} (tipo: ${assessmentType}, nivel: ${result.nivel}, gaps: ${result.gaps.length}, avg: ${result.promedioGlobal})`);

      // Send email via Resend
      try {
        const emailHtml = buildEmailHtml(
          profile.name || "",
          result.nivel,
          result.gaps.length,
          checkoutUrl,
          assessmentType
        );

        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "ProductPrepa <hola@productprepa.com>",
            to: [profile.email],
            subject: EMAIL_VARIANTS[assessmentType].subject,
            html: emailHtml,
          }),
        });

        const resendBody = await resendRes.text();

        if (!resendRes.ok) {
          console.error(`Resend error for ${profile.email}:`, resendBody);
          await supabase.from("discount_email_queue").insert({
            user_id: assessment.user_id,
            assessment_id: assessment.id,
            email: profile.email,
            status: "error",
            error_message: resendBody,
            assessment_data: {
              nivel: result.nivel,
              gaps: result.gaps.length,
              promedio: result.promedioGlobal,
              tipo: assessmentType,
            },
          });
          errors.push(`${profile.email}: ${resendBody}`);
          continue;
        }

        // Record success
        await supabase.from("discount_email_queue").insert({
          user_id: assessment.user_id,
          assessment_id: assessment.id,
          email: profile.email,
          status: "sent",
          assessment_data: {
            nivel: result.nivel,
            gaps: result.gaps.length,
            promedio: result.promedioGlobal,
            tipo: assessmentType,
          },
        });
        // Cubrir también duplicados dentro de la misma corrida: si el usuario
        // tiene más de un assessment pendiente en la ventana, el segundo no
        // debe generar otro email.
        alreadyEmailedUsers.add(assessment.user_id);
        sentCount++;
      } catch (emailErr) {
        console.error(`Error sending to ${profile.email}:`, emailErr);
        errors.push(`${profile.email}: ${String(emailErr)}`);
      }
    }

    console.log(`[send-discount-email] === SUMMARY ===`);
    console.log(`[send-discount-email] Total in window: ${assessments.length}, Pending: ${pendingAssessments.length}`);
    console.log(`[send-discount-email] Sent: ${sentCount}, Skipped (no email): ${skippedNoEmail}, Skipped (not free): ${skippedNotFree}, Skipped (not candidate): ${skippedNotCandidate}, Skipped (already emailed): ${skippedAlreadyEmailed}, Errors: ${errors.length}`);

    return new Response(
      JSON.stringify({
        message: `Processed ${pendingAssessments.length} assessments`,
        sent: sentCount,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
