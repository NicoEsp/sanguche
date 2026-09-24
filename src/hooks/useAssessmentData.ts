import { useQuery, type QueryClient } from '@tanstack/react-query';
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

/** Lo que guarda la query ['assessment-data', userId]. */
interface CachedAssessment {
  result: AssessmentResult;
  values: AnyAssessmentValues;
  hasAssessment: true;
  updatedAt: string | null;
  assessmentType: AssessmentTypeKey | null;
}

/**
 * Deja en la caché la evaluación recién guardada: es exactamente lo que
 * devolvería un refetch, así que no hace falta esperarlo para mostrarla ni
 * para que /mejoras y la home la vean.
 */
export function cacheSavedAssessment(
  queryClient: QueryClient,
  userId: string,
  saved: Omit<CachedAssessment, 'hasAssessment'>
) {
  queryClient.setQueryData<CachedAssessment>(['assessment-data', userId], { ...saved, hasAssessment: true });
}

// OPTIMIZED: Removed duplicate realtime subscription - AuthContext handles all realtime updates
// OPTIMIZED: Removed localStorage fallback - prevents showing stale/inconsistent data
export function useAssessmentData(): AssessmentData {
  const { user } = useAuth();

  const { data: assessmentData, isLoading } = useQuery({
    queryKey: ['assessment-data', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Una sola query: assessments.user_id es el id del perfil, así que se
      // filtra por el user_id del perfil embebido en vez de buscar primero el
      // perfil (eran dos round trips en fila). La tabla tiene dos FKs a
      // profiles, por eso el embed lleva el nombre de una.
      const { data } = await supabase
        .from('assessments')
        .select('assessment_result, assessment_values, assessment_type, created_at, profiles!assessments_user_id_fkey!inner(user_id)')
        .eq('profiles.user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && data.assessment_result) {
        const result = data.assessment_result as unknown as AssessmentResult;
        const cached: CachedAssessment = {
          result,
          values: data.assessment_values as AnyAssessmentValues,
          hasAssessment: true,
          updatedAt: data.created_at ?? null,
          assessmentType: (data.assessment_type ?? result.assessmentType ?? null) as AssessmentTypeKey | null
        };
        return cached;
      }

      return null;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
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
