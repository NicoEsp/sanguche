import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function findOrCreateUser(email: string, name: string | null, supabase: any) {
  console.log(`[findOrCreateUser] Starting for email: ${email}`);
  
  try {
    // 1. Check if user exists in auth by listing all users and finding by email
    console.log('[findOrCreateUser] Checking if user exists in auth...');
    const { data: existingAuthUser } = await supabase.auth.admin.listUsers();
    let authUser = existingAuthUser?.users?.find((u: any) => u.email === email);
    
    // If user doesn't exist in auth, try to create them
    if (!authUser) {
      console.log('[findOrCreateUser] User not in auth, creating...');
      
      const temporaryPassword = generateSecurePassword();
      const { data: newAuthData, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: { name: name || email.split('@')[0] }
      });
      
      // Handle email_exists error (race condition - user was created between check and create)
      if (createError?.code === 'email_exists') {
        console.log('[findOrCreateUser] Race condition: user exists, re-fetching...');
        const { data: refetchedUsers } = await supabase.auth.admin.listUsers();
        authUser = refetchedUsers?.users?.find((u: any) => u.email === email);
        
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
    
    // 2. Check if profile exists for this auth user
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
    
    // 3. Profile doesn't exist, create it
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
    
    // 4. Generate password reset link (optional, don't fail if this errors)
    try {
      await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: email
      });
      console.log('[findOrCreateUser] Password reset link generated');
    } catch (resetError) {
      console.error('[findOrCreateUser] Error generating reset link (non-fatal):', resetError);
      // Don't throw - user can request password reset manually
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
