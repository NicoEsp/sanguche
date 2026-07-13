import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';

interface UseSubscriptionOptions {
  skip?: boolean;
}

export type SubscriptionPlan = 'free' | 'premium' | 'repremium' | 'curso_estrategia' | 'cursos_all' | 'productprepa_business' | 'productastic_review';

// OPTIMIZED: Removed duplicate realtime subscription - AuthContext handles all realtime updates
export function useSubscription(options?: UseSubscriptionOptions) {
  const { user, isLoading: authLoading } = useAuth();

  // Use React Query for subscription data
  const { data: subscription, isLoading: loading, isError, refetch } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user) {
        return {
          plan: 'free' as SubscriptionPlan,
          status: 'active' as const,
          trialEnd: null,
          current_period_end: null,
          purchase_type: 'subscription' as const,
          isComped: false,
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
          is_comped,
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
          isComped: false,
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
        isComped: data.is_comped === true,
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
        isComped: false,
      },
      loading: false,
      hasActivePremium: true,
      hasActiveRePremium: false,
      hasCursoEstrategia: false,
      hasCursosAll: false,
      hasAnyPaidPlan: true,
      isTrialing: false,
      isOneTimePurchase: false,
      isError: false,
      refetch,
    };
  }

  // isError is kept in isStillLoading so existing consumers that gate on
  // `loading` / `hasActivePremium === undefined` keep treating a failed
  // fetch as "not resolved yet" instead of silently reading it as a free
  // account. Consumers that want an explicit escape hatch (e.g. a retry
  // button instead of an indefinite spinner) should check `isError` and
  // `refetch` directly — see Progress.tsx, which checks isError before
  // this loading gate.
  const isStillLoading = loading || authLoading || isError;

  const plan = subscription?.plan;
  const isActive = subscription?.status === 'active';
  // is_comped is an admin override: grants access to whatever plan is recorded
  // regardless of status (e.g. when LemonSqueezy has marked the sub as cancelled
  // but the admin wants to keep access).
  const hasAccess = isActive || subscription?.isComped === true;

  return {
    subscription,
    loading: isStillLoading,
    plan,
    hasActivePremium: isStillLoading
      ? undefined
      : (hasAccess && ['premium', 'repremium'].includes(plan || '')),
    hasActiveRePremium: isStillLoading
      ? undefined
      : (hasAccess && plan === 'repremium'),
    hasCursoEstrategia: isStillLoading
      ? undefined
      : (hasAccess && plan === 'curso_estrategia'),
    hasCursosAll: isStillLoading
      ? undefined
      : (hasAccess && plan === 'cursos_all'),
    hasAnyPaidPlan: isStillLoading
      ? undefined
      : (hasAccess && ['premium', 'repremium', 'curso_estrategia', 'cursos_all', 'productprepa_business', 'productastic_review'].includes(plan || '')),
    isTrialing: subscription?.trialEnd ? new Date() < subscription.trialEnd : false,
    isOneTimePurchase: subscription?.isOneTimePurchase ?? false,
    isError,
    refetch,
  };
}
