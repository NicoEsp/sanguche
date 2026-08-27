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

// ── Checkouts y cupones ─────────────────────────────────────────────────────

const CHECKOUT_URLS = {
  premium: "https://nicoproducto.lemonsqueezy.com/checkout/buy/f5d59ed3-b542-4747-8cbd-5c6994aff5b1",
  repremium: "https://nicoproducto.lemonsqueezy.com/checkout/buy/0e2df4bf-c8da-4a40-ae06-625beaec3986",
} as const;

// SANGU10 está aplicado a Premium en LemonSqueezy y SANGU15 a RePremium. Los
// cupones NO son intercambiables: mandar SANGU15 a un checkout de Premium hace
// que LemonSqueezy lo rechace en la cara del usuario. Por eso cada tramo lleva
// el checkout de su propio plan y nunca se combinan cruzados.
const COUPONS = {
  premium: "SANGU10",
  repremium: "SANGU15",
} as const;

function checkoutUrlFor(plan: keyof typeof CHECKOUT_URLS, coupon: string | null): string {
  const base = CHECKOUT_URLS[plan];
  return coupon ? `${base}?checkout[discount_code]=${coupon}` : base;
}

// ── Oferta según la nota de la evaluación ───────────────────────────────────

type ScoreTier = "premium_10" | "premium_sin_cupon" | "repremium_15";

/**
 * Tramo de oferta según `promedioGlobal` (escala 1 a 5).
 *
 * Los cortes cierran el rango completo a propósito: la definición original
 * ("menor a 3", "mayor a 3 pero menor a 3,49", "igual o mayor a 3,5") dejaba
 * sin tramo al 3,00 exacto y a la franja 3,49–3,50, y esas notas existen
 * porque promedioGlobal se redondea a dos decimales.
 */
function resolveScoreTier(promedioGlobal: number): ScoreTier {
  if (promedioGlobal < 3) return "premium_10";
  if (promedioGlobal < 3.5) return "premium_sin_cupon";
  return "repremium_15";
}

// Evaluaciones cuya oferta topa en Premium: por alta que sea la nota, no
// escalan a RePremium. sin_experiencia mide afinidad con producto, no skill de
// PM, así que un 4,5 ahí no significa que la persona necesite el plan más caro.
// El tramo alto cae entonces en la misma oferta de Premium con SANGU10.
const TOPE_EN_PREMIUM: ReadonlySet<AssessmentType> = new Set(["sin_experiencia"]);

function resolveTierForType(type: AssessmentType, promedioGlobal: number): ScoreTier {
  const tier = resolveScoreTier(promedioGlobal);
  if (tier === "repremium_15" && TOPE_EN_PREMIUM.has(type)) return "premium_10";
  return tier;
}

interface Offer {
  plan: keyof typeof CHECKOUT_URLS;
  coupon: string | null;
  /** Cómo encuadramos la nota antes de pasar a la oferta. */
  framing: string;
  boxTitle: string;
  boxItems: string[];
  offerText: string;
  ctaLabel: string;
}

// Los beneficios espejan las cards de /planes, cupo de sesiones incluido: si el
// mail promete algo distinto de lo que la página muestra, la venta arranca con
// una expectativa mal puesta.
const PREMIUM_ITEMS = [
  "✅ 1 sesión de mentoría 1:1 por mes, no acumulable",
  "✅ Tu Career Path con objetivos concretos",
  "✅ Recursos curados según tus áreas de mejora",
  "✅ Seguimiento de tu progreso mes a mes",
];

const REPREMIUM_ITEMS = [
  "✅ 2 sesiones de mentoría 1:1 por mes, no acumulables",
  "✅ Prioridad para agendar sesión",
  "✅ Acceso completo a todos los cursos",
  "✅ Feedback personalizado en tus ejercicios",
  "✅ Canal directo de comunicación",
];

const OFFERS: Record<ScoreTier, Offer> = {
  premium_10: {
    plan: "premium",
    coupon: COUPONS.premium,
    framing:
      "Eso no es malo, al contrario: significa que hay mucho espacio para crecer rápido si enfocás bien los esfuerzos.",
    boxTitle: "Con Premium podés:",
    boxItems: PREMIUM_ITEMS,
    offerText:
      "Preparamos un <strong>10% OFF en tu primer mes</strong> para que puedas arrancar con todo:",
    ctaLabel: "Activá tu 10% OFF →",
  },
  premium_sin_cupon: {
    plan: "premium",
    coupon: null,
    framing:
      "Tenés una base razonable: lo que falta ahora es ordenar el camino y sostener el ritmo.",
    boxTitle: "Con Premium podés:",
    boxItems: PREMIUM_ITEMS,
    offerText: "Mirá lo que incluye el plan Premium:",
    ctaLabel: "Conocer Premium →",
  },
  repremium_15: {
    plan: "repremium",
    coupon: COUPONS.repremium,
    framing:
      "Tenés una base sólida, así que el salto ya no es de fundamentos: es de profundidad, y eso se acelera con acompañamiento fuerte.",
    boxTitle: "Con RePremium podés:",
    boxItems: REPREMIUM_ITEMS,
    offerText:
      "Preparamos un <strong>15% OFF en tu primer mes</strong> para que puedas arrancar con todo:",
    ctaLabel: "Activá tu 15% OFF →",
  },
};

// ── Copy de apertura según la evaluación que hizo la persona ────────────────

interface TypeIntro {
  subject: string;
  intro: (gapCount: number, nivel: string) => string;
}

// Sólo para las evaluaciones que pitchean una suscripción. El asunto y el
// intro siguen atados al tipo de evaluación (no es lo mismo un diagnóstico de
// PM con experiencia que un mapa de afinidad); lo que decide la nota es la
// oferta, no el encuadre.
const SUBSCRIPTION_INTROS: Record<"experimentado" | "sin_experiencia", TypeIntro> = {
  experimentado: {
    subject: "Tu diagnóstico reveló oportunidades de mejora 🎯",
    intro: (gapCount, nivel) =>
      `Hace unos días completaste tu diagnóstico en ProductPrepa y detectamos <strong>${gapCount} áreas de mejora</strong> en tu perfil de <strong>PM ${nivel}</strong>.`,
  },
  sin_experiencia: {
    subject: "Tu mapa de afinidad marcó por dónde empezar 🎯",
    intro: (gapCount) =>
      `Hace unos días completaste tu mapa de afinidad en ProductPrepa y detectamos <strong>${gapCount} áreas por explorar</strong> antes de dar el salto a producto digital.`,
  },
};

// ── Evaluaciones que pitchean otro producto ─────────────────────────────────

interface ProductVariant {
  subject: string;
  intro: (gapCount: number, nivel: string) => string;
  framing: string;
  boxTitle: string;
  boxItems: string[];
  offerText: string;
  ctaUrl: string;
  ctaLabel: string;
}

// builder y lider no venden una suscripción sino Productastic Review y
// ProductPrepa for B2B. La nota no cambia esa recomendación, así que estos dos
// quedan fuera de la lógica por tramos y no llevan cupón.
const PRODUCT_VARIANTS: Record<"builder" | "lider", ProductVariant> = {
  builder: {
    subject: "Tu diagnóstico de método reveló dónde enfocar 🎯",
    intro: (gapCount) =>
      `Hace unos días completaste tu diagnóstico de método en ProductPrepa y detectamos <strong>${gapCount} áreas donde estás construyendo a pura intuición</strong>.`,
    framing:
      "Eso no es malo, al contrario: significa que hay mucho espacio para crecer rápido si enfocás bien los esfuerzos.",
    boxTitle: "Con Productastic Review obtenés:",
    boxItems: [
      "✅ Una revisión a fondo de tu producto, de punta a punta",
      "✅ Devolución concreta y priorizada sobre qué ajustar",
      "✅ La teoría que te falta, aplicada a lo que estás construyendo",
      "✅ Una mirada externa experta, sin comprometerte a una suscripción",
    ],
    offerText: "Tu producto merece una revisión a fondo. Mirá lo que incluye:",
    ctaUrl: "https://productprepa.com/planes",
    ctaLabel: "Conocer Productastic Review →",
  },
  lider: {
    subject: "El diagnóstico de tu equipo reveló dónde nivelar 🎯",
    intro: (gapCount) =>
      `Hace unos días completaste el diagnóstico de tu equipo en ProductPrepa y detectamos <strong>${gapCount} dominios donde el equipo puede nivelar</strong> su forma de construir producto.`,
    framing:
      "Eso no es malo, al contrario: significa que hay mucho espacio para crecer rápido si enfocás bien los esfuerzos.",
    boxTitle: "Con ProductPrepa for B2B tu equipo obtiene:",
    boxItems: [
      "✅ Un programa a medida según las brechas detectadas",
      "✅ Una base común de procesos para todo el equipo",
      "✅ Actualización a la forma actual de construir producto",
      "✅ Seguimiento del progreso del equipo en el tiempo",
    ],
    offerText: "Nivelá a tu equipo con un programa pensado para todo el grupo:",
    ctaUrl: "https://productprepa.com/empresas",
    ctaLabel: "Ver ProductPrepa for B2B →",
  },
};

// ── Armado del mail ─────────────────────────────────────────────────────────

interface EmailPlan {
  subject: string;
  intro: string;
  framing: string;
  boxTitle: string;
  boxItems: string[];
  offerText: string;
  ctaUrl: string;
  ctaLabel: string;
  couponLine: string | null;
  // Para la auditoría en discount_email_queue: sin esto no hay forma de medir
  // qué tramo convierte mejor.
  tier: ScoreTier | null;
  coupon: string | null;
}

function resolveEmailPlan(type: AssessmentType, result: AssessmentResult): EmailPlan {
  const gapCount = result.gaps?.length ?? 0;

  if (type === "builder" || type === "lider") {
    const variant = PRODUCT_VARIANTS[type];
    return {
      subject: variant.subject,
      intro: variant.intro(gapCount, result.nivel),
      framing: variant.framing,
      boxTitle: variant.boxTitle,
      boxItems: variant.boxItems,
      offerText: variant.offerText,
      ctaUrl: variant.ctaUrl,
      ctaLabel: variant.ctaLabel,
      couponLine: null,
      tier: null,
      coupon: null,
    };
  }

  const intro = SUBSCRIPTION_INTROS[type];
  const tier = resolveTierForType(type, result.promedioGlobal);
  const offer = OFFERS[tier];

  return {
    subject: intro.subject,
    intro: intro.intro(gapCount, result.nivel),
    framing: offer.framing,
    boxTitle: offer.boxTitle,
    boxItems: offer.boxItems,
    offerText: offer.offerText,
    ctaUrl: checkoutUrlFor(offer.plan, offer.coupon),
    ctaLabel: offer.ctaLabel,
    couponLine: offer.coupon
      ? `Usá el cupón <strong>${offer.coupon}</strong> si preferís ir directo al checkout.`
      : null,
    tier,
    coupon: offer.coupon,
  };
}

function buildEmailHtml(name: string, plan: EmailPlan): string {
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
    ${plan.intro}
  </p>
  <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 24px;">
    ${plan.framing}
  </p>

  <!-- Value Prop Box -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border:1px solid #e4e4e7;border-radius:8px;margin-bottom:24px;">
  <tr><td style="padding:24px;">
    <p style="font-size:15px;font-weight:bold;color:#18181b;margin:0 0 12px;">${plan.boxTitle}</p>
    <p style="font-size:14px;color:#52525b;line-height:1.7;margin:0;">
      ${plan.boxItems.join("<br/>\n      ")}
    </p>
  </td></tr>
  </table>

  <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 24px;">
    ${plan.offerText}
  </p>

  <!-- CTA Button -->
  <table width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center" style="padding:8px 0 32px;">
    <a href="${plan.ctaUrl}" target="_blank" style="display:inline-block;background:#18181b;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">
      ${plan.ctaLabel}
    </a>
  </td></tr>
  </table>
${plan.couponLine ? `
  <p style="font-size:14px;color:#71717a;line-height:1.5;margin:0;">
    ${plan.couponLine}
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
    // "A los dos días" de completar la evaluación. El cron es diario, así que
    // en la práctica el mail cae entre las 48h y las 72h.
    const MIN_AGE_HOURS = 48;
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

    let sentCount = 0;
    let skippedNoEmail = 0;
    let skippedNotFree = 0;
    let skippedSinResultado = 0;
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
        console.log(`[send-discount-email] SKIP user ${assessment.user_id}: already emailed for a previous assessment`);
        continue;
      }

      // Skip if not free plan
      if (sub?.plan !== "free") {
        skippedNotFree++;
        console.log(`[send-discount-email] SKIP user ${assessment.user_id}: plan is '${sub?.plan}' (not free)`);
        continue;
      }

      // Ya no hay filtro de "candidato a descuento": todo el que completó la
      // evaluación recibe su mail, y la nota decide qué oferta lleva. Lo único
      // que descarta una fila es no tener resultado con el que armar el copy.
      const result = assessment.assessment_result as AssessmentResult;
      if (!result || typeof result.promedioGlobal !== "number") {
        skippedSinResultado++;
        console.log(`[send-discount-email] SKIP user ${assessment.user_id}: assessment sin resultado utilizable`);
        continue;
      }

      // Las evaluaciones legacy (sin tipo) eran la de experiencia previa.
      const assessmentType: AssessmentType =
        (assessment.assessment_type as AssessmentType | null) ?? "experimentado";

      const emailPlan = resolveEmailPlan(assessmentType, result);

      console.log(`[send-discount-email] SENDING to user ${assessment.user_id} (tipo: ${assessmentType}, nivel: ${result.nivel}, gaps: ${result.gaps?.length ?? 0}, avg: ${result.promedioGlobal}, tramo: ${emailPlan.tier ?? 'n/a'}, cupón: ${emailPlan.coupon ?? 'sin cupón'})`);

      // Send email via Resend
      try {
        const emailHtml = buildEmailHtml(profile.name || "", emailPlan);

        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "ProductPrepa <hola@productprepa.com>",
            to: [profile.email],
            subject: emailPlan.subject,
            html: emailHtml,
          }),
        });

        const resendBody = await resendRes.text();

        if (!resendRes.ok) {
          console.error(`Resend error for user ${assessment.user_id}:`, resendBody);
          await supabase.from("discount_email_queue").insert({
            user_id: assessment.user_id,
            assessment_id: assessment.id,
            email: profile.email,
            status: "error",
            error_message: resendBody,
            assessment_data: {
              nivel: result.nivel,
              gaps: result.gaps?.length ?? 0,
              promedio: result.promedioGlobal,
              tipo: assessmentType,
              tramo: emailPlan.tier,
              cupon: emailPlan.coupon,
            },
          });
          errors.push(`user ${assessment.user_id}: ${resendBody}`);
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
            gaps: result.gaps?.length ?? 0,
            promedio: result.promedioGlobal,
            tipo: assessmentType,
            tramo: emailPlan.tier,
            cupon: emailPlan.coupon,
          },
        });
        // Cubrir también duplicados dentro de la misma corrida: si el usuario
        // tiene más de un assessment pendiente en la ventana, el segundo no
        // debe generar otro email.
        alreadyEmailedUsers.add(assessment.user_id);
        sentCount++;
      } catch (emailErr) {
        console.error(`Error sending to user ${assessment.user_id}:`, emailErr);
        errors.push(`user ${assessment.user_id}: ${String(emailErr)}`);
      }
    }

    console.log(`[send-discount-email] === SUMMARY ===`);
    console.log(`[send-discount-email] Total in window: ${assessments.length}, Pending: ${pendingAssessments.length}`);
    console.log(`[send-discount-email] Sent: ${sentCount}, Skipped (no email): ${skippedNoEmail}, Skipped (not free): ${skippedNotFree}, Skipped (sin resultado): ${skippedSinResultado}, Skipped (already emailed): ${skippedAlreadyEmailed}, Errors: ${errors.length}`);

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
