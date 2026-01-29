import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';

interface UseSubscriptionOptions {
  skip?: boolean;
}

export type SubscriptionPlan = 'free' | 'premium' | 'repremium' | 'curso_estrategia' | 'cursos_all';

// OPTIMIZED: Removed duplicate realtime subscription - AuthContext handles all realtime updates
export function useSubscription(options?: UseSubscriptionOptions) {
  const { user, isLoading: authLoading } = useAuth();

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
          purchase_type,
          profiles!inner(user_id)
        `)
        .eq('profiles.user_id', user.id)
        .maybeSingle();

      if (error) {
        if (import.meta.env.DEV) {
          console.error('[useSubscription] Query error:', error);
        }
        throw error;
      }

      if (!data) {
        if (import.meta.env.DEV) {
          console.warn('[useSubscription] No subscription found, defaulting to free');
        }
        return {
          plan: 'free' as SubscriptionPlan,
          status: 'active' as const,
          trialEnd: null,
          current_period_end: null,
          purchase_type: 'subscription' as const,
          isOneTimePurchase: false,
        };
      }

      const purchaseType = data.purchase_type || 'subscription';
      
      return {
        plan: data.plan as SubscriptionPlan,
        status: data.status,
        trialEnd: data.trial_end ? new Date(data.trial_end) : null,
        current_period_end: data.current_period_end ? new Date(data.current_period_end) : null,
        purchase_type: purchaseType as 'subscription' | 'one_time',
        isOneTimePurchase: purchaseType === 'one_time',
      };
    },
    enabled: !!user && !options?.skip,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
  });

  // Handle skip option
  if (options?.skip) {
    return {
      subscription: {
        plan: 'premium' as SubscriptionPlan,
        status: 'active' as const,
        trialEnd: null,
        current_period_end: null,
        purchase_type: 'subscription' as const,
        isOneTimePurchase: false,
      },
      loading: false,
      hasActivePremium: true,
      hasActiveRePremium: false,
      hasCursoEstrategia: false,
      hasCursosAll: false,
      hasAnyPaidPlan: true,
      isTrialing: false,
      isOneTimePurchase: false,
    };
  }

  const isStillLoading = loading || authLoading || isError;
  
  const plan = subscription?.plan;
  const isActive = subscription?.status === 'active';
  
  return {
    subscription,
    loading: isStillLoading,
    plan,
    hasActivePremium: isStillLoading 
      ? undefined 
      : (isActive && ['premium', 'repremium'].includes(plan || '')),
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
    isOneTimePurchase: subscription?.isOneTimePurchase ?? false,
  };
}
