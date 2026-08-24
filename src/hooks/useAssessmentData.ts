import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AnyAssessmentValues, AssessmentResult, AssessmentTypeKey, Gap, NeutralArea, Strength, OptionalAssessmentValues } from '@/utils/scoring';

interface AssessmentData {
  result: AssessmentResult | null;
  values: AnyAssessmentValues | null;
  optionalValues: OptionalAssessmentValues | null;
  loading: boolean;
  hasAssessment: boolean;
  updatedAt: string | null;
  assessmentType: AssessmentTypeKey | null;
  /** Evaluación guardada antes de que existieran los perfiles (sin tipo). */
  isLegacyAssessment: boolean;
}

/**
 * Clave y fetch de la evaluación, en un solo lugar.
 *
 * Se exporta porque el prefetch del sidebar tiene que usar exactamente esto:
 * antes armaba su propia query con la clave ['assessment', authUid] y
 * filtrando assessments.user_id por el uid de auth. Esa columna apunta a
 * profiles.id, así que no matcheaba nunca, y encima quedaba cacheada bajo una
 * clave que no lee nadie — o sea un round trip al pedo en cada hover.
 *
 * `userId` es el uid de auth; el profile.id se resuelve adentro.
 */
export const assessmentDataQuery = (userId: string | undefined) => ({
  queryKey: ['assessment-data', userId] as const,
  queryFn: async () => {
    if (!userId) return null;

    // Get profile.id first (using prefetched data if available)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!profile?.id) return null;

    // Fetch assessment
    const { data } = await supabase
      .from('assessments')
      .select('assessment_result, assessment_values, assessment_type, created_at')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data && data.assessment_result) {
      const result = data.assessment_result as AssessmentResult;
      return {
        result,
        values: data.assessment_values as AnyAssessmentValues,
        hasAssessment: true,
        updatedAt: data.created_at ?? null,
        assessmentType: (data.assessment_type ?? result.assessmentType ?? null) as AssessmentTypeKey | null
      };
    }

    return null;
  },
  staleTime: 5 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
});

// OPTIMIZED: Removed duplicate realtime subscription - AuthContext handles all realtime updates
// OPTIMIZED: Removed localStorage fallback - prevents showing stale/inconsistent data
export function useAssessmentData(): AssessmentData {
  const { user } = useAuth();

  const { data: assessmentData, isLoading } = useQuery({
    ...assessmentDataQuery(user?.id),
    enabled: !!user,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const assessmentType = assessmentData?.assessmentType || null;

  return {
    result: assessmentData?.result || null,
    values: assessmentData?.values || null,
    optionalValues: assessmentData?.result?.optionalDomains || null,
    loading: isLoading,
    hasAssessment: assessmentData?.hasAssessment || false,
    updatedAt: assessmentData?.updatedAt || null,
    assessmentType,
    isLegacyAssessment: (assessmentData?.hasAssessment || false) && assessmentType === null
  };
}

export type { Gap, NeutralArea, Strength };
