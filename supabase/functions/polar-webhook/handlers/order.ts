import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { extractProfileId, handleSubscriptionActivation } from './subscription.ts';
import type { ActivationEventData } from './subscription.ts';

type SupabaseClientAny = SupabaseClient<unknown, unknown, unknown>;

export interface OrderEventData extends ActivationEventData {
  id: string;
  status: string;
}

export async function handleOrderEvent(
  order: OrderEventData,
  eventType: string,
  supabase: SupabaseClientAny
): Promise<void> {
  console.log(`📦 CRITICAL: ${eventType}`, {
    order_id: order.id,
    status: order.status,
    customer_email: order.customer_email || order.customer?.email,
    metadata_present: !!order.metadata?.profile_id
  });

  if (order.status !== 'paid') {
    if (eventType === 'order.paid') {
      console.warn('⚠️ Order.paid event but status is not paid:', order.status);
    }
    return;
  }

  const profileId = await extractProfileId(order, supabase);

  if (profileId) {
    const success = await handleSubscriptionActivation(profileId, order, eventType, supabase);
    if (!success) {
      console.error(`❌ Failed to activate premium for ${eventType}`);
    }
  } else {
    console.error(`❌ No profile_id found and no valid customer email for ${eventType}`);
  }
}
