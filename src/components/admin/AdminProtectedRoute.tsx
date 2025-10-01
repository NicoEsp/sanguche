import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useServerAdminValidation } from '@/hooks/useServerAdminValidation';
import { Loader2, Shield } from 'lucide-react';

interface AdminProtectedRouteProps {
  children: ReactNode;
}

export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading, isValidated } = useServerAdminValidation();
  const location = useLocation();

  // Mostrar loading mientras se verifica autenticación y permisos
  // SECURITY: Block access by default until validation completes
  if (authLoading || adminLoading || !isValidated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">
            Validando permisos de administrador con el servidor...
          </p>
          <p className="text-xs text-muted-foreground">
            Validación server-side en progreso
          </p>
        </div>
      </div>
    );
  }

  // Redirigir a auth si no está autenticado
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // SECURITY: Block access if not admin (server-side validated)
  if (!isAdmin) {
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

  return <>{children}</>;
}