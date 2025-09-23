import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserProfile {
  id: string;
  name: string | null;
  user_id: string;
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const isFetchingRef = useRef(false);
  const cacheRef = useRef<{ userId: string; profile: UserProfile | null } | null>(null);

  // Estabilizar el userId para evitar re-renders innecesarios
  const userId = useMemo(() => user?.id || null, [user?.id]);

  const fetchProfile = useCallback(async (currentUserId: string) => {
    // Evitar peticiones concurrentes
    if (isFetchingRef.current) {
      console.log('🚫 Fetch already in progress, skipping...');
      return;
    }

    // Verificar cache
    if (cacheRef.current && cacheRef.current.userId === currentUserId) {
      console.log('📦 Using cached profile data');
      setProfile(cacheRef.current.profile);
      setLoading(false);
      return;
    }

    console.log('🔄 Fetching profile for user:', currentUserId);
    isFetchingRef.current = true;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, user_id')
        .eq('user_id', currentUserId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        setProfile(null);
        cacheRef.current = { userId: currentUserId, profile: null };
      } else {
        console.log('✅ Profile fetched successfully:', data);
        setProfile(data);
        cacheRef.current = { userId: currentUserId, profile: data };
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
      cacheRef.current = { userId: currentUserId, profile: null };
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!userId) {
      console.log('👤 No user ID, clearing profile');
      setProfile(null);
      setLoading(false);
      cacheRef.current = null;
      return;
    }

    fetchProfile(userId);
  }, [userId, fetchProfile]); // Dependencia optimizada usando solo userId

  return { profile, loading };
}