import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserProfile {
  id: string;
  name: string | null;
  user_id: string;
  mentoria_completed: boolean;
  last_mentoria_date?: string | null;
  is_founder?: boolean;
}

interface UseUserProfileOptions {
  skip?: boolean;
}

// OPTIMIZED: Removed duplicate realtime subscription - AuthContext handles all realtime updates
export function useUserProfile(options: UseUserProfileOptions = {}) {
  const { skip = false } = options;
  const { user } = useAuth();

  const { data: profile = null, isLoading: loading } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data } = await supabase
        .from('profiles')
        .select('id, name, user_id, mentoria_completed, last_mentoria_date, is_founder')
        .eq('user_id', user.id)
        .maybeSingle();

      return data;
    },
    enabled: !!user && !skip,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return { profile, loading };
}