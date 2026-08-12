import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getRecoveryErrorMessage } from '@/utils/errorMessages';

/**
 * Everything that can arrive at /auth from a "reset your password" email.
 *
 * Recovery links have reached this app in three shapes over time, and old
 * mails stay clickable in inboxes for a while, so all three are handled:
 *
 *  - `?token_hash=...&type=recovery` — what we send today. Nothing happens
 *    until `confirm()` runs, so an inbox scanner fetching the link can't burn
 *    the token before the person clicks.
 *  - `#access_token=...&type=recovery` — Supabase's hosted redirect. The
 *    client picks it up on its own (detectSessionInUrl) and fires
 *    PASSWORD_RECOVERY.
 *  - `?code=...` — PKCE, if the client is ever switched to that flow.
 *
 * Plus the failure case: `error_code=otp_expired` (link already used or
 * expired), which used to leave the user on a spinner with no explanation.
 */
export type RecoveryStatus =
  | 'none'        // not a recovery landing
  | 'confirm'     // token in hand, waiting for the user to click
  | 'verifying'   // exchanging the token for a session
  | 'ready'       // recovery session live, password form usable
  | 'expired';    // link dead — offer a fresh one

interface ParsedRecovery {
  status: RecoveryStatus;
  tokenHash: string | null;
  code: string | null;
  errorMessage: string | null;
}

// Read synchronously (not in an effect) so the first render already knows this
// is a recovery landing: an authenticated user clicking the link must not be
// bounced to the home page before the page figures it out.
function parseRecoveryFromUrl(): ParsedRecovery {
  const empty: ParsedRecovery = {
    status: 'none',
    tokenHash: null,
    code: null,
    errorMessage: null,
  };

  if (typeof window === 'undefined') return empty;

  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));

  const errorCode = query.get('error_code') ?? hash.get('error_code');
  const error = query.get('error') ?? hash.get('error');
  if (errorCode || error) {
    return {
      ...empty,
      status: 'expired',
      errorMessage: getRecoveryErrorMessage(errorCode ?? error),
    };
  }

  const type = query.get('type') ?? hash.get('type');

  const tokenHash = query.get('token_hash');
  if (tokenHash && type === 'recovery') {
    return { ...empty, status: 'confirm', tokenHash };
  }

  if (hash.get('access_token') && type === 'recovery') {
    return { ...empty, status: 'verifying' };
  }

  const code = query.get('code');
  if (code) {
    return { ...empty, status: 'verifying', code };
  }

  return empty;
}

// The hash flow is finished by the Supabase client, not by us; if it never
// reports back the link was bad.
const HASH_FLOW_TIMEOUT_MS = 15000;

export function useRecoveryLink(session: unknown) {
  const [parsed] = useState<ParsedRecovery>(parseRecoveryFromUrl);
  const [status, setStatus] = useState<RecoveryStatus>(parsed.status);
  const [errorMessage, setErrorMessage] = useState<string | null>(parsed.errorMessage);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Strip the token from the address bar as soon as we've read it: it should
  // not survive in history, bookmarks or the Referer header.
  useEffect(() => {
    if (parsed.status !== 'none') {
      window.history.replaceState(null, '', '/auth');
    }
  }, [parsed.status]);

  const isRecovery = status !== 'none';

  const markExpired = useCallback((message?: string) => {
    setStatus('expired');
    setErrorMessage(message ?? getRecoveryErrorMessage(null));
  }, []);

  // `?token_hash=` — only redeemed on an explicit click.
  const confirm = useCallback(async () => {
    if (!parsed.tokenHash) return;
    setStatus('verifying');

    const { error } = await supabase.auth.verifyOtp({
      token_hash: parsed.tokenHash,
      type: 'recovery',
    });

    if (error) {
      markExpired(getRecoveryErrorMessage(error.message));
      return;
    }

    setStatus('ready');
  }, [parsed.tokenHash, markExpired]);

  // `?code=` — PKCE exchange.
  useEffect(() => {
    if (!parsed.code) return;
    let cancelled = false;

    supabase.auth.exchangeCodeForSession(parsed.code).then(({ error }) => {
      if (cancelled) return;
      if (error) {
        markExpired(getRecoveryErrorMessage(error.message));
      } else {
        setStatus('ready');
      }
    });

    return () => {
      cancelled = true;
    };
  }, [parsed.code, markExpired]);

  // `#access_token=` — the Supabase client processes the hash and emits
  // PASSWORD_RECOVERY (re-broadcast as a window event by AuthContext).
  const isHashFlow = parsed.status === 'verifying' && !parsed.code;

  // Listened for unconditionally: the client can finish reading the hash before
  // this component mounts, in which case the URL is already clean by the time
  // parseRecoveryFromUrl runs and this event is the only signal left.
  useEffect(() => {
    const onRecovery = () => setStatus('ready');
    window.addEventListener('supabase:password_recovery', onRecovery);
    return () => window.removeEventListener('supabase:password_recovery', onRecovery);
  }, []);

  useEffect(() => {
    if (!isHashFlow || status !== 'verifying') return;

    timeoutRef.current = setTimeout(() => markExpired(), HASH_FLOW_TIMEOUT_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isHashFlow, status, markExpired]);

  // A session showing up during the hash flow means the token went through.
  // Only for that flow: on the token_hash flow a session may already exist
  // (someone still logged in on this browser) and it must not stand in for
  // redeeming the link.
  useEffect(() => {
    if (isHashFlow && status === 'verifying' && session) {
      setStatus('ready');
    }
  }, [isHashFlow, status, session]);

  useEffect(() => {
    if (status !== 'verifying' && timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [status]);

  const reset = useCallback(() => {
    setStatus('none');
    setErrorMessage(null);
  }, []);

  return { isRecovery, status, errorMessage, confirm, reset };
}
