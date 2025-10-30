import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

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
  const queryClient = useQueryClient();

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
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (!user || skip) return;

    const channel = supabase
      .channel(`profiles-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['user-profile', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, skip, queryClient]);

  return { profile, loading };
}