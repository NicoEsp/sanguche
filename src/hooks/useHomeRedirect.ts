import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAssessmentData } from './useAssessmentData';
import { useSubscription } from './useSubscription';

/**
 * Hook que maneja la redirección automática en Home según el estado del usuario (V3):
 * - No autenticado → Se queda en Landing
 * - Autenticado sin evaluación → /autoevaluacion
 * - Autenticado Free con evaluación → /mejoras
 * - Autenticado Premium con evaluación → /progreso
 */
export function useHomeRedirect() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { hasAssessment, loading: assessmentLoading } = useAssessmentData();
  const { hasActivePremium, loading: subscriptionLoading } = useSubscription();
  const hasRedirectedRef = useRef(false);
  
  useEffect(() => {
    // Solo ejecutar una vez por sesión de componente
    if (hasRedirectedRef.current) return;
    
    // Esperar a que todo termine de cargar
    if (authLoading || assessmentLoading || subscriptionLoading) return;
    
    // Si no está autenticado, no hacer nada (se queda en landing)
    if (!isAuthenticated) return;
    
    // Marcar como ejecutado para evitar loops
    hasRedirectedRef.current = true;
    
    // Limpiar parámetro new_user si existe
    if (searchParams.has('new_user')) {
      searchParams.delete('new_user');
      setSearchParams(searchParams, { replace: true });
    }
    
    // Lógica de redirección según V3:
    if (!hasAssessment) {
      // Usuario sin evaluación → Autoevaluación
      navigate('/autoevaluacion', { replace: true });
    } else if (hasActivePremium) {
      // Premium con evaluación → Career Path
      navigate('/progreso', { replace: true });
    } else {
      // Free con evaluación → Áreas de Mejora
      navigate('/mejoras', { replace: true });
    }
  }, [
    authLoading, 
    assessmentLoading, 
    subscriptionLoading,
    isAuthenticated, 
    hasAssessment,
    hasActivePremium,
    searchParams, 
    setSearchParams,
    navigate
  ]);

  // Determinar si está en proceso de redirección
  // Solo mostramos loading si está autenticado y algo está cargando o aún no se ha redirigido
  const isLoading = authLoading || assessmentLoading || subscriptionLoading;
  const isRedirecting = isAuthenticated && (isLoading || !hasRedirectedRef.current);

  return { isRedirecting };
}
