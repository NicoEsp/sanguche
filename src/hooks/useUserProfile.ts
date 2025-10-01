import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserProfile {
  id: string;
  name: string | null;
  user_id: string;
  mentoria_completed: boolean;
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchProfile() {
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, user_id, mentoria_completed')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          // SECURITY: Log error type only, not details
          console.error('Failed to fetch user profile');
          setProfile(null);
        } else {
          setProfile(data);
        }
      } catch (error) {
        // SECURITY: Log error type only, not details
        console.error('Failed to fetch user profile');
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [user]);

  return { profile, loading };
}