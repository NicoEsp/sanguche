import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface JuniorUser {
  id: string;
  name: string | null;
  email: string | null;
  user_id: string;
  assessment_date: string;
  promedio_global: number;
}

export function useRecentJuniorUsers() {
  return useQuery({
    queryKey: ['recent-junior-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          email,
          user_id,
          assessments!inner (
            created_at,
            assessment_result
          )
        `)
        .order('created_at', { referencedTable: 'assessments', ascending: false });
      
      if (error) throw error;
      
      // Filter only users with average <= 2.0 and map to our interface
      const juniorUsers = data
        ?.map(user => {
          // Get the most recent assessment
          const assessment = Array.isArray(user.assessments) 
            ? user.assessments[0] 
            : user.assessments;
          
          if (!assessment) return null;
          
          const result = assessment?.assessment_result as any;
          const promedioGlobal = result?.promedioGlobal || 0;
          
          // Only include if promedio <= 2.0 (Junior level)
          if (promedioGlobal > 2.0) return null;
          
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            user_id: user.user_id,
            assessment_date: assessment.created_at,
            promedio_global: promedioGlobal
          } as JuniorUser;
        })
        .filter((user): user is JuniorUser => user !== null)
        .slice(0, 5); // Limit to 5 users
      
      return juniorUsers || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
