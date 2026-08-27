import { maskEmail } from '../_shared/pii.ts';
import { generateRecoveryLink } from '../_shared/recovery.ts';

export interface FindOrCreateUserResult {
  profileId: string;
  // auth.users.id, which is NOT profiles.id — they are separate UUIDs joined by
  // profiles.user_id. The browser identifies to Mixpanel with the auth id
  // (useMixpanelTracking -> Mixpanel.identify(user.id)), so any server-side
  // event has to use this one or it lands on a different profile.
  // Siempre el dueño del profile de arriba (profiles.user_id), nunca un auth
  // user resuelto por email en paralelo: ver authUserIdForProfile.
  // Null si el profile no tiene auth user asociado o si la consulta falló.
  authUserId: string | null;
  // True only when this call actually created the auth user (anonymous checkout path).
  // Used by the webhook to decide whether to send the "set your password" email.
  wasJustCreated: boolean;
}

/**
 * Schedules background work that must not block the webhook response.
 * The webhook passes `EdgeRuntime.waitUntil`; tests/local callers can omit it
 * and the promise is simply awaited-and-forgotten.
 */
export type Defer = (promise: Promise<unknown>) => void;

const noopDefer: Defer = (promise) => {
  promise.catch((error) => console.error('[helpers] Deferred task failed:', error));
};

interface ResolvedUser {
  profileId: string | null;
  // Auth user que coincide con el email. SOLO se usa para el camino de
  // recuperación de abajo ("existe el auth user pero le falta el profile"):
  // como identidad no sirve, porque no está unido al profile de arriba.
  authUserIdByEmail: string | null;
}

/**
 * Looks up the profile + auth user behind an email in one round trip.
 *
 * Falls back to a plain `profiles` lookup if the RPC isn't there yet, so
 * deploying this function before its migration degrades to the old behaviour
 * for existing buyers instead of failing every webhook.
 */
async function resolveUserByEmail(supabase: any, email: string): Promise<ResolvedUser> {
  const { data, error } = await supabase
    .rpc('resolve_user_by_email', { p_email: email })
    .maybeSingle();

  if (!error) {
    return { profileId: data?.profile_id ?? null, authUserIdByEmail: data?.auth_user_id ?? null };
  }

  console.error('[findOrCreateUser] resolve_user_by_email unavailable, falling back:', error);
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, user_id')
    .eq('email', email)
    .maybeSingle();

  // En este camino el user_id sale del mismo profile, así que ya viene atado.
  return { profileId: profile?.id ?? null, authUserIdByEmail: profile?.user_id ?? null };
}

// Lo mínimo que este helper usa del cliente de Supabase. Tiparlo así evita
// sumar otro `any` y deja explícito qué toca de la API.
interface ProfileReader {
  from(table: string): {
    select(columns: string): {
      eq(column: string, value: string): {
        maybeSingle(): Promise<{ data: { user_id?: string | null } | null; error: unknown }>;
      };
    };
  };
}

/**
 * auth.users.id dueño de `profileId`.
 *
 * El `auth_user_id` que devuelve resolve_user_by_email NO sirve para
 * identificar a la persona: esa RPC resuelve el profile y el auth user en dos
 * subconsultas independientes filtradas por email, sin unirlas por
 * profiles.user_id. Y profiles.email no es único (idx_profiles_email es un
 * índice común, no UNIQUE) — por eso la propia RPC ordena y limita a uno. Con
 * dos profiles que comparten email, el profile elegido puede no ser el del auth
 * user elegido, y el distinct_id de Mixpanel terminaría apuntando a otra
 * persona. Un PK lookup extra sale mucho más barato que una conversión mal
 * atribuida.
 */
async function authUserIdForProfile(supabase: ProfileReader, profileId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('id', profileId)
    .maybeSingle();

  if (error) {
    console.error('[findOrCreateUser] No se pudo resolver el auth user del profile:', error);
    return null;
  }

  return data?.user_id ?? null;
}

/**
 * Resolves (or creates) the profile that owns `email`.
 *
 * Resolution is a single `resolve_user_by_email` RPC that reads both
 * public.profiles and auth.users. It replaces the previous implementation,
 * which paginated the GoTrue Admin API (up to 20 sequential HTTP calls) and
 * silently gave up past 1000 users.
 */
export async function findOrCreateUser(
  email: string,
  name: string | null,
  supabase: any,
  defer: Defer = noopDefer,
): Promise<FindOrCreateUserResult> {
  const startTime = Date.now();
  const emailMasked = maskEmail(email);
  let wasJustCreated = false;

  try {
    // 1. Single round trip: profile id + auth user id for this email.
    const resolved = await resolveUserByEmail(supabase, email);

    if (resolved.profileId) {
      const authUserId = await authUserIdForProfile(supabase, resolved.profileId);
      console.log(`[findOrCreateUser] Resolved existing profile for ${emailMasked} in ${Date.now() - startTime}ms`);
      return { profileId: resolved.profileId, authUserId, wasJustCreated: false };
    }

    // 2. No profile. Either the auth user exists without one, or the buyer is
    //    brand new (anonymous checkout) and we create the account now.
    let authUserId: string | null = resolved.authUserIdByEmail;

    if (!authUserId) {
      const { data: newAuthData, error: createError } = await supabase.auth.admin.createUser({
        email,
        password: generateSecurePassword(),
        email_confirm: true,
        user_metadata: { name: name || email.split('@')[0] },
      });

      if (createError?.code === 'email_exists') {
        // Two webhooks for the same buyer raced us (LS fires order_created and
        // subscription_created ~2s apart). Re-resolve instead of paginating.
        console.log('[findOrCreateUser] Race on createUser, re-resolving');
        const retry = await resolveUserByEmail(supabase, email);

        if (retry.profileId) {
          const retryAuthUserId = await authUserIdForProfile(supabase, retry.profileId);
          return { profileId: retry.profileId, authUserId: retryAuthUserId, wasJustCreated: false };
        }
        if (!retry.authUserIdByEmail) {
          throw new Error('User exists but could not be retrieved');
        }
        authUserId = retry.authUserIdByEmail;
      } else if (createError) {
        throw new Error(`Failed to create user account: ${createError.message}`);
      } else {
        authUserId = newAuthData.user.id;
        wasJustCreated = true;
        console.log(`[findOrCreateUser] Created auth user ${authUserId}`);
      }
    }

    // 3. Resolve the profile for this auth user. The on_auth_user_created
    //    trigger (handle_new_user) inserts the row right after the auth.users
    //    insert, so on the wasJustCreated path we usually find it here.
    const { data: profile, error: profileFetchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', authUserId)
      .maybeSingle();

    if (profileFetchError) {
      throw new Error(`Failed to check profile: ${profileFetchError.message}`);
    }

    let profileId: string;
    if (profile) {
      profileId = profile.id;
    } else {
      // Trigger disabled or failed — create the profile ourselves. Upsert
      // rather than insert: LemonSqueezy fires order_created and
      // subscription_created seconds apart, so two invocations can both pass
      // the select above and race on the UNIQUE(user_id) constraint. On
      // conflict we adopt the row the other one wrote instead of throwing.
      const { data: newProfile, error: profileCreateError } = await supabase
        .from('profiles')
        .upsert({
          user_id: authUserId,
          email,
          name: name || email.split('@')[0],
        }, { onConflict: 'user_id' })
        .select('id')
        .single();

      if (profileCreateError) {
        throw new Error(`Failed to create profile: ${profileCreateError.message}`);
      }
      profileId = newProfile.id;
    }

    // 4. Anonymous-checkout path: send the access email so the buyer can set a
    //    password. Deferred — generateLink + Resend cost ~400-800ms and the
    //    buyer's plan is already active without it.
    if (wasJustCreated) {
      defer(sendAccountAccessEmail(email, name, supabase));
    }

    console.log(`[findOrCreateUser] Profile ready for ${emailMasked} in ${Date.now() - startTime}ms (created: ${wasJustCreated})`);
    return { profileId, authUserId, wasJustCreated };

  } catch (error) {
    console.error(`[findOrCreateUser] Failed for ${emailMasked} after ${Date.now() - startTime}ms:`, error);
    throw error;
  }
}

async function sendAccountAccessEmail(email: string, name: string | null, supabase: any) {
  const emailMasked = maskEmail(email);

  // generateLink({ type: 'recovery' }) mints the token but does NOT send any
  // email itself — Supabase Auth only emails when the type is 'signup' or
  // 'invite'. We send via Resend to keep the template consistent with the rest
  // of our transactional flows, and we hand out the token_hash link on our own
  // domain so inbox scanners can't burn it (see _shared/recovery.ts).
  const { link: actionLink, error: linkError } = await generateRecoveryLink(supabase, email);

  if (!actionLink) {
    console.error(`[sendAccountAccessEmail] Failed to generate link for ${emailMasked}: ${linkError}`);
    return;
  }

  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (!resendApiKey) {
    console.error(`[sendAccountAccessEmail] RESEND_API_KEY not configured; skipping email for ${emailMasked}`);
    return;
  }

  const html = buildAccountAccessEmailHtml(name, actionLink);

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'ProductPrepa <hola@productprepa.com>',
      to: [email],
      subject: 'Acceso a tu cuenta de ProductPrepa 🥪',
      html,
    }),
  });

  const resendBody = await resendRes.text();
  if (!resendRes.ok) {
    console.error(`[sendAccountAccessEmail] Resend error for ${emailMasked}: ${resendBody}`);
    return;
  }

  console.log(`[sendAccountAccessEmail] Sent to ${emailMasked}`);
}

function buildAccountAccessEmailHtml(name: string | null, actionLink: string): string {
  const firstName = name?.split(' ')[0] || 'ahí';
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Acceso a tu cuenta de ProductPrepa</title>
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
    Gracias por sumarte a ProductPrepa. Te creamos una cuenta con este email para que puedas acceder a todo lo que incluye tu plan.
  </p>
  <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 24px;">
    Hacé clic en el botón para entrar y definir tu contraseña:
  </p>

  <!-- CTA Button -->
  <table width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center" style="padding:8px 0 32px;">
    <a href="${actionLink}" target="_blank" style="display:inline-block;background:#18181b;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">
      Acceder a mi cuenta →
    </a>
  </td></tr>
  </table>

  <p style="font-size:14px;color:#71717a;line-height:1.5;margin:0 0 8px;">
    El link es de un solo uso y vence en 1 hora. Si expira, podés volver a generarlo desde la opción "Olvidé mi contraseña" en el login.
  </p>
  <p style="font-size:14px;color:#71717a;line-height:1.5;margin:0;">
    En unos minutos vas a recibir un segundo mail con los detalles de tu plan.
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

function generateSecurePassword(): string {
  const length = 32;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);

  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length];
  }

  return password;
}
