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
  checkoutUrl: string
): string {
  const firstName = name?.split(" ")[0] || "ahí";
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
    Hace unos días completaste tu diagnóstico en ProductPrepa y detectamos <strong>${gapCount} áreas de mejora</strong> en tu perfil de <strong>PM ${nivel}</strong>.
  </p>
  <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 24px;">
    Eso no es malo, al contrario: significa que tenés mucho espacio para crecer rápido si enfocás bien tus esfuerzos.
  </p>

  <!-- Value Prop Box -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border:1px solid #e4e4e7;border-radius:8px;margin-bottom:24px;">
  <tr><td style="padding:24px;">
    <p style="font-size:15px;font-weight:bold;color:#18181b;margin:0 0 12px;">Con RePremium podés:</p>
    <p style="font-size:14px;color:#52525b;line-height:1.7;margin:0;">
      ✅ Mentoría personalizada 1:1 para atacar tus brechas<br/>
      ✅ Acceso a todos los cursos y recursos premium<br/>
      ✅ Career path con objetivos claros y seguimiento<br/>
      ✅ Ejercicios prácticos con feedback directo
    </p>
  </td></tr>
  </table>

  <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 24px;">
    Preparamos un <strong>15% OFF en tu primer mes</strong> para que puedas arrancar con todo:
  </p>

  <!-- CTA Button -->
  <table width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center" style="padding:8px 0 32px;">
    <a href="${checkoutUrl}" target="_blank" style="display:inline-block;background:#18181b;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">
      Activá tu 15% OFF →
    </a>
  </td></tr>
  </table>

  <p style="font-size:14px;color:#71717a;line-height:1.5;margin:0;">
    Usá el cupón <strong>SANGUCHITO15</strong> si preferís ir directo al checkout.
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

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find assessments created 3-4 days ago
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);

    const { data: assessments, error: assessError } = await supabase
      .from("assessments")
      .select("id, user_id, assessment_result, created_at")
      .gte("created_at", fourDaysAgo.toISOString())
      .lt("created_at", threeDaysAgo.toISOString());

    if (assessError) {
      console.error("Error fetching assessments:", assessError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch assessments" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!assessments || assessments.length === 0) {
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

    if (pendingAssessments.length === 0) {
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

    const checkoutUrl =
      "https://nicoproducto.lemonsqueezy.com/checkout/buy/0e2df4bf-c8da-4a40-ae06-625beaec3986?checkout[discount_code]=SANGUCHITO15";

    let sentCount = 0;
    const errors: string[] = [];

    for (const assessment of pendingAssessments) {
      const profile = profileMap.get(assessment.user_id);
      const sub = subMap.get(assessment.user_id);

      // Skip if no profile/email
      if (!profile?.email) continue;

      // Skip if not free plan
      if (sub?.plan !== "free") continue;

      // Check discount candidate logic
      const result = assessment.assessment_result as AssessmentResult;
      if (!result || !isDiscountCandidate(result)) continue;

      // Send email via Resend
      try {
        const emailHtml = buildEmailHtml(
          profile.name || "",
          result.nivel,
          result.gaps.length,
          checkoutUrl
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
            subject: "Tu diagnóstico reveló oportunidades de mejora 🎯",
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
          },
        });
        sentCount++;
      } catch (emailErr) {
        console.error(`Error sending to ${profile.email}:`, emailErr);
        errors.push(`${profile.email}: ${String(emailErr)}`);
      }
    }

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
