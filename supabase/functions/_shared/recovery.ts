// Password-recovery links that survive real inboxes.
//
// Supabase's own recovery link points at /auth/v1/verify?token=...  Any GET on
// that URL burns the one-time token and 302s to the app. Outlook/Hotmail (and
// most corporate scanners) fetch every link in an incoming mail before the
// person ever sees it, so by the time the user clicks, the token is already
// spent and they land on "Email link is invalid or has expired".
//
// Instead we hand out the hashed token on our own domain:
//
//   https://productprepa.com/auth?token_hash=<hashed_token>&type=recovery
//
// A scanner hitting that URL just downloads the SPA — nothing is consumed. The
// token is only exchanged (verifyOtp) when the person clicks the button on the
// page, which no prefetcher does.
import { SITE_URL } from "./email.ts";

export interface RecoveryLinkResult {
  link: string | null;
  // Set when the address has no account. Callers must not leak this to the
  // client: the reset endpoint answers the same either way.
  userNotFound: boolean;
  error: string | null;
}

export async function generateRecoveryLink(
  supabase: any,
  email: string,
): Promise<RecoveryLinkResult> {
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email,
    options: {
      // Only used by the fallback action_link below, but Supabase also stores
      // it, so keep it pointing at the page that can actually take a new
      // password instead of falling back to the project's Site URL.
      redirectTo: `${SITE_URL}/auth`,
    },
  });

  if (error) {
    const authError = error as { code?: string; status?: number; message?: string };
    const message = authError.message ?? String(error);
    // auth-js keeps the HTTP status on the error, and a missing user is the
    // only 404 this endpoint can produce. Checking it as well as the code
    // matters for privacy: an address we fail to classify would answer 500
    // while a registered one answers 200, which tells the caller who exists.
    const userNotFound = authError.code === "user_not_found" ||
      authError.status === 404 ||
      /user not found/i.test(message);
    return { link: null, userNotFound, error: message };
  }

  const hashedToken = data?.properties?.hashed_token;
  if (hashedToken) {
    return {
      link: `${SITE_URL}/auth?token_hash=${encodeURIComponent(hashedToken)}&type=recovery`,
      userNotFound: false,
      error: null,
    };
  }

  // Shouldn't happen, but a Supabase-hosted link still beats no link at all.
  const actionLink = data?.properties?.action_link ?? null;
  return {
    link: actionLink,
    userNotFound: false,
    error: actionLink ? null : "generateLink returned no token",
  };
}
