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
    staleTime: 60 * 60 * 1000, // 1 hour - assessments rarely change
    gcTime: 2 * 60 * 60 * 1000, // 2 hours in cache
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