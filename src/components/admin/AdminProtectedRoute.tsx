import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Loader2, Shield } from 'lucide-react';

interface AdminProtectedRouteProps {
  children: ReactNode;
}

export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminAuth();
  const location = useLocation();

  // Mostrar loading mientras se verifica autenticación y permisos
  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Verificando permisos de administrador...</p>
        </div>
      </div>
    );
  }

  // Redirigir a auth si no está autenticado
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Mostrar error si no es admin
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