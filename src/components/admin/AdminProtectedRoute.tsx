import React, { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Shield } from 'lucide-react';

interface AdminProtectedRouteProps {
  children: ReactNode;
}

export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const [isValidating, setIsValidating] = useState(true);
  const [isServerAdmin, setIsServerAdmin] = useState(false);

  // SECURITY: Server-side only validation - cannot be bypassed via localStorage
  useEffect(() => {
    const validateAdmin = async () => {
      if (!isAuthenticated || !user) {
        setIsValidating(false);
        setIsServerAdmin(false);
        return;
      }

      setIsValidating(true);
      try {
        const { data, error } = await supabase.rpc('is_admin');

        if (error || !data) {
          setIsServerAdmin(false);
          
          // SECURITY: Log unauthorized access attempt
          supabase.rpc('log_security_event', {
            p_user_id: user.id,
            p_action: 'unauthorized_admin_access_attempt',
            p_resource_type: 'admin_panel',
            p_resource_id: null,
            p_ip_address: null,
            p_user_agent: navigator.userAgent
          });
        } else {
          setIsServerAdmin(data);
        }
      } catch (error) {
        console.error('Admin validation error:', error);
        setIsServerAdmin(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateAdmin();

    // Revalidate on window focus
    const handleFocus = () => validateAdmin();
    window.addEventListener('focus', handleFocus);

    return () => window.removeEventListener('focus', handleFocus);
  }, [isAuthenticated, user?.id, location.pathname]);

  // Loading state
  if (isLoading || isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // SECURITY: Only server-validated admins can access
  if (!isServerAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}