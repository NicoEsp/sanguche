import { useUserProfile } from '@/hooks/useUserProfile';
import { useAssessmentData } from '@/hooks/useAssessmentData';
import { useUserProgressObjectives } from '@/hooks/useUserProgressObjectives';
import { useMyExercises } from '@/hooks/useUserExercises';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

export function useProfileStats() {
  const { profile } = useUserProfile();
  const { result, updatedAt, hasAssessment } = useAssessmentData();
  const { data: objectives } = useUserProgressObjectives(profile?.id || null);
  const { data: exercises } = useMyExercises();
  const [assessmentsCount, setAssessmentsCount] = useState(0);

  useEffect(() => {
    async function fetchAssessmentsCount() {
      if (!profile?.id) return;
      
      const { count } = await supabase
        .from('assessments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id);
      
      setAssessmentsCount(count || 0);
    }

    fetchAssessmentsCount();
  }, [profile?.id]);

  const activeObjectivesCount = objectives?.filter(o => o.status !== 'completed').length || 0;
  const completedObjectivesCount = objectives?.filter(o => o.status === 'completed').length || 0;
  const gapsCount = result?.gaps?.length || 0;
  const pendingExercisesCount = exercises?.filter(e => 
    ['assigned', 'in_progress'].includes(e.status || '')
  ).length || 0;
  const completedExercisesCount = exercises?.filter(e => 
    ['submitted', 'reviewed'].includes(e.status || '')
  ).length || 0;
  const lastAssessmentDate = updatedAt 
    ? format(new Date(updatedAt), 'dd/MM/yyyy', { locale: es })
    : 'Sin evaluación';

  return {
    assessmentsCount,
    activeObjectivesCount,
    completedObjectivesCount,
    gapsCount,
    pendingExercisesCount,
    completedExercisesCount,
    lastAssessmentDate,
    loading: !profile
  };
}
