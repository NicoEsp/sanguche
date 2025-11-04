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
  const { data: subscription, isLoading: loading, isError } = useQuery({
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

      // Query única: user_subscriptions JOIN profiles
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          plan,
          status,
          trial_end,
          current_period_end,
          profiles!inner(user_id)
        `)
        .eq('profiles.user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('[useSubscription] Query error:', error);
        throw error; // Marca como error para retry
      }

      if (!data) {
        // Si no hay data después de ensure_user_defaults, default a free
        console.warn('[useSubscription] No subscription found, defaulting to free');
        return {
          plan: 'free' as const,
          status: 'active' as const,
          trialEnd: null,
          current_period_end: null,
        };
      }

      return {
        plan: data.plan,
        status: data.status,
        trialEnd: data.trial_end ? new Date(data.trial_end) : null,
        current_period_end: data.current_period_end ? new Date(data.current_period_end) : null,
      };
    },
    enabled: !!user && !authLoading && !options?.skip,
    staleTime: 5 * 1000, // 5 segundos
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
    refetchInterval: 30 * 1000, // Polling cada 30s
    retry: 3, // Reintentar 3 veces en caso de error
    retryDelay: 500, // 500ms entre reintentos
    refetchOnReconnect: true, // Refetch al reconectar red
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

      const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const channelName = `user-subscription-${profile.id}-${uniqueSuffix}`;

      channel = supabase
        .channel(channelName)
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
            queryClient.invalidateQueries({ queryKey: ['user-composite-data', user.id] });
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
    loading: loading || authLoading || isError, // Tratar error como loading
    hasActivePremium: (!loading && !authLoading && !isError) 
      ? (subscription?.status === 'active' && subscription?.plan === 'premium')
      : false, // No calcular hasActivePremium si hay error/loading
    isTrialing: subscription?.trialEnd ? new Date() < subscription.trialEnd : false,
  };
}
