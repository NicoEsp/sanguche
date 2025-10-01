import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const REVALIDATION_INTERVAL = 90000; // 90 seconds - aggressive re-validation

export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated, signOut } = useAuth();

  const checkAdminStatus = useCallback(async (silent: boolean = false) => {
    if (!isAuthenticated || !user) {
      setIsAdmin(false);
      setLoading(false);
      return false;
    }

    try {
      // Use server-side validation via Edge Function
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setIsAdmin(false);
        setLoading(false);
        return false;
      }

      const response = await supabase.functions.invoke('validate-admin-session', {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });

      if (response.error) {
        console.error('Error verificando permisos de admin:', response.error);
        setIsAdmin(false);
        setLoading(false);
        
        // If validation fails during re-check, force logout
        if (!silent && isAdmin) {
          console.log('⚠️ Admin validation failed during re-check, forcing logout');
          setTimeout(() => signOut(), 500);
        }
        
        return false;
      }

      const isAdminResult = response.data?.isAdmin || false;
      
      // If user was admin but validation now fails, force logout
      if (isAdmin && !isAdminResult) {
        console.log('🚨 Admin privileges lost, forcing logout');
        setIsAdmin(false);
        setLoading(false);
        setTimeout(() => signOut(), 500);
        return false;
      }

      setIsAdmin(isAdminResult);
      setLoading(false);
      return isAdminResult;

    } catch (error) {
      console.error('Error verificando permisos de admin:', error);
      setIsAdmin(false);
      setLoading(false);
      
      // Force logout on critical errors during re-validation
      if (!silent && isAdmin) {
        console.log('🚨 Critical error during re-validation, forcing logout');
        setTimeout(() => signOut(), 500);
      }
      
      return false;
    }
  }, [user, isAuthenticated, isAdmin, signOut]);

  // Initial check
  useEffect(() => {
    checkAdminStatus(false);
  }, [checkAdminStatus]);

  // Aggressive periodic re-validation every 90 seconds
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const interval = setInterval(() => {
      console.log('🔄 Periodic admin status re-validation (90s interval)');
      checkAdminStatus(true); // Silent re-validation
    }, REVALIDATION_INTERVAL);

    return () => clearInterval(interval);
  }, [isAuthenticated, user, checkAdminStatus]);

  return { isAdmin, loading };
}