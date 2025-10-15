import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

type NullableString = string | null | undefined;

type SupabaseClientAny = SupabaseClient<unknown, unknown, unknown>;

interface EventCustomer {
  email?: NullableString;
}

interface EventMetadata {
  profile_id?: NullableString;
  [key: string]: unknown;
}

export interface ProfileContext {
  customer_email?: NullableString;
  customer?: EventCustomer | null;
  metadata?: EventMetadata | null;
}

export interface ActivationEventData extends ProfileContext {
  id?: string;
  customer_id?: NullableString;
}

export interface SubscriptionEventData extends ActivationEventData {
  id: string;
  status: string;
}

async function findUserByEmail(email: string, supabase: SupabaseClientAny): Promise<string | null> {
  try {
    console.log('🔍 Searching user by email:', email);

    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError || !authUsers?.users) {
      console.error('❌ Error listing auth users:', authError);
      return null;
    }

    const authUser = authUsers.users.find((user) => user.email === email);
    if (!authUser) {
      console.warn('⚠️ Auth user not found for email:', email);
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', authUser.id)
      .maybeSingle();

    if (profileError) {
      console.error('❌ Error fetching profile:', profileError);
      return null;
    }

    if (!profile) {
      console.warn('⚠️ Profile not found for user_id:', authUser.id);
      return null;
    }

    console.log('✅ Found user profile:', { profile_id: profile.id, email });
    return profile.id;
  } catch (error) {
    console.error('❌ Error in findUserByEmail:', error);
    return null;
  }
}

export async function extractProfileId(eventData: ProfileContext, supabase: SupabaseClientAny): Promise<string | null> {
  const metadata = eventData.metadata || {};
  let profileId = metadata.profile_id;

  if (!profileId) {
    const customerEmail = eventData.customer_email || eventData.customer?.email;
    if (customerEmail) {
      profileId = await findUserByEmail(customerEmail, supabase);
    }
  }

  return profileId;
}

export async function handleSubscriptionActivation(
  profileId: string,
  eventData: ActivationEventData,
  source: string,
  supabase: SupabaseClientAny
): Promise<boolean> {
  try {
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

    const subscriptionData: Record<string, unknown> = {
      user_id: profileId,
      plan: 'premium',
      status: 'active',
      current_period_end: currentPeriodEnd,
    };

    if (eventData.customer_id) {
      subscriptionData.polar_customer_id = eventData.customer_id;
    }
    if (eventData.id && source.includes('subscription')) {
      subscriptionData.polar_subscription_id = eventData.id;
    }

    console.log('🔥 Activating premium subscription:', { profileId, source });

    const { error } = await supabase
      .from('user_subscriptions')
      .upsert(subscriptionData, { onConflict: 'user_id' });

    if (error) {
      console.error(`❌ Premium activation failed (${source}):`, error.message);
      return false;
    }

    console.log(`✅ Premium activated successfully via ${source}`);
    return true;
  } catch (error) {
    console.error(`❌ Error activating premium (${source}):`, error);
    return false;
  }
}

export async function handleSubscriptionEvent(
  subscription: SubscriptionEventData,
  eventType: string,
  supabase: SupabaseClientAny
): Promise<void> {
  console.log(`🔥 CRITICAL: ${eventType}`, {
    subscription_id: subscription.id,
    status: subscription.status,
    customer_email: subscription.customer?.email,
    metadata_present: !!subscription.metadata?.profile_id
  });

  const profileId = await extractProfileId(subscription, supabase);

  if (!profileId) {
    console.error(`❌ No profile_id found and no valid customer email for ${eventType}`);
    return;
  }

  if (subscription.status === 'active' && (eventType === 'subscription.created' || eventType === 'subscription.active' || eventType === 'subscription.updated')) {
    const success = await handleSubscriptionActivation(profileId, subscription, eventType, supabase);
    if (!success) {
      console.error(`❌ Failed to activate premium for ${eventType}`);
    }
  } else if (subscription.status === 'canceled' || subscription.status === 'incomplete_expired' || eventType.includes('canceled') || eventType.includes('incomplete_expired')) {
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        plan: 'free',
        status: 'active',
        polar_subscription_id: subscription.id,
      })
      .eq('user_id', profileId);

    if (error) {
      console.error('❌ Subscription cancellation failed:', error.message);
    } else {
      console.log('✅ Subscription canceled and downgraded to free');
    }
  } else if (eventType === 'subscription.updated' && subscription.status !== 'active') {
    console.log('⏳ Subscription status not final, ignoring:', subscription.status);
  } else if (eventType === 'subscription.created' && subscription.status !== 'active') {
    console.warn('⚠️ Subscription created but not active:', subscription.status);
  }
}
