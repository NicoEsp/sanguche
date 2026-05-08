// send-exercise-emails — runs every 15 minutes (cron job created via
// supabase/scripts/schedule-send-exercise-emails.sql).
//
// For each user who got at least one exercise assigned in the last 16 minutes,
// sends a single email summarizing the new exercises with a CTA to /mentoria.
// Window-based grouping (instead of one mail per exercise) so that admins
// creating several exercises in a row don't spam the user.
//
// Idempotency: each batch is keyed by (user_id, first_exercise_id). The unique
// index on exercise_email_queue rejects duplicates if the cron re-runs over
// the same window.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// 16 min covers the 15-min cron window with a tiny overlap so an exercise
// inserted at the boundary doesn't fall through the cracks. The dedup key
// (first_exercise_id) makes the overlap safe.
const WINDOW_MINUTES = 16;
const MENTORIA_URL = "https://productprepa.com/mentoria";

function buildEmailHtml(name: string, exerciseCount: number): string {
  const firstName = name?.split(" ")[0] || "ahí";
  const isPlural = exerciseCount > 1;
  const noun = isPlural ? "ejercicios nuevos" : "ejercicio nuevo";
  const verb = isPlural ? "te asignamos" : "te asignamos";
  const objects = isPlural ? "ellos" : "él";

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Tenés ${noun} en tu mentoría</title>
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
    ${verb} <strong>${exerciseCount} ${noun}</strong> en tu plan de mentoría.
  </p>
  <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 24px;">
    Cada ejercicio es una oportunidad concreta de aplicar lo que vas aprendiendo y ver tus avances reflejados. Cuando te metas con ${objects}, recordá: el objetivo no es resolverlo perfecto, es construir criterio.
  </p>

  <!-- CTA Button -->
  <table width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center" style="padding:8px 0 32px;">
    <a href="${MENTORIA_URL}" target="_blank" style="display:inline-block;background:#18181b;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">
      Ver mis ejercicios →
    </a>
  </td></tr>
  </table>

  <p style="font-size:14px;color:#71717a;line-height:1.5;margin:0;">
    Si tenés dudas sobre alguno, respondé este mail directamente y lo charlamos.
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

interface ExerciseRow {
  id: string;
  user_id: string;
  exercise_title: string;
  created_at: string;
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
    const windowStart = new Date(now.getTime() - WINDOW_MINUTES * 60 * 1000);

    console.log(
      `[send-exercise-emails] Scanning exercises created since ${windowStart.toISOString()}`
    );

    const { data: exercises, error: fetchError } = await supabase
      .from("user_exercises")
      .select("id, user_id, exercise_title, created_at")
      .gte("created_at", windowStart.toISOString())
      .order("created_at", { ascending: true });

    if (fetchError) {
      console.error("[send-exercise-emails] Error fetching exercises:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch exercises" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!exercises || exercises.length === 0) {
      console.log("[send-exercise-emails] No exercises in window. Exiting.");
      return new Response(
        JSON.stringify({ message: "No exercises in window", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Group by user_id, preserving the ascending created_at order so [0] is
    // always the oldest exercise of the batch (used as dedup key).
    const byUser = new Map<string, ExerciseRow[]>();
    for (const ex of exercises as ExerciseRow[]) {
      const list = byUser.get(ex.user_id) ?? [];
      list.push(ex);
      byUser.set(ex.user_id, list);
    }

    const userIds = [...byUser.keys()];
    console.log(`[send-exercise-emails] ${exercises.length} exercises across ${userIds.length} user(s)`);

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, email")
      .in("id", userIds);

    const profileMap = new Map(
      (profiles || []).map((p) => [p.id, p])
    );

    let sentCount = 0;
    let skippedNoEmail = 0;
    let skippedAlreadySent = 0;
    const errors: string[] = [];

    for (const [userId, batch] of byUser.entries()) {
      const profile = profileMap.get(userId);
      if (!profile?.email) {
        skippedNoEmail++;
        console.log(`[send-exercise-emails] SKIP user ${userId}: no email`);
        continue;
      }

      const firstExerciseId = batch[0].id;
      const exerciseIds = batch.map((e) => e.id);

      // Pre-check: did we already send for this batch (identified by oldest id)?
      const { data: existingLog } = await supabase
        .from("exercise_email_queue")
        .select("id")
        .eq("user_id", userId)
        .eq("first_exercise_id", firstExerciseId)
        .maybeSingle();

      if (existingLog) {
        skippedAlreadySent++;
        console.log(`[send-exercise-emails] SKIP ${profile.email}: already sent for batch ${firstExerciseId}`);
        continue;
      }

      console.log(`[send-exercise-emails] SENDING to ${profile.email} (${batch.length} exercise(s))`);

      try {
        const emailHtml = buildEmailHtml(profile.name || "", batch.length);
        const subject = batch.length === 1
          ? "Tenés un ejercicio nuevo en tu mentoría 🎯"
          : `Tenés ${batch.length} ejercicios nuevos en tu mentoría 🎯`;

        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "ProductPrepa <hola@productprepa.com>",
            to: [profile.email],
            subject,
            html: emailHtml,
          }),
        });

        const resendBody = await resendRes.text();

        if (!resendRes.ok) {
          console.error(`Resend error for ${profile.email}:`, resendBody);
          await supabase.from("exercise_email_queue").insert({
            user_id: userId,
            first_exercise_id: firstExerciseId,
            exercise_ids: exerciseIds,
            exercise_count: batch.length,
            email: profile.email,
            status: "error",
            error_message: resendBody,
          });
          errors.push(`${profile.email}: ${resendBody}`);
          continue;
        }

        await supabase.from("exercise_email_queue").insert({
          user_id: userId,
          first_exercise_id: firstExerciseId,
          exercise_ids: exerciseIds,
          exercise_count: batch.length,
          email: profile.email,
          status: "sent",
        });
        sentCount++;
      } catch (emailErr) {
        console.error(`Error sending to ${profile.email}:`, emailErr);
        errors.push(`${profile.email}: ${String(emailErr)}`);
      }
    }

    console.log(`[send-exercise-emails] === SUMMARY ===`);
    console.log(`[send-exercise-emails] Users in window: ${userIds.length}, Sent: ${sentCount}, Skipped (no email): ${skippedNoEmail}, Skipped (already sent): ${skippedAlreadySent}, Errors: ${errors.length}`);

    return new Response(
      JSON.stringify({
        message: `Processed ${userIds.length} user(s)`,
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
