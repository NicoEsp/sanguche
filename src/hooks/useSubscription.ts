import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface UseSubscriptionOptions {
  skip?: boolean;
}

export type SubscriptionPlan = 'free' | 'premium' | 'repremium' | 'curso_estrategia' | 'cursos_all';

export function useSubscription(options?: UseSubscriptionOptions) {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  // Use React Query for subscription data
  const { data: subscription, isLoading: loading, isError } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user) {
        return {
          plan: 'free' as SubscriptionPlan,
          status: 'active' as const,
          trialEnd: null,
          current_period_end: null,
          purchase_type: 'subscription' as const,
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
        if (import.meta.env.DEV) {
          console.error('[useSubscription] Query error:', error);
        }
        throw error; // Marca como error para retry
      }

      if (!data) {
        // Si no hay data después de ensure_user_defaults, default a free
        if (import.meta.env.DEV) {
          console.warn('[useSubscription] No subscription found, defaulting to free');
        }
        return {
          plan: 'free' as SubscriptionPlan,
          status: 'active' as const,
          trialEnd: null,
          current_period_end: null,
          purchase_type: 'subscription' as const,
        };
      }

      return {
        plan: data.plan as SubscriptionPlan,
        status: data.status,
        trialEnd: data.trial_end ? new Date(data.trial_end) : null,
        current_period_end: data.current_period_end ? new Date(data.current_period_end) : null,
        purchase_type: 'subscription' as const,
      };
    },
    enabled: !!user && !options?.skip,
    staleTime: 2 * 60 * 1000, // 2 minutos - suscripción no cambia frecuentemente
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Usar cache existente - realtime maneja updates
    retry: 2,
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
        plan: 'premium' as SubscriptionPlan,
        status: 'active' as const,
        trialEnd: null,
        current_period_end: null,
        purchase_type: 'subscription' as const,
      },
      loading: false,
      hasActivePremium: true,
      hasActiveRePremium: false,
      hasCursoEstrategia: false,
      hasCursosAll: false,
      hasAnyPaidPlan: true,
      isTrialing: false,
    };
  }

  // Return undefined for hasActivePremium while loading to distinguish from "definitely not premium"
  const isStillLoading = loading || authLoading || isError;
  
  const plan = subscription?.plan;
  const isActive = subscription?.status === 'active';
  
  return {
    subscription,
    loading: isStillLoading,
    plan,
    hasActivePremium: isStillLoading 
      ? undefined 
      : (isActive && plan === 'premium'),
    hasActiveRePremium: isStillLoading
      ? undefined
      : (isActive && plan === 'repremium'),
    hasCursoEstrategia: isStillLoading
      ? undefined
      : (isActive && plan === 'curso_estrategia'),
    hasCursosAll: isStillLoading
      ? undefined
      : (isActive && plan === 'cursos_all'),
    hasAnyPaidPlan: isStillLoading
      ? undefined
      : (isActive && ['premium', 'repremium', 'curso_estrategia', 'cursos_all'].includes(plan || '')),
    isTrialing: subscription?.trialEnd ? new Date() < subscription.trialEnd : false,
  };
}
