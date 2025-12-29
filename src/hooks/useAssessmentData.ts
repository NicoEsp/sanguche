import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getAssessment } from '@/utils/storage';
import { AssessmentResult, AssessmentValues, Gap, NeutralArea, Strength, OptionalAssessmentValues } from '@/utils/scoring';
import { useEffect } from 'react';

interface AssessmentData {
  result: AssessmentResult | null;
  values: AssessmentValues | null;
  optionalValues: OptionalAssessmentValues | null;
  loading: boolean;
  hasAssessment: boolean;
  updatedAt: string | null;
}

export function useAssessmentData(): AssessmentData {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Optimized: Single query that joins profile data directly
  const { data: assessmentData, isLoading } = useQuery({
    queryKey: ['assessment-data', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Get profile.id first (using prefetched data if available)
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile?.id) return null;

      // Fetch assessment
      const { data } = await supabase
        .from('assessments')
        .select('assessment_result, assessment_values, created_at')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && data.assessment_result) {
        return {
          result: data.assessment_result as AssessmentResult,
          values: data.assessment_values as AssessmentValues,
          hasAssessment: true,
          updatedAt: data.created_at ?? null
        };
      }

      return null;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutos - assessment casi nunca cambia
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Usar cache si existe
  });

  useEffect(() => {
    if (!user) return;

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
      const channelName = `assessments-${profile.id}-${uniqueSuffix}`;

      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'assessments',
            filter: `user_id=eq.${profile.id}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ['assessment-data', user.id] });
            queryClient.invalidateQueries({ queryKey: ['assessment-data-check', user.id] });
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
  }, [user, queryClient]);

  // Fallback to local storage if no assessment in database
  if (!isLoading && !assessmentData && user) {
    const localAssessment = getAssessment();
    if (localAssessment) {
      return {
        result: localAssessment.result || null,
        values: localAssessment.values || null,
        optionalValues: localAssessment.optionalValues || null,
        loading: false,
        hasAssessment: !!localAssessment,
        updatedAt: localAssessment.createdAt ?? null
      };
    }
  }

  return {
    result: assessmentData?.result || null,
    values: assessmentData?.values || null,
    optionalValues: assessmentData?.result?.optionalDomains || null,
    loading: isLoading,
    hasAssessment: assessmentData?.hasAssessment || false,
    updatedAt: assessmentData?.updatedAt || null
  };
}

export type { Gap, NeutralArea, Strength };