import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface AdminValidationResult {
  isAdmin: boolean;
  isValidating: boolean;
}

/**
 * Registra el evento en security_audit sin esperar la respuesta. El then() no
 * es decorativo: los builders de supabase-js son lazy y sin él el request no
 * sale (así estuvo hasta ahora: la auditoría nunca se escribía).
 */
function logSecurityEvent(userId: string, action: 'admin_validated' | 'admin_validation_failed') {
  supabase
    .rpc('log_security_event', {
      p_user_id: userId,
      p_action: action,
      p_resource_type: 'admin_access',
      p_resource_id: null,
      p_ip_address: null,
      p_user_agent: navigator.userAgent
    })
    .then(undefined, () => undefined);
}

/**
 * SECURITY: Server-side admin validation hook
 * Uses is_admin_jwt() RPC function which validates against JWT metadata
 * Cannot be bypassed by localStorage manipulation
 *
 * isValidating se deriva de para qué usuario es el último resultado, no de un
 * flag que prende el efecto: así nunca hay un render con el usuario nuevo y un
 * isAdmin viejo (o un "Acceso denegado" fugaz antes de que arranque el RPC).
 */
export function useServerAdminValidation(user: User | null): AdminValidationResult {
  const userId = user?.id ?? null;
  const [result, setResult] = useState<{ userId: string; isAdmin: boolean } | null>(null);

  useEffect(() => {
    if (!userId) return;
    let active = true;

    const validate = async () => {
      let isAdmin = false;
      try {
        // SECURITY: Call server-side function that reads from JWT metadata
        // This cannot be manipulated by the client
        const { data, error } = await supabase.rpc('is_admin_jwt', {
          check_user_id: userId
        });

        if (error) {
          if (import.meta.env.DEV) console.error('Admin validation failed');
          // SECURITY: Log failed validation attempt (fire and forget)
          logSecurityEvent(userId, 'admin_validation_failed');
        } else {
          isAdmin = data === true;
          // SECURITY: Log all admin validations for audit trail (fire and forget)
          if (isAdmin) logSecurityEvent(userId, 'admin_validated');
        }
      } catch {
        if (import.meta.env.DEV) console.error('Admin validation error');
      }

      if (active) setResult({ userId, isAdmin });
    };

    validate();
    return () => {
      active = false;
    };
  }, [userId]);

  const isValidating = userId !== null && result?.userId !== userId;

  return {
    isAdmin: !isValidating && userId !== null && result?.isAdmin === true,
    isValidating,
  };
}
