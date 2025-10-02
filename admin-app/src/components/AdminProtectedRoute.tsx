import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface AdminProtectedRouteProps {
  children: ReactNode;
}

export default function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { user, isLoading, isAuthorizedAdmin } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // SECURITY: Log unauthorized access attempts
    if (!isLoading && user && !isAuthorizedAdmin) {
      console.error('[SECURITY] Unauthorized admin access attempt:', {
        email: user.email,
        path: location.pathname,
        timestamp: new Date().toISOString(),
      });
    }
  }, [user, isLoading, isAuthorizedAdmin, location]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // SECURITY: Not authorized admin - redirect to login with error
  if (!isAuthorizedAdmin) {
    return <Navigate to="/login" replace />;
  }

  // Authorized admin - render children
  return <>{children}</>;
}
