import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { maskEmail } from '../_shared/pii.ts';

// Helper function for controlled delays
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export interface FindOrCreateUserResult {
  profileId: string;
  // True only when this call actually created the auth user (anonymous checkout path).
  // Used by the webhook to decide whether to send the "set your password" email.
  wasJustCreated: boolean;
}

export async function findOrCreateUser(
  email: string,
  name: string | null,
  supabase: any
): Promise<FindOrCreateUserResult> {
  const startTime = Date.now();
  const emailMasked = maskEmail(email);
  console.log(`[findOrCreateUser] Starting for email: ${emailMasked}`);
  let wasJustCreated = false;

  try {
    // 1. FIRST: Check if profile already exists by email (most reliable for existing users)
    console.log('[findOrCreateUser] Step 1: Checking if profile exists by email...');
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('id, user_id')
      .eq('email', email)
      .maybeSingle();
    
    if (profileCheckError) {
      console.error('[findOrCreateUser] Error checking profile by email:', profileCheckError);
      // Don't throw, continue with auth check
    }
    
    if (existingProfile) {
      console.log(`[findOrCreateUser] Found existing profile by email (${emailMasked}): ${existingProfile.id} (took ${Date.now() - startTime}ms)`);
      return { profileId: existingProfile.id, wasJustCreated: false };
    }
    
    // 2. Profile not found by email, look up auth user directly
    console.log('[findOrCreateUser] Step 2: Profile not found, looking up auth user by email...');
    let authUser = null;
    
    // Use listUsers with a single page - Supabase GoTrue doesn't have getUserByEmail
    // but we can search efficiently by checking the first match
    const { data: authList, error: listError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });
    
    // Try to find user by iterating - but first try a more targeted approach
    // Search through auth users by fetching pages until we find the email
    let page = 1;
    const perPage = 50;
    const maxPages = 20; // Reduced from 100 - if user isn't found in 1000 users, create new
    
    while (!authUser && page <= maxPages) {
      const { data: authPage, error: pageError } = await supabase.auth.admin.listUsers({
        page: page,
        perPage: perPage
      });
      
      if (pageError) {
        console.error(`[findOrCreateUser] Error listing users page ${page}:`, pageError);
        break;
      }
      
      if (!authPage?.users?.length) break;
      
      authUser = authPage.users.find((u: any) => u.email === email);
      
      if (authUser) {
        console.log(`[findOrCreateUser] Found auth user on page ${page}: ${authUser.id}`);
        break;
      }
      
      if (authPage.users.length < perPage) break;
      page++;
    }
    
    // 3. If user doesn't exist in auth, create them
    if (!authUser) {
      console.log('[findOrCreateUser] Step 3: User not in auth, creating...');
      
      const temporaryPassword = generateSecurePassword();
      const { data: newAuthData, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: { name: name || email.split('@')[0] }
      });
      
      // Handle email_exists error (race condition)
      if (createError?.code === 'email_exists') {
        console.log('[findOrCreateUser] Race condition detected: user was just created by another request');
        console.log('[findOrCreateUser] Waiting 500ms for propagation before retrying...');
        
        // Wait for database propagation
        await delay(500);
        
        // First, try to find the profile again (it might have been created)
        const { data: retryProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email)
          .maybeSingle();
        
        if (retryProfile) {
          console.log(`[findOrCreateUser] Found profile after delay: ${retryProfile.id} (took ${Date.now() - startTime}ms)`);
          return { profileId: retryProfile.id, wasJustCreated: false };
        }
        
        // Profile not found, search auth again with limited pagination
        console.log('[findOrCreateUser] Profile not found after delay, searching auth...');
        let retryPage = 1;
        const maxRetryPages = 10; // Reduced to avoid timeout
        
        while (!authUser && retryPage <= maxRetryPages) {
          const { data: retryAuthPage } = await supabase.auth.admin.listUsers({
            page: retryPage,
            perPage: perPage
          });
          
          if (!retryAuthPage?.users?.length) break;
          
          authUser = retryAuthPage.users.find((u: any) => u.email === email);
          if (authUser) {
            console.log(`[findOrCreateUser] Found auth user after retry on page ${retryPage}: ${authUser.id}`);
            break;
          }
          if (retryAuthPage.users.length < perPage) break;
          
          retryPage++;
        }
        
        if (!authUser) {
          console.error(`[findOrCreateUser] User exists but could not be retrieved after race condition (searched ${retryPage} pages)`);
          throw new Error('User exists but could not be retrieved');
        }
      } else if (createError) {
        console.error('[findOrCreateUser] Failed to create auth user:', createError);
        throw new Error(`Failed to create user account: ${createError.message}`);
      } else {
        authUser = newAuthData.user;
        wasJustCreated = true;
        console.log(`[findOrCreateUser] Created new auth user: ${authUser.id}`);
      }
    }
    
    if (!authUser) {
      console.error('[findOrCreateUser] No auth user after create/find attempts');
      throw new Error('No auth user available');
    }
    
    console.log(`[findOrCreateUser] Step 4: Auth user ready: ${authUser.id}`);
    
    // 4. Check if profile exists for this auth user
    const { data: profile, error: profileFetchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', authUser.id)
      .maybeSingle();
    
    if (profileFetchError) {
      console.error('[findOrCreateUser] Error fetching profile:', profileFetchError);
      throw new Error(`Failed to check profile: ${profileFetchError.message}`);
    }
    
    if (profile) {
      console.log(`[findOrCreateUser] Profile exists: ${profile.id} (took ${Date.now() - startTime}ms)`);
      return { profileId: profile.id, wasJustCreated: false };
    }
    
    // 5. Profile doesn't exist, create it
    console.log('[findOrCreateUser] Step 5: Creating profile for auth user...');
    const { data: newProfile, error: profileCreateError } = await supabase
      .from('profiles')
      .insert({
        user_id: authUser.id,
        email: email,
        name: name || email.split('@')[0]
      })
      .select('id')
      .single();
    
    if (profileCreateError) {
      console.error('[findOrCreateUser] Error creating profile:', profileCreateError);
      throw new Error(`Failed to create profile: ${profileCreateError.message}`);
    }
    
    console.log(`[findOrCreateUser] Profile created successfully: ${newProfile.id} (took ${Date.now() - startTime}ms)`);

    // 6. If we just created the auth user (anonymous-checkout path), send the
    // access email with a recovery link so they can set a password and log in.
    // Skipped when the user already existed in auth — those users already know
    // how to log in. Non-fatal: never block webhook processing on email errors.
    if (wasJustCreated) {
      try {
        await sendAccountAccessEmail(email, name, supabase);
      } catch (mailError) {
        console.error('[findOrCreateUser] Error sending account access email (non-fatal):', mailError);
      }
    }

    return { profileId: newProfile.id, wasJustCreated };

  } catch (error) {
    console.error(`[findOrCreateUser] Unexpected error (took ${Date.now() - startTime}ms):`, error);
    throw error;
  }
}

async function sendAccountAccessEmail(email: string, name: string | null, supabase: any) {
  const emailMasked = maskEmail(email);

  // generateLink({ type: 'recovery' }) returns the action_link in the response
  // but does NOT send any email itself — Supabase Auth only emails when the
  // type is 'signup' or 'invite'. We send via Resend to keep the template
  // consistent with the rest of our transactional flows.
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email: email,
  });

  if (linkError) {
    console.error(`[sendAccountAccessEmail] Failed to generate link for ${emailMasked}:`, linkError);
    return;
  }

  const actionLink = linkData?.properties?.action_link;
  if (!actionLink) {
    console.error(`[sendAccountAccessEmail] No action_link returned for ${emailMasked}`);
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
