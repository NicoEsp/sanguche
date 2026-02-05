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
      const { data, error } = await supabase.rpc('get_social_proof_metrics').single();
      
      if (error) throw error;
      
      return {
        totalUsers: data?.total_users ?? 0,
        totalAssessments: data?.total_assessments ?? 0,
      };
    },
    staleTime: 1000 * 60 * 60, // 1 hour - these metrics don't change frequently
  });
}
