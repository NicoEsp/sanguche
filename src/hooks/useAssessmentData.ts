import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AssessmentResult, AssessmentValues, Gap, NeutralArea, Strength, OptionalAssessmentValues } from '@/utils/scoring';

interface AssessmentData {
  result: AssessmentResult | null;
  values: AssessmentValues | null;
  optionalValues: OptionalAssessmentValues | null;
  loading: boolean;
  hasAssessment: boolean;
  updatedAt: string | null;
}

// OPTIMIZED: Removed duplicate realtime subscription - AuthContext handles all realtime updates
// OPTIMIZED: Removed localStorage fallback - prevents showing stale/inconsistent data
export function useAssessmentData(): AssessmentData {
  const { user } = useAuth();

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
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

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