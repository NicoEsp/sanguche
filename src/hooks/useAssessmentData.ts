import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getAssessment } from '@/utils/storage';
import { AssessmentResult, AssessmentValues, Gap, NeutralArea, Strength } from '@/utils/scoring';

interface AssessmentData {
  result: AssessmentResult | null;
  values: AssessmentValues | null;
  loading: boolean;
  hasAssessment: boolean;
  updatedAt: string | null;
}

export function useAssessmentData(): AssessmentData {
  const { user } = useAuth();

  // First fetch profile
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      return data;
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Then fetch assessment only if profile exists
  const { data: assessmentData, isLoading } = useQuery({
    queryKey: ['assessment-data', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;

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
    enabled: !!profile?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fallback to local storage if no assessment in database
  if (!isLoading && !assessmentData && user) {
    const localAssessment = getAssessment();
    if (localAssessment) {
      return {
        result: localAssessment.result || null,
        values: localAssessment.values || null,
        loading: false,
        hasAssessment: !!localAssessment,
        updatedAt: localAssessment.createdAt ?? null
      };
    }
  }

  return {
    result: assessmentData?.result || null,
    values: assessmentData?.values || null,
    loading: isLoading,
    hasAssessment: assessmentData?.hasAssessment || false,
    updatedAt: assessmentData?.updatedAt || null
  };
}

export type { Gap, NeutralArea, Strength };