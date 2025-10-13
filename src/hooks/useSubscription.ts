import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseSubscriptionOptions {
  skip?: boolean;
}

export function useSubscription(options?: UseSubscriptionOptions) {
  const [subscription, setSubscription] = useState<{
    plan: 'free' | 'premium';
    status: 'active' | 'inactive' | 'cancelled';
    trialEnd: Date | null;
    current_period_end?: Date | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (options?.skip) {
      setSubscription({
        plan: 'premium',
        status: 'active',
        trialEnd: null,
      });
      setLoading(false);
      return;
    }

    async function fetchSubscription() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setSubscription({
            plan: 'free',
            status: 'active',
            trialEnd: null,
          });
          setLoading(false);
          return;
        }

        // Get user profile first
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!profile) {
          setSubscription({
            plan: 'free',
            status: 'active',
            trialEnd: null,
          });
          setLoading(false);
          return;
        }

        // Get subscription data
        const { data: subData } = await supabase
          .from('user_subscriptions')
          .select('plan, status, trial_end, current_period_end')
          .eq('user_id', profile.id)
          .single();

        if (subData) {
          setSubscription({
            plan: subData.plan,
            status: subData.status,
            trialEnd: subData.trial_end ? new Date(subData.trial_end) : null,
            current_period_end: subData.current_period_end ? new Date(subData.current_period_end) : null,
          });
        } else {
          setSubscription({
            plan: 'free',
            status: 'active',
            trialEnd: null,
          });
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Error fetching subscription:', error);
        }
        setSubscription({
          plan: 'free',
          status: 'active',
          trialEnd: null,
        });
      } finally {
        setLoading(false);
      }
    }

    fetchSubscription();
  }, [options?.skip]);

  return {
    subscription,
    loading,
    hasActivePremium: subscription?.status === 'active' && subscription?.plan === 'premium',
    isTrialing: subscription?.trialEnd ? new Date() < subscription.trialEnd : false,
  };
}
