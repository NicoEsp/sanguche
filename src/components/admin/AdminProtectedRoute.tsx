import React, { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';

interface AdminProtectedRouteProps {
  children: ReactNode;
}

export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { isAuthenticated, isAdmin, isLoading, user } = useAuth();
  const location = useLocation();
  const [serverValidated, setServerValidated] = useState(false);
  const [validationFailed, setValidationFailed] = useState(false);

  // SECURITY: Double-check admin status with server-side validation
  useEffect(() => {
    const validateServerSide = async () => {
      if (!isAuthenticated || !user) return;

      try {
        const { data, error } = await supabase.rpc('is_admin_jwt', {
          check_user_id: user.id
        });

        if (error || !data) {
          setValidationFailed(true);
          // SECURITY: Log unauthorized access attempt (fire and forget)
          supabase.rpc('log_security_event', {
            p_user_id: user.id,
            p_action: 'unauthorized_admin_access_attempt',
            p_resource_type: 'admin_panel',
            p_resource_id: null,
            p_ip_address: null,
            p_user_agent: navigator.userAgent
          });
        } else {
          setServerValidated(true);
        }
      } catch (error) {
        setValidationFailed(true);
      }
    };

    if (isAuthenticated && isAdmin && !serverValidated) {
      validateServerSide();
    }
  }, [isAuthenticated, isAdmin, user, serverValidated]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Verificando permisos...</p>
          <p className="text-xs text-muted-foreground">Server-side validation</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // SECURITY: Require both client and server-side validation
  if (!isAdmin || (!serverValidated && !validationFailed)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto p-6">
          <Shield className="h-16 w-16 mx-auto text-destructive" />
          <h1 className="text-2xl font-bold text-foreground">Acceso Denegado</h1>
          <p className="text-muted-foreground">
            No tienes permisos de administrador para acceder a esta área.
          </p>
          <button 
            onClick={() => window.history.back()} 
            className="text-primary hover:underline"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  // SECURITY: Show warning if validation failed but localStorage claims admin
  if (validationFailed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto p-6">
          <AlertTriangle className="h-16 w-16 mx-auto text-destructive" />
          <h1 className="text-2xl font-bold text-foreground">Acceso No Autorizado</h1>
          <p className="text-muted-foreground">
            Se detectó un intento de acceso no autorizado. Este incidente ha sido registrado.
          </p>
          <button 
            onClick={() => {
              // Clear potentially manipulated localStorage
              const keys = Object.keys(localStorage).filter(k => k.includes('sb-') && k.includes('auth-token'));
              keys.forEach(k => localStorage.removeItem(k));
              window.location.href = '/auth';
            }}
            className="text-primary hover:underline"
          >
            Iniciar sesión nuevamente
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}