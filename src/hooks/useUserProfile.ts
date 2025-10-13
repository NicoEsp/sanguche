import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserProfile {
  id: string;
  name: string | null;
  user_id: string;
  mentoria_completed: boolean;
}

interface UseUserProfileOptions {
  skip?: boolean;
}

export function useUserProfile(options: UseUserProfileOptions = {}) {
  const { skip = false } = options;
  const { user } = useAuth();

  const { data: profile = null, isLoading: loading } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data } = await supabase
        .from('profiles')
        .select('id, name, user_id, mentoria_completed')
        .eq('user_id', user.id)
        .maybeSingle();

      return data;
    },
    enabled: !!user && !skip,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes in cache
  });

  return { profile, loading };
}