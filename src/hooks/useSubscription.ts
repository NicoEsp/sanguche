import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface UseSubscriptionOptions {
  skip?: boolean;
}

export function useSubscription(options?: UseSubscriptionOptions) {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  // Use React Query for subscription data
  const { data: subscription, isLoading: loading } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user) {
        return {
          plan: 'free' as const,
          status: 'active' as const,
          trialEnd: null,
          current_period_end: null,
        };
      }

      // Get user profile first
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        return {
          plan: 'free' as const,
          status: 'active' as const,
          trialEnd: null,
          current_period_end: null,
        };
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
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient, options?.skip]);

  // Handle skip option
  if (options?.skip) {
    return {
      subscription: {
        plan: 'premium' as const,
        status: 'active' as const,
        trialEnd: null,
        current_period_end: null,
      },
      loading: false,
      hasActivePremium: true,
      isTrialing: false,
    };
  }

  return {
    subscription,
    loading: loading || authLoading,
    hasActivePremium: subscription?.status === 'active' && subscription?.plan === 'premium',
    isTrialing: subscription?.trialEnd ? new Date() < subscription.trialEnd : false,
  };
}
