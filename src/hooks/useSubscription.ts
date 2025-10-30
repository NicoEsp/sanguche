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

      const { data: subscriptionData } = await supabase
        .from('user_subscriptions')
        .select('plan, status, trial_end, current_period_end')
        .eq('user_id', profile.id)
        .maybeSingle();

      if (!subscriptionData) {
        return {
          plan: 'free' as const,
          status: 'active' as const,
          trialEnd: null,
          current_period_end: null,
        };
      }

      return {
        plan: subscriptionData.plan,
        status: subscriptionData.status,
        trialEnd: subscriptionData.trial_end ? new Date(subscriptionData.trial_end) : null,
        current_period_end: subscriptionData.current_period_end ? new Date(subscriptionData.current_period_end) : null,
      };
    },
    enabled: !!user && !options?.skip,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  // Real-time subscription
  useEffect(() => {
    if (!user || options?.skip) return;

    let active = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const subscribe = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!active || !profile?.id) return;

      channel = supabase
        .channel(`user-subscription-${profile.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_subscriptions',
            filter: `user_id=eq.${profile.id}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ['subscription', user.id] });
          }
        )
        .subscribe();
    };

    subscribe();

    return () => {
      active = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
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
