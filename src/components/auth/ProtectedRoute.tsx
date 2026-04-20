import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  fallbackPath?: string;
}

export function ProtectedRoute({ children, fallbackPath }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const isDemoMode =
    import.meta.env.DEV &&
    import.meta.env.VITE_ALLOW_DEMO_BYPASS === "true" &&
    new URLSearchParams(location.search).has("demo");

  // Mostrar loading mientras se verifica autenticación
  if (isLoading && !isDemoMode) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  if (isDemoMode) {
    return <>{children}</>;
  }

  // Redirigir si no está autenticado
  if (!isAuthenticated) {
    const redirectTo = fallbackPath || "/auth";
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}