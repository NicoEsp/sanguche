// send-course-published-emails — invoked by the trigger_notify_course_published
// trigger on public.courses, which fires whenever is_published flips
// false → true. Catches both publish paths: the publish-scheduled-courses cron
// and manual edits from AdminCourses.tsx.
//
// Body: { course_id: uuid }
//
// Sends one email per RePremium-active user announcing the new course.
// Idempotency: (user_id, course_id) unique index on course_email_queue.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://productprepa.com";

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildEmailHtml(
  name: string,
  courseTitle: string,
  courseDescription: string | null,
  courseUrl: string
): string {
  const firstName = name?.split(" ")[0] || "ahí";
  const safeTitle = escapeHtml(courseTitle);
  const descriptionHtml = courseDescription
    ? `<p style="font-size:15px;color:#52525b;line-height:1.7;margin:0;">${escapeHtml(courseDescription)}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Nuevo curso: ${safeTitle}</title>
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
  <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 24px;">
    Acabamos de publicar un nuevo curso disponible para vos como parte de tu plan <strong>RePremium</strong>:
  </p>

  <!-- Course Card -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border:1px solid #e4e4e7;border-radius:8px;margin-bottom:24px;">
  <tr><td style="padding:24px;">
    <p style="font-size:18px;font-weight:bold;color:#18181b;margin:0 0 12px;">
      ${safeTitle}
    </p>
    ${descriptionHtml}
  </td></tr>
  </table>

  <!-- CTA Button -->
  <table width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center" style="padding:8px 0 32px;">
    <a href="${courseUrl}" target="_blank" style="display:inline-block;background:#18181b;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">
      Ver el curso →
    </a>
  </td></tr>
  </table>

  <p style="font-size:14px;color:#71717a;line-height:1.5;margin:0;">
    Cualquier feedback sobre el curso, respondé este mail directamente.
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
    const courseId = body?.course_id;

    if (!courseId || typeof courseId !== "string") {
      return new Response(
        JSON.stringify({ error: "course_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Confirm the course exists and is actually published. The trigger only
    // fires on false → true transitions, but defense in depth never hurts.
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id, slug, title, description, is_published")
      .eq("id", courseId)
      .single();

    if (courseError || !course) {
      console.error(`[send-course-published-emails] Course ${courseId} not found:`, courseError);
      return new Response(
        JSON.stringify({ error: "Course not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!course.is_published) {
      console.log(`[send-course-published-emails] Course ${courseId} is not published, skipping`);
      return new Response(
        JSON.stringify({ message: "Course not published" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[send-course-published-emails] Sending for course "${course.title}" (${courseId})`);

    // Find all RePremium-active users.
    const { data: subscriptions, error: subsError } = await supabase
      .from("user_subscriptions")
      .select("user_id")
      .eq("plan", "repremium")
      .eq("status", "active");

    if (subsError) {
      console.error("[send-course-published-emails] Error fetching subscriptions:", subsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch subscriptions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("[send-course-published-emails] No RePremium users. Exiting.");
      return new Response(
        JSON.stringify({ message: "No RePremium users", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userIds = subscriptions.map((s) => s.user_id);

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, email")
      .in("id", userIds);

    console.log(`[send-course-published-emails] ${subscriptions.length} RePremium user(s), ${profiles?.length ?? 0} profile(s) loaded`);

    const courseUrl = `${SITE_URL}/cursos/${course.slug}`;

    let sentCount = 0;
    let skippedNoEmail = 0;
    let skippedAlreadySent = 0;
    const errors: string[] = [];

    for (const profile of profiles || []) {
      if (!profile.email) {
        skippedNoEmail++;
        console.log(`[send-course-published-emails] SKIP user ${profile.id}: no email`);
        continue;
      }

      // Pre-check dedup
      const { data: existingLog } = await supabase
        .from("course_email_queue")
        .select("id")
        .eq("user_id", profile.id)
        .eq("course_id", courseId)
        .maybeSingle();

      if (existingLog) {
        skippedAlreadySent++;
        console.log(`[send-course-published-emails] SKIP ${profile.email}: already sent for course ${courseId}`);
        continue;
      }

      console.log(`[send-course-published-emails] SENDING to ${profile.email}`);

      try {
        const emailHtml = buildEmailHtml(
          profile.name || "",
          course.title,
          course.description,
          courseUrl
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
            subject: `Nuevo curso disponible: ${course.title}`,
            html: emailHtml,
          }),
        });

        const resendBody = await resendRes.text();

        if (!resendRes.ok) {
          console.error(`Resend error for ${profile.email}:`, resendBody);
          await supabase.from("course_email_queue").insert({
            user_id: profile.id,
            course_id: courseId,
            email: profile.email,
            status: "error",
            error_message: resendBody,
          });
          errors.push(`${profile.email}: ${resendBody}`);
          continue;
        }

        await supabase.from("course_email_queue").insert({
          user_id: profile.id,
          course_id: courseId,
          email: profile.email,
          status: "sent",
        });
        sentCount++;
      } catch (emailErr) {
        console.error(`Error sending to ${profile.email}:`, emailErr);
        errors.push(`${profile.email}: ${String(emailErr)}`);
      }
    }

    console.log(`[send-course-published-emails] === SUMMARY ===`);
    console.log(`[send-course-published-emails] Course: ${course.title}, Sent: ${sentCount}, Skipped (no email): ${skippedNoEmail}, Skipped (already sent): ${skippedAlreadySent}, Errors: ${errors.length}`);

    return new Response(
      JSON.stringify({
        message: `Processed ${profiles?.length ?? 0} RePremium user(s)`,
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
