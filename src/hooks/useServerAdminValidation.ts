import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ValidationState {
  isValidated: boolean;
  isAdmin: boolean;
  validationToken: string;
  expiresAt: number;
  loading: boolean;
}

const REVALIDATION_INTERVAL = 90000; // 90 seconds
const TOKEN_BUFFER = 10000; // Re-validate 10 seconds before expiry

export function useServerAdminValidation() {
  const [state, setState] = useState<ValidationState>({
    isValidated: false,
    isAdmin: false,
    validationToken: '',
    expiresAt: 0,
    loading: true,
  });
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const validateAdmin = useCallback(async (silent: boolean = false) => {
    if (!user) {
      setState({
        isValidated: true,
        isAdmin: false,
        validationToken: '',
        expiresAt: 0,
        loading: false,
      });
      return false;
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('No active session');
      }

      const response = await supabase.functions.invoke('validate-admin-session', {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (response.error) {
        throw response.error;
      }

      const { isAdmin, validationToken, expiresAt } = response.data;

      if (!isAdmin) {
        // User is NOT admin - force logout
        if (!silent) {
          toast({
            title: 'Acceso Denegado',
            description: 'No tienes permisos de administrador.',
            variant: 'destructive',
          });
        }
        
        setState({
          isValidated: true,
          isAdmin: false,
          validationToken: '',
          expiresAt: 0,
          loading: false,
        });

        // Force sign out after a brief delay
        setTimeout(() => {
          signOut();
        }, 1000);

        return false;
      }

      setState({
        isValidated: true,
        isAdmin: true,
        validationToken,
        expiresAt,
        loading: false,
      });

      return true;

    } catch (error) {
      console.error('❌ Server admin validation failed:', error);
      
      if (!silent) {
        toast({
          title: 'Error de Validación',
          description: 'No se pudo validar los permisos de administrador.',
          variant: 'destructive',
        });
      }

      setState({
        isValidated: true,
        isAdmin: false,
        validationToken: '',
        expiresAt: 0,
        loading: false,
      });

      return false;
    }
  }, [user, signOut, toast]);

  // Initial validation
  useEffect(() => {
    validateAdmin(false);
  }, [validateAdmin]);

  // Periodic re-validation every 90 seconds
  useEffect(() => {
    if (!state.isAdmin) return;

    const interval = setInterval(() => {
      console.log('🔄 Periodic admin re-validation triggered');
      validateAdmin(true); // Silent re-validation
    }, REVALIDATION_INTERVAL);

    return () => clearInterval(interval);
  }, [state.isAdmin, validateAdmin]);

  // Re-validate before token expires
  useEffect(() => {
    if (!state.isAdmin || !state.expiresAt) return;

    const timeUntilExpiry = state.expiresAt - Date.now() - TOKEN_BUFFER;
    
    if (timeUntilExpiry <= 0) {
      // Token already expired, re-validate immediately
      validateAdmin(true);
      return;
    }

    const timeout = setTimeout(() => {
      console.log('⏰ Token expiring soon, re-validating...');
      validateAdmin(true);
    }, timeUntilExpiry);

    return () => clearTimeout(timeout);
  }, [state.expiresAt, state.isAdmin, validateAdmin]);

  // Validate specific action server-side
  const validateAction = useCallback(async (actionName: string): Promise<boolean> => {
    console.log(`🔐 Validating admin action: ${actionName}`);
    
    // Check if current token is still valid
    if (state.expiresAt < Date.now()) {
      console.log('⚠️ Token expired, re-validating...');
      return await validateAdmin(false);
    }

    // If token is still valid and user is admin, allow action
    if (state.isAdmin && state.validationToken) {
      return true;
    }

    // Otherwise, force re-validation
    return await validateAdmin(false);
  }, [state, validateAdmin]);

  return {
    isAdmin: state.isAdmin,
    isValidated: state.isValidated,
    loading: state.loading,
    validationToken: state.validationToken,
    validateAction,
    revalidate: () => validateAdmin(false),
  };
}
