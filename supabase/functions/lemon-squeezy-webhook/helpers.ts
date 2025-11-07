import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function findOrCreateUser(email: string, name: string | null, supabase: any) {
  console.log(`Finding or creating user for email: ${email}`);
  
  // 1. Check if user exists in auth.users
  const { data: existingAuthUser } = await supabase.auth.admin.listUsers();
  const authUser = existingAuthUser?.users?.find((u: any) => u.email === email);
  
  if (authUser) {
    console.log('User exists in auth, checking profile...');
    
    // User exists in auth, check if profile exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', authUser.id)
      .maybeSingle();
    
    if (profile) {
      console.log('User and profile exist, returning profile id:', profile.id);
      return profile.id;
    }
    
    // Profile doesn't exist, create it
    console.log('Creating profile for existing auth user...');
    const { data: newProfile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: authUser.id,
        email: email,
        name: name || email.split('@')[0]
      })
      .select('id')
      .single();
    
    if (profileError) {
      console.error('Error creating profile:', profileError);
      throw new Error('Failed to create user profile');
    }
    
    console.log('Profile created:', newProfile.id);
    return newProfile.id;
  }
  
  // 2. User doesn't exist, create new user in auth
  console.log('Creating new user in auth...');
  
  const temporaryPassword = generateSecurePassword();
  
  const { data: newAuthUser, error: authError } = await supabase.auth.admin.createUser({
    email: email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: {
      name: name || email.split('@')[0]
    }
  });
  
  if (authError || !newAuthUser.user) {
    console.error('Error creating auth user:', authError);
    throw new Error('Failed to create user account');
  }
  
  console.log('Auth user created:', newAuthUser.user.id);
  
  // 3. Create profile for new user
  const { data: newProfile, error: profileError } = await supabase
    .from('profiles')
    .insert({
      user_id: newAuthUser.user.id,
      email: email,
      name: name || email.split('@')[0]
    })
    .select('id')
    .single();
  
  if (profileError) {
    console.error('Error creating profile for new user:', profileError);
    throw new Error('Failed to create user profile');
  }
  
  console.log('Profile created for new user:', newProfile.id);
  
  // 4. Generate password reset link
  const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email: email
  });
  
  if (resetError) {
    console.error('Error generating reset link:', resetError);
    // Don't throw here, user can request password reset manually
  } else {
    console.log('Password reset link generated successfully');
    // TODO: In production, send this link via email service (Resend)
    // For now, it will be sent by Supabase's default email
  }
  
  return newProfile.id;
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
