import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Helper function for controlled delays
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function findOrCreateUser(email: string, name: string | null, supabase: any) {
  const startTime = Date.now();
  console.log(`[findOrCreateUser] Starting for email: ${email}`);
  
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
      console.log(`[findOrCreateUser] Found existing profile by email: ${existingProfile.id} (took ${Date.now() - startTime}ms)`);
      return existingProfile.id;
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
          return retryProfile.id;
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
      return profile.id;
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
    console.error(`[findOrCreateUser] Unexpected error (took ${Date.now() - startTime}ms):`, error);
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
