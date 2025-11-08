import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface JuniorUser {
  id: string;
  assessment_id: string;
  name: string | null;
  email: string | null;
  user_id: string;
  assessment_date: string;
  promedio_global: number;
  nivel: string;
  gaps_count: number;
  is_at_risk: boolean;
}

function isDiscountCandidate(assessmentResult: any): boolean {
  if (!assessmentResult) return false;
  
  const gapsCount = assessmentResult.gaps?.length || 0;
  const averageScore = assessmentResult.promedioGlobal || 0;
  const level = assessmentResult.nivel;
  const highPriorityGaps = assessmentResult.gaps?.filter(
    (gap: any) => gap.prioridad === 'Alta'
  ).length || 0;
  
  // Criterio 1: 3+ gaps
  if (gapsCount >= 3) return true;
  
  // Criterio 2: Promedio bajo
  if (averageScore < 3.0) return true;
  
  // Criterio 3: Junior con 2+ gaps de alta prioridad
  if (level === 'Junior' && highPriorityGaps >= 2) return true;
  
  return false;
}

export function useRecentJuniorUsers() {
  return useQuery({
    queryKey: ['recent-junior-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assessments')
        .select(`
          id,
          created_at,
          assessment_result,
          user_id,
          profiles!assessments_user_id_fkey(name, email, user_id)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Filter only Junior users and map to our interface
      const juniorUsers = data
        ?.map(assessment => {
          const result = assessment?.assessment_result as any;
          const profile = assessment?.profiles as any;
          const nivel = result?.nivel;
          
          // Only include if nivel is Junior
          if (nivel !== 'Junior') return null;
          
          return {
            id: profile?.user_id || assessment.user_id,
            assessment_id: assessment.id,
            name: profile?.name || null,
            email: profile?.email || null,
            user_id: profile?.user_id || assessment.user_id,
            assessment_date: assessment.created_at,
            promedio_global: result?.promedioGlobal || 0,
            nivel: nivel,
            gaps_count: result?.gaps?.length || 0,
            is_at_risk: isDiscountCandidate(result)
          } as JuniorUser;
        })
        .filter((user): user is JuniorUser => user !== null)
        .slice(0, 5); // Limit to 5 users
      
      return juniorUsers || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
