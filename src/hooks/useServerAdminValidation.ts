import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface AdminValidationResult {
  isAdmin: boolean;
  isValidating: boolean;
  revalidate: () => Promise<void>;
}

/**
 * SECURITY: Server-side admin validation hook
 * Uses is_admin() RPC function which validates against user_roles table
 * Cannot be bypassed by localStorage manipulation
 */
export function useServerAdminValidation(user: User | null): AdminValidationResult {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isValidating, setIsValidating] = useState(true);

  const validateAdmin = async () => {
    if (!user) {
      setIsAdmin(false);
      setIsValidating(false);
      return;
    }

    setIsValidating(true);
    
    try {
      // SECURITY: Call server-side function that validates from user_roles table
      // This cannot be manipulated by the client
      const { data, error } = await supabase.rpc('is_admin');

      if (error) {
        console.error('Admin validation failed');
        setIsAdmin(false);
        
        // SECURITY: Log failed validation attempt (fire and forget)
        supabase.rpc('log_security_event', {
          p_user_id: user.id,
          p_action: 'admin_validation_failed',
          p_resource_type: 'admin_access',
          p_resource_id: null,
          p_ip_address: null,
          p_user_agent: navigator.userAgent
        });
      } else {
        setIsAdmin(data || false);
        
        // SECURITY: Log all admin validations for audit trail (fire and forget)
        if (data) {
          supabase.rpc('log_security_event', {
            p_user_id: user.id,
            p_action: 'admin_validated',
            p_resource_type: 'admin_access',
            p_resource_id: null,
            p_ip_address: null,
            p_user_agent: navigator.userAgent
          });
        }
      }
    } catch (error) {
      console.error('Admin validation error');
      setIsAdmin(false);
    } finally {
      setIsValidating(false);
    }
  };

  useEffect(() => {
    validateAdmin();
  }, [user?.id]);

  return {
    isAdmin,
    isValidating,
    revalidate: validateAdmin
  };
}
