// Shared transactional-email helpers for ProductPrepa edge functions.
//
// Centralizes the Resend call and the common HTML shell so new emails stay
// visually consistent with the existing hand-rolled templates
// (send-welcome-email, send-exercise-emails, etc.). Existing functions were
// left untouched; new senders (dunning, cancellation, mentoría reminder)
// build on this.

export const SITE_URL = "https://productprepa.com";
const FROM = "ProductPrepa <hola@productprepa.com>";

// First name for greetings, mirroring the pattern used across the other
// templates: `name?.split(" ")[0] || "ahí"`.
export function firstNameFrom(name: string | null | undefined): string {
  return (name?.trim().split(" ")[0]) || "ahí";
}

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// The standard card layout: dark header with the 🥪 wordmark and the muted
// footer, matching every other ProductPrepa email.
export function emailShell(title: string, bodyInner: string): string {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${escapeHtml(title)}</title>
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
    © ${year} ProductPrepa · hola@productprepa.com
  </p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

// A dark pill CTA button, matching the other templates.
export function ctaButton(href: string, label: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center" style="padding:8px 0 32px;">
    <a href="${href}" target="_blank" style="display:inline-block;background:#18181b;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">
      ${label}
    </a>
  </td></tr>
  </table>`;
}

export interface SendEmailResult {
  ok: boolean;
  status: number;
  body: string;
}

// Thin wrapper over the Resend REST API. Returns the outcome instead of
// throwing so callers can record it in their queue tables.
export async function sendResendEmail(opts: {
  apiKey: string;
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<SendEmailResult> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
      ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
    }),
  });

  const body = await res.text();
  return { ok: res.ok, status: res.status, body };
}
