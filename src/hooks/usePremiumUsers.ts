import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PremiumUser {
  id: string;
  name: string | null;
  email: string | null;
  user_id: string;
  mentoria_completed: boolean;
  user_subscriptions: {
    plan: 'free' | 'premium';
    status: 'active' | 'inactive' | 'cancelled';
    created_at: string;
  };
}

export function usePremiumUsers() {
  return useQuery({
    queryKey: ['premium-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          email,
          user_id,
          mentoria_completed,
          user_subscriptions!inner (
            plan,
            status,
            created_at
          )
        `)
        .eq('user_subscriptions.plan', 'premium')
        .eq('user_subscriptions.status', 'active')
        .order('name');
      
      if (error) throw error;
      
      return data?.map(user => {
        const subscription = Array.isArray(user.user_subscriptions)
          ? user.user_subscriptions[0]
          : user.user_subscriptions;
        
        return {
          ...user,
          user_subscriptions: subscription
        };
      }).filter(user => user.user_subscriptions) as PremiumUser[];
    }
  });
}

export function useRefreshPremiumUsers() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: ['premium-users'] });
  };
}
