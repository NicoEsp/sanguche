import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  
  const { user, isLoading: authLoading } = useAuth();

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

    if (authLoading) {
      return;
    }

    async function fetchSubscription() {
      try {
        if (!user) {
          setSubscription({
            plan: 'free',
            status: 'active',
            trialEnd: null,
          });
          setLoading(false);
          return;
        }

        const { data: profileWithSubscription, error } = await supabase
          .from('profiles')
          .select('id, user_subscriptions(plan, status, trial_end, current_period_end)')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (!profileWithSubscription) {
          setSubscription({
            plan: 'free',
            status: 'active',
            trialEnd: null,
          });
          setLoading(false);
          return;
        }

        const subscriptionRow = Array.isArray(profileWithSubscription.user_subscriptions)
          ? profileWithSubscription.user_subscriptions[0]
          : profileWithSubscription.user_subscriptions;

        if (subscriptionRow) {
          setSubscription({
            plan: subscriptionRow.plan,
            status: subscriptionRow.status,
            trialEnd: subscriptionRow.trial_end ? new Date(subscriptionRow.trial_end) : null,
            current_period_end: subscriptionRow.current_period_end ? new Date(subscriptionRow.current_period_end) : null,
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
  }, [user, authLoading, options?.skip]);

  return {
    subscription,
    loading: loading || authLoading,
    hasActivePremium: subscription?.status === 'active' && subscription?.plan === 'premium',
    isTrialing: subscription?.trialEnd ? new Date() < subscription.trialEnd : false,
  };
}
