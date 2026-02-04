import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { SubscriptionPlan } from './useSubscription';

export interface ProfileCompositeData {
  profile: {
    id: string;
    name: string | null;
    user_id: string;
    mentoria_completed: boolean;
    last_mentoria_date?: string | null;
    is_founder?: boolean;
  } | null;
  subscription: {
    plan: SubscriptionPlan;
    status: 'active' | 'inactive' | 'cancelled';
    current_period_end: Date | null;
    purchase_type: 'subscription' | 'one_time';
    isOneTimePurchase: boolean;
  } | null;
  assessmentsCount: number;
  lastAssessmentDate: string | null;
}

const EMPTY_COMPOSITE_DATA: ProfileCompositeData = {
  profile: null,
  subscription: null,
  assessmentsCount: 0,
  lastAssessmentDate: null,
};

/**
 * Shared queryFn for fetching composite user data.
 * Used by both useProfileCompositeData hook and AuthContext prefetch.
 */
export async function fetchCompositeData(userId: string): Promise<ProfileCompositeData> {
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select(`
      id,
      name,
      user_id,
      mentoria_completed,
      last_mentoria_date,
      is_founder,
      user_subscriptions(plan, status, current_period_end, purchase_type)
    `)
    .eq('user_id', userId)
    .maybeSingle();

  if (profileError) {
    if (import.meta.env.DEV) {
      console.error('[fetchCompositeData] Profile query error:', profileError);
    }
    throw profileError;
  }

  const { data: assessmentsData, error: assessmentsError } = await supabase
    .from('assessments')
    .select('id, updated_at')
    .eq('user_id', profileData?.id || '')
    .order('updated_at', { ascending: false })
    .limit(100);

  if (assessmentsError && import.meta.env.DEV) {
    console.error('[fetchCompositeData] Assessments query error:', assessmentsError);
  }

  const subscriptionData = profileData?.user_subscriptions;
  const purchaseType = subscriptionData?.purchase_type || 'subscription';

  return {
    profile: profileData ? {
      id: profileData.id,
      name: profileData.name,
      user_id: profileData.user_id || '',
      mentoria_completed: profileData.mentoria_completed,
      last_mentoria_date: profileData.last_mentoria_date,
      is_founder: profileData.is_founder,
    } : null,
    subscription: subscriptionData ? {
      plan: subscriptionData.plan as SubscriptionPlan,
      status: subscriptionData.status as 'active' | 'inactive' | 'cancelled',
      current_period_end: subscriptionData.current_period_end
        ? new Date(subscriptionData.current_period_end)
        : null,
      purchase_type: purchaseType as 'subscription' | 'one_time',
      isOneTimePurchase: purchaseType === 'one_time',
    } : {
      plan: 'free' as SubscriptionPlan,
      status: 'active' as const,
      current_period_end: null,
      purchase_type: 'subscription' as const,
      isOneTimePurchase: false,
    },
    assessmentsCount: assessmentsData?.length || 0,
    lastAssessmentDate: assessmentsData?.[0]?.updated_at || null,
  };
}

// OPTIMIZED: Removed duplicate realtime subscription - AuthContext handles all realtime updates
export function useProfileCompositeData() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['user-composite-data', user?.id],
    queryFn: () => user ? fetchCompositeData(user.id) : Promise.resolve(EMPTY_COMPOSITE_DATA),
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Use cache - realtime handles updates via AuthContext
  });

  return {
    data: data || EMPTY_COMPOSITE_DATA,
    loading: isLoading,
  };
}
