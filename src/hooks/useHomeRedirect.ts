import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileCompositeData } from './useProfileCompositeData';
import { PREMIUM_PLANS } from '@/constants/plans';

const FADE_DURATION = 150;

/**
 * Hook que maneja la redirección automática en Home según el estado del usuario (V4):
 * - No autenticado → Se queda en Landing
 * - Autenticado con returnTo → Redirige a returnTo (ej: /preguntas)
 * - Autenticado sin evaluación → /autoevaluacion
 * - Autenticado Free con evaluación → /mejoras
 * - Autenticado Premium con evaluación → /progreso
 * 
 * OPTIMIZED: Uses single composite query instead of separate assessment + subscription hooks
 */
export function useHomeRedirect() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: compositeData, loading: compositeLoading } = useProfileCompositeData();
  const hasRedirectedRef = useRef(false);
  const [isFading, setIsFading] = useState(false);
  const [destination, setDestination] = useState<string | null>(null);
  
  useEffect(() => {
    if (hasRedirectedRef.current) return;
    if (authLoading || (isAuthenticated && compositeLoading)) return;
    if (!isAuthenticated) return;
    
    hasRedirectedRef.current = true;
    
    const returnTo = searchParams.get('returnTo');
    
    if (searchParams.has('new_user') || searchParams.has('returnTo')) {
      searchParams.delete('new_user');
      searchParams.delete('returnTo');
      setSearchParams(searchParams, { replace: true });
    }
    
    setIsFading(true);
    
    let dest: string;
    const hasAssessment = compositeData.assessmentsCount > 0;
    const hasActivePremium = compositeData.subscription
      ? PREMIUM_PLANS.includes(compositeData.subscription.plan) && compositeData.subscription.status === 'active'
      : false;
    
    if (returnTo) {
      dest = decodeURIComponent(returnTo);
    } else if (!hasAssessment) {
      dest = '/autoevaluacion';
    } else if (hasActivePremium) {
      dest = '/progreso';
    } else {
      dest = '/mejoras';
    }
    
    setDestination(dest);
    
    setTimeout(() => {
      navigate(dest, { replace: true });
    }, FADE_DURATION);
    
  }, [
    authLoading, 
    compositeLoading,
    isAuthenticated, 
    compositeData,
    searchParams, 
    setSearchParams,
    navigate
  ]);

  const isLoading = authLoading || compositeLoading;
  const isRedirecting = isAuthenticated && (isLoading || !hasRedirectedRef.current);

  return { isRedirecting, isFading, destination };
}
