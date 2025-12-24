import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAssessmentData } from './useAssessmentData';
import { useSubscription } from './useSubscription';

const FADE_DURATION = 300; // ms - debe coincidir con la animación en tailwind

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
  const [isFading, setIsFading] = useState(false);
  
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
    
    // Iniciar fade-out antes de navegar
    setIsFading(true);
    
    // Determinar destino
    let destination: string;
    if (!hasAssessment) {
      destination = '/autoevaluacion';
    } else if (hasActivePremium) {
      destination = '/progreso';
    } else {
      destination = '/mejoras';
    }
    
    // Navegar después del fade-out
    setTimeout(() => {
      navigate(destination, { replace: true });
    }, FADE_DURATION);
    
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

  return { isRedirecting, isFading };
}
