import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SocialProofMetrics {
  totalUsers: number;
  totalAssessments: number;
}

export function useSocialProofMetrics() {
  return useQuery({
    queryKey: ['social-proof-metrics'],
    queryFn: async (): Promise<SocialProofMetrics> => {
      const [usersResult, assessmentsResult] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('assessments').select('id', { count: 'exact', head: true }),
      ]);

      return {
        totalUsers: usersResult.count ?? 0,
        totalAssessments: assessmentsResult.count ?? 0,
      };
    },
    staleTime: 1000 * 60 * 60, // 1 hour - these metrics don't change frequently
  });
}
