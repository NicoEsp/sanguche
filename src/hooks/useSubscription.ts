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

      // Get subscription data
      const { data: subData } = await supabase
        .from('user_subscriptions')
        .select('plan, status, trial_end, current_period_end')
        .eq('user_id', profile.id)
        .single();

      if (subData) {
        return {
          plan: subData.plan,
          status: subData.status,
          trialEnd: subData.trial_end ? new Date(subData.trial_end) : null,
          current_period_end: subData.current_period_end ? new Date(subData.current_period_end) : null,
        };
      }

      return {
        plan: 'free' as const,
        status: 'active' as const,
        trialEnd: null,
        current_period_end: null,
      };
    },
    enabled: !!user && !options?.skip,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Real-time subscription to user_subscriptions changes
  useEffect(() => {
    if (!user || options?.skip) return;

    const channel = supabase
      .channel('user-subscription-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_subscriptions',
        },
        (payload) => {
          // Only invalidate if the change affects current user
          if (import.meta.env.DEV) {
            console.log('Subscription changed, invalidating query:', payload);
          }
          queryClient.invalidateQueries({ queryKey: ['subscription', user.id] });
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
