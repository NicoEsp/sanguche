// send-mentoria-reminder-emails — D1 · monthly mentoría reminder.
//
// Runs on a monthly cron (see
// supabase/scripts/schedule-send-mentoria-reminder-emails.sql).
//
// Reminds active Premium / RePremium users whose monthly 1:1 session has reset
// (a new calendar month has started since their last session) that they have a
// session available to book. This mirrors the in-app `isNewMonth` logic in
// src/components/mentoria/MentoriaHero.tsx.
//
// Who we target: users who have ALREADY completed at least one mentoría
// (profiles.mentoria_completed = true). First-timers are intentionally left to
// the welcome email so we don't double-nudge a brand-new subscriber.
//
// Idempotency: mentoria_reminder_queue has UNIQUE(user_id, period), where
// period is the current 'YYYY-MM'. At most one reminder per user per month,
// even if the cron runs more than once.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ctaButton, emailShell, escapeHtml, firstNameFrom, sendResendEmail, SITE_URL } from "../_shared/email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MENTORIA_URL = `${SITE_URL}/mentoria`;

// The edge function runs in UTC, but the product is Argentina-centric, so month
// rollover is evaluated in AR time to match what users see in the app (and to
// avoid a user missing a month's reminder when their last session lands on the
// UTC side of a month boundary).
const BUSINESS_TZ = "America/Argentina/Buenos_Aires";

function yearMonthInTz(date: Date): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TZ,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);
  return {
    year: Number(parts.find((p) => p.type === "year")!.value),
    month: Number(parts.find((p) => p.type === "month")!.value),
  };
}

// A session is available if we're in a different calendar month (or year) than
// the last session — evaluated in the business timezone — or there was never one.
function isNewMonth(lastDate: string | null | undefined, now: Date): boolean {
  if (!lastDate) return true;
  const last = new Date(lastDate);
  if (isNaN(last.getTime())) return true;
  const a = yearMonthInTz(now);
  const b = yearMonthInTz(last);
  return a.year !== b.year || a.month !== b.month;
}

function currentPeriod(now: Date): string {
  const { year, month } = yearMonthInTz(now);
  return `${year}-${String(month).padStart(2, "0")}`;
}

function buildEmailHtml(name: string, isRePremium: boolean): string {
  const firstName = escapeHtml(firstNameFrom(name));
  const headline = isRePremium
    ? "Tenés tus 2 sesiones de mentoría de este mes"
    : "Tu sesión de mentoría del mes te está esperando";
  const intro = isRePremium
    ? "Arrancó un mes nuevo y con tu plan <strong>RePremium</strong> tenés <strong>2 sesiones de 45 minutos</strong> disponibles para agendar con NicoProducto."
    : "Arrancó un mes nuevo y tu <strong>sesión mensual de 45 minutos</strong> con NicoProducto está disponible para agendar.";

  const body = `<!-- Body -->
<tr><td style="padding:40px;">
  <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 16px;">
    ¡Hola ${firstName}!
  </p>
  <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 16px;">
    ${intro}
  </p>
  <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 24px;">
    Es un buen momento para revisar cómo venís con tu Career Path y trazar los próximos pasos juntos. No dejes pasar el cupo: se reinicia el mes que viene.
  </p>

  ${ctaButton(MENTORIA_URL, "Agendar mi sesión →")}

  <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0;">
    Un abrazo,<br/>NicoProducto
  </p>
</td></tr>`;

  return emailShell(headline, body);
}

interface SubRow {
  user_id: string;
  plan: string;
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

    const now = new Date();
    const period = currentPeriod(now);

    console.log(`[send-mentoria-reminder-emails] Running for period ${period}`);

    // Active premium / repremium subscribers.
    const { data: subs, error: subsError } = await supabase
      .from("user_subscriptions")
      .select("user_id, plan")
      .in("plan", ["premium", "repremium"])
      .eq("status", "active");

    if (subsError) {
      console.error("[send-mentoria-reminder-emails] Error fetching subscriptions:", subsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch subscriptions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!subs || subs.length === 0) {
      console.log("[send-mentoria-reminder-emails] No active premium users. Exiting.");
      return new Response(
        JSON.stringify({ message: "No active premium users", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const planByUser = new Map<string, string>(
      (subs as SubRow[]).map((s) => [s.user_id, s.plan]),
    );
    const userIds = [...planByUser.keys()];

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, name, email, mentoria_completed, last_mentoria_date")
      .in("id", userIds);

    if (profilesError) {
      console.error("[send-mentoria-reminder-emails] Error fetching profiles:", profilesError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch profiles" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let sentCount = 0;
    let skippedNoEmail = 0;
    let skippedNotEligible = 0;
    let skippedAlreadySent = 0;
    const errors: string[] = [];

    for (const profile of profiles || []) {
      // Only remind engaged users whose session has reset this month.
      if (!profile.mentoria_completed || !isNewMonth(profile.last_mentoria_date, now)) {
        skippedNotEligible++;
        continue;
      }

      if (!profile.email) {
        skippedNoEmail++;
        console.log(`[send-mentoria-reminder-emails] SKIP user ${profile.id}: no email`);
        continue;
      }

      const plan = planByUser.get(profile.id) ?? "premium";
      const isRePremium = plan === "repremium";

      // Atomically claim the (user, period) slot BEFORE sending. The UNIQUE
      // constraint means only one run can insert; a concurrent/overlapping run
      // hits a conflict and skips here — so a user never receives two reminders
      // even if the function is invoked more than once at a time (TOCTOU-safe).
      const { data: claimed, error: claimError } = await supabase
        .from("mentoria_reminder_queue")
        .insert({
          user_id: profile.id,
          period,
          plan,
          email: profile.email,
          status: "sending",
        })
        .select("id")
        .single();

      if (claimError || !claimed) {
        skippedAlreadySent++;
        console.log(`[send-mentoria-reminder-emails] SKIP ${profile.email}: already claimed for ${period}`);
        continue;
      }

      console.log(`[send-mentoria-reminder-emails] SENDING to ${profile.email} (${plan})`);

      try {
        const html = buildEmailHtml(profile.name || "", isRePremium);
        const subject = isRePremium
          ? "Tenés tus 2 sesiones de mentoría de este mes 🗓️"
          : "Tu sesión de mentoría del mes está disponible 🗓️";

        const result = await sendResendEmail({
          apiKey: resendApiKey,
          to: profile.email,
          subject,
          html,
        });

        await supabase
          .from("mentoria_reminder_queue")
          .update({
            status: result.ok ? "sent" : "error",
            error_message: result.ok ? null : result.body,
          })
          .eq("id", claimed.id);

        if (!result.ok) {
          console.error(`[send-mentoria-reminder-emails] Resend error for ${profile.email}:`, result.body);
          errors.push(`${profile.email}: ${result.body}`);
          continue;
        }
        sentCount++;
      } catch (emailErr) {
        console.error(`[send-mentoria-reminder-emails] Error sending to ${profile.email}:`, emailErr);
        errors.push(`${profile.email}: ${String(emailErr)}`);
        await supabase
          .from("mentoria_reminder_queue")
          .update({ status: "error", error_message: String(emailErr) })
          .eq("id", claimed.id);
      }
    }

    console.log(`[send-mentoria-reminder-emails] === SUMMARY (${period}) ===`);
    console.log(
      `[send-mentoria-reminder-emails] Candidates: ${userIds.length}, Sent: ${sentCount}, ` +
      `Skipped (not eligible): ${skippedNotEligible}, Skipped (no email): ${skippedNoEmail}, ` +
      `Skipped (already sent): ${skippedAlreadySent}, Errors: ${errors.length}`,
    );

    return new Response(
      JSON.stringify({
        message: `Processed ${userIds.length} active premium user(s)`,
        period,
        sent: sentCount,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[send-mentoria-reminder-emails] Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
