// send-downloadable-emails — announces newly uploaded premium downloadables to
// Premium / RePremium subscribers.
//
// Runs every 15 minutes (cron created via
// supabase/scripts/schedule-send-downloadable-emails.sql).
//
// Batching: one email per user per run, listing every eligible resource that
// user hasn't been told about yet. Uploading four PDFs in a row therefore
// produces a single "sumamos 4 descargables" email instead of four separate
// ones — the reason this is cron-windowed rather than a DB trigger like
// send-course-published-emails (courses go out one at a time; resources don't).
//
// Scope: rows that are is_active, access_level = 'premium' and NOT tied to a
// competency (condition_domain IS NULL). Conditional rows are the personalised
// SkillGaps recommendations — they surface per user based on their own
// assessment, so broadcasting them to everyone would be wrong.
//
// Idempotency: downloadable_email_queue has UNIQUE(user_id, resource_id) and
// the pending set is computed per user against that table, so the lookback
// window can overlap freely without re-announcing anything.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  ctaButton,
  emailShell,
  escapeHtml,
  firstNameFrom,
  sendResendEmail,
  SITE_URL,
} from "../_shared/email.ts";
import { maskEmail } from "../_shared/pii.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const DESCARGABLES_URL = `${SITE_URL}/descargables`;

// Wide enough to self-heal if the cron misses a few runs, short enough that a
// resource is never announced long after it went up. The overlap with previous
// runs is free: dedup is per (user, resource), not per window.
const LOOKBACK_HOURS = 24;

// Mirrors the labels in src/pages/admin/AdminDescargables.tsx.
const TYPE_LABELS: Record<string, string> = {
  pdf: "PDF",
  template: "Template",
  checklist: "Checklist",
  guide: "Guía",
  image: "Imagen",
};

interface ResourceRow {
  id: string;
  title: string;
  description: string | null;
  type: string;
}

function planLabel(plan: string): string {
  return plan === "repremium" ? "RePremium" : "Premium";
}

function resourceCard(resource: ResourceRow): string {
  const typeLabel = TYPE_LABELS[resource.type] ?? resource.type;
  const description = resource.description
    ? `<p style="font-size:15px;color:#52525b;line-height:1.7;margin:8px 0 0;">${escapeHtml(resource.description)}</p>`
    : "";

  return `<table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border:1px solid #e4e4e7;border-radius:8px;margin-bottom:12px;">
  <tr><td style="padding:20px 24px;">
    <p style="font-size:12px;font-weight:600;color:#71717a;letter-spacing:0.04em;text-transform:uppercase;margin:0 0 6px;">${escapeHtml(typeLabel)}</p>
    <p style="font-size:17px;font-weight:bold;color:#18181b;margin:0;">${escapeHtml(resource.title)}</p>
    ${description}
  </td></tr>
  </table>`;
}

function buildEmailHtml(
  name: string,
  plan: string,
  resources: ResourceRow[],
): string {
  const firstName = escapeHtml(firstNameFrom(name));
  const isPlural = resources.length > 1;

  const headline = isPlural
    ? `Sumamos ${resources.length} descargables nuevos`
    : "Sumamos un descargable nuevo";

  const intro = isPlural
    ? `Subimos <strong>${resources.length} descargables nuevos</strong> a la biblioteca, disponibles para vos como parte de tu plan <strong>${planLabel(plan)}</strong>:`
    : `Subimos un <strong>descargable nuevo</strong> a la biblioteca, disponible para vos como parte de tu plan <strong>${planLabel(plan)}</strong>:`;

  const body = `<!-- Body -->
<tr><td style="padding:40px;">
  <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 16px;">
    ¡Hola ${firstName}!
  </p>
  <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 24px;">
    ${intro}
  </p>

  ${resources.map(resourceCard).join("\n  ")}

  ${ctaButton(DESCARGABLES_URL, isPlural ? "Ver los descargables →" : "Ver el descargable →")}

  <p style="font-size:14px;color:#71717a;line-height:1.5;margin:0;">
    Cualquier feedback sobre el material, respondé este mail directamente.
  </p>
</td></tr>`;

  return emailShell(headline, body);
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

    const since = new Date(Date.now() - LOOKBACK_HOURS * 60 * 60 * 1000);
    console.log(
      `[send-downloadable-emails] Scanning premium downloadables created since ${since.toISOString()}`,
    );

    const { data: resources, error: resourcesError } = await supabase
      .from("downloadable_resources")
      .select("id, title, description, type")
      .eq("is_active", true)
      .eq("access_level", "premium")
      .is("condition_domain", null)
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: true });

    if (resourcesError) {
      console.error("[send-downloadable-emails] Error fetching resources:", resourcesError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch resources" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!resources || resources.length === 0) {
      console.log("[send-downloadable-emails] No new premium downloadables in window. Exiting.");
      return new Response(
        JSON.stringify({ message: "No new downloadables in window", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Audience: Premium + RePremium who can actually open the resource.
    //
    // The status filter mirrors useSubscription.ts, where access is
    // `isActive || isComped` — is_comped is the admin override that keeps a
    // user in when LemonSqueezy has already marked the subscription cancelled.
    // Filtering on status alone would email a strictly smaller set than the one
    // that sees the download unlocked in the app.
    const { data: subs, error: subsError } = await supabase
      .from("user_subscriptions")
      .select("user_id, plan")
      .in("plan", ["premium", "repremium"])
      .or("status.eq.active,is_comped.is.true");

    if (subsError) {
      console.error("[send-downloadable-emails] Error fetching subscriptions:", subsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch subscriptions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!subs || subs.length === 0) {
      console.log("[send-downloadable-emails] No active premium users. Exiting.");
      return new Response(
        JSON.stringify({ message: "No active premium users", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const planByUser = new Map<string, string>(
      (subs as Array<{ user_id: string; plan: string }>).map((s) => [s.user_id, s.plan]),
    );
    const userIds = [...planByUser.keys()];

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, name, email")
      .in("id", userIds);

    if (profilesError) {
      console.error("[send-downloadable-emails] Error fetching profiles:", profilesError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch profiles" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const resourceIds = (resources as ResourceRow[]).map((r) => r.id);

    // Everything already announced, restricted to the users and resources in
    // play this run. Rows left in 'error' still count as announced — same as
    // the other email flows, a failed send is not retried, it's kept for audit.
    const { data: alreadySent, error: queueError } = await supabase
      .from("downloadable_email_queue")
      .select("user_id, resource_id")
      .in("user_id", userIds)
      .in("resource_id", resourceIds);

    if (queueError) {
      console.error("[send-downloadable-emails] Error fetching queue:", queueError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch email queue" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const announced = new Set(
      (alreadySent || []).map((row) => `${row.user_id}:${row.resource_id}`),
    );

    let sentCount = 0;
    let skippedNoEmail = 0;
    let skippedNothingNew = 0;
    let skippedClaimed = 0;
    const errors: string[] = [];

    for (const profile of profiles || []) {
      if (!profile.email) {
        skippedNoEmail++;
        console.log(`[send-downloadable-emails] SKIP user ${profile.id}: no email`);
        continue;
      }

      const pending = (resources as ResourceRow[]).filter(
        (r) => !announced.has(`${profile.id}:${r.id}`),
      );

      if (pending.length === 0) {
        skippedNothingNew++;
        continue;
      }

      // Claim the whole batch BEFORE sending. A partial conflict rejects the
      // entire insert, so a concurrent/overlapping run loses the race and skips
      // here rather than sending the same resources twice (TOCTOU-safe).
      const { data: claimed, error: claimError } = await supabase
        .from("downloadable_email_queue")
        .insert(
          pending.map((r) => ({
            user_id: profile.id,
            resource_id: r.id,
            email: profile.email,
            status: "sending",
          })),
        )
        .select("id");

      if (claimError || !claimed) {
        skippedClaimed++;
        console.log(
          `[send-downloadable-emails] SKIP ${maskEmail(profile.email)}: batch already claimed`,
        );
        continue;
      }

      const claimedIds = claimed.map((c) => c.id);
      const plan = planByUser.get(profile.id) ?? "premium";

      console.log(
        `[send-downloadable-emails] SENDING to ${maskEmail(profile.email)} (${pending.length} resource(s), ${plan})`,
      );

      try {
        const html = buildEmailHtml(profile.name || "", plan, pending);
        const subject = pending.length === 1
          ? `Nuevo descargable disponible: ${pending[0].title}`
          : `Sumamos ${pending.length} descargables nuevos a tu biblioteca 📚`;

        const result = await sendResendEmail({
          apiKey: resendApiKey,
          to: profile.email,
          subject,
          html,
        });

        // sent_at is stamped only on a real delivery. Claim rows and the
        // migration's backfill rows leave it null, so the queue can never
        // report a send time for an email that never went out.
        const { error: statusError } = await supabase
          .from("downloadable_email_queue")
          .update({
            status: result.ok ? "sent" : "error",
            error_message: result.ok ? null : result.body,
            sent_at: result.ok ? new Date().toISOString() : null,
          })
          .in("id", claimedIds);

        // supabase-js resolves with an error instead of throwing, so this can't
        // be left to the catch below. The rows still count as announced (nobody
        // gets a duplicate), but they stay labelled 'sending' — log loudly so
        // the audit trail doesn't go wrong silently.
        if (statusError) {
          console.error(
            `[send-downloadable-emails] Send ${result.ok ? "succeeded" : "failed"} for ${maskEmail(profile.email)} but the queue update did not land (rows stuck in 'sending'):`,
            statusError,
          );
        }

        if (!result.ok) {
          console.error(
            `[send-downloadable-emails] Resend error for ${maskEmail(profile.email)}:`,
            result.body,
          );
          errors.push(`${maskEmail(profile.email)}: ${result.body}`);
          continue;
        }
        sentCount++;
      } catch (emailErr) {
        console.error(
          `[send-downloadable-emails] Error sending to ${maskEmail(profile.email)}:`,
          emailErr,
        );
        errors.push(`${maskEmail(profile.email)}: ${String(emailErr)}`);
        const { error: statusError } = await supabase
          .from("downloadable_email_queue")
          .update({ status: "error", error_message: String(emailErr) })
          .in("id", claimedIds);
        if (statusError) {
          console.error(
            `[send-downloadable-emails] Queue update did not land for ${maskEmail(profile.email)} after a send error (rows stuck in 'sending'):`,
            statusError,
          );
        }
      }
    }

    console.log(`[send-downloadable-emails] === SUMMARY ===`);
    console.log(
      `[send-downloadable-emails] Resources in window: ${resources.length}, ` +
        `Candidates: ${userIds.length}, Sent: ${sentCount}, ` +
        `Skipped (nothing new): ${skippedNothingNew}, Skipped (no email): ${skippedNoEmail}, ` +
        `Skipped (already claimed): ${skippedClaimed}, Errors: ${errors.length}`,
    );

    // Only counts go in the body. The function runs with verify_jwt = false, so
    // anyone can invoke it and read this response — the per-recipient failures
    // carry addresses (masked, but still) and belong in the logs, not here.
    return new Response(
      JSON.stringify({
        message: `Processed ${userIds.length} active premium user(s)`,
        resources: resources.length,
        sent: sentCount,
        errors: errors.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[send-downloadable-emails] Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
