import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export interface UserProfile {
  id: string;
  name: string | null;
  user_id: string;
  mentoria_completed: boolean;
  last_mentoria_date?: string | null;
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
        .select('id, name, user_id, mentoria_completed, last_mentoria_date')
        .eq('user_id', user.id)
        .maybeSingle();

      return data;
    },
    enabled: !!user && !skip,
    staleTime: 2 * 60 * 1000, // 2 minutos - perfil no cambia frecuentemente
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Usar cache si existe
  });

  useEffect(() => {
    if (!user || skip) return;

    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const channelName = `profiles-${user.id}-${uniqueSuffix}`;

    const channel = supabase
      .channel(channelName)
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