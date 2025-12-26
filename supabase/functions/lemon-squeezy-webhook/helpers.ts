import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function findOrCreateUser(email: string, name: string | null, supabase: any) {
  console.log(`[findOrCreateUser] Starting for email: ${email}`);
  
  try {
    // 1. FIRST: Check if profile already exists by email (most reliable for existing users)
    console.log('[findOrCreateUser] Checking if profile exists by email...');
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
      console.log(`[findOrCreateUser] Found existing profile by email: ${existingProfile.id}`);
      return existingProfile.id;
    }
    
    // 2. Profile not found by email, check auth with pagination
    console.log('[findOrCreateUser] Profile not found, checking auth with pagination...');
    let authUser = null;
    let page = 1;
    const perPage = 50;
    
    while (!authUser) {
      const { data: authPage, error: listError } = await supabase.auth.admin.listUsers({
        page: page,
        perPage: perPage
      });
      
      if (listError) {
        console.error(`[findOrCreateUser] Error listing users page ${page}:`, listError);
        break;
      }
      
      if (!authPage?.users?.length) {
        console.log('[findOrCreateUser] No more users to check');
        break;
      }
      
      authUser = authPage.users.find((u: any) => u.email === email);
      
      if (authUser) {
        console.log(`[findOrCreateUser] Found auth user on page ${page}: ${authUser.id}`);
        break;
      }
      
      // If we got fewer users than perPage, we've reached the end
      if (authPage.users.length < perPage) {
        console.log('[findOrCreateUser] Reached last page of users');
        break;
      }
      
      page++;
      
      // Safety limit to prevent infinite loops
      if (page > 100) {
        console.error('[findOrCreateUser] Exceeded max pages, stopping search');
        break;
      }
    }
    
    // 3. If user doesn't exist in auth, create them
    if (!authUser) {
      console.log('[findOrCreateUser] User not in auth, creating...');
      
      const temporaryPassword = generateSecurePassword();
      const { data: newAuthData, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: { name: name || email.split('@')[0] }
      });
      
      // Handle email_exists error (race condition)
      if (createError?.code === 'email_exists') {
        console.log('[findOrCreateUser] Race condition: user exists, searching again with pagination...');
        
        // Search again with pagination
        let retryPage = 1;
        while (!authUser && retryPage <= 100) {
          const { data: retryAuthPage } = await supabase.auth.admin.listUsers({
            page: retryPage,
            perPage: perPage
          });
          
          if (!retryAuthPage?.users?.length) break;
          
          authUser = retryAuthPage.users.find((u: any) => u.email === email);
          if (authUser) break;
          if (retryAuthPage.users.length < perPage) break;
          
          retryPage++;
        }
        
        if (!authUser) {
          console.error('[findOrCreateUser] User exists but could not be retrieved after race condition');
          throw new Error('User exists but could not be retrieved');
        }
      } else if (createError) {
        console.error('[findOrCreateUser] Failed to create auth user:', createError);
        throw new Error(`Failed to create user account: ${createError.message}`);
      } else {
        authUser = newAuthData.user;
      }
    }
    
    if (!authUser) {
      console.error('[findOrCreateUser] No auth user after create/find attempts');
      throw new Error('No auth user available');
    }
    
    console.log(`[findOrCreateUser] Auth user ready: ${authUser.id}`);
    
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
      console.log(`[findOrCreateUser] Profile exists: ${profile.id}`);
      return profile.id;
    }
    
    // 5. Profile doesn't exist, create it
    console.log('[findOrCreateUser] Creating profile for auth user...');
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
    
    console.log(`[findOrCreateUser] Profile created successfully: ${newProfile.id}`);
    
    // 6. Generate password reset link (optional, don't fail if this errors)
    try {
      await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: email
      });
      console.log('[findOrCreateUser] Password reset link generated');
    } catch (resetError) {
      console.error('[findOrCreateUser] Error generating reset link (non-fatal):', resetError);
    }
    
    return newProfile.id;
    
  } catch (error) {
    console.error('[findOrCreateUser] Unexpected error:', error);
    throw error;
  }
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
