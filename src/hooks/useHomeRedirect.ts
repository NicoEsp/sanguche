import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileCompositeData } from './useProfileCompositeData';
import { isPremiumPlan } from '@/constants/plans';

const FADE_DURATION = 150;

/**
 * Hook que maneja la redirección automática en Home según el estado del usuario (V4):
 * - No autenticado → Se queda en Landing
 * - Premium/RePremium sin evaluación → /autoevaluacion
 * - Premium/RePremium con evaluación → /progreso (Career Path; ignora returnTo)
 * - Free con returnTo → Redirige a returnTo (ej: /preguntas)
 * - Free sin evaluación → /autoevaluacion
 * - Free con evaluación → /mejoras
 *
 * "Premium" incluye planes premium/repremium activos o con acceso de cortesía (is_comped).
 *
 * OPTIMIZED: Uses single composite query instead of separate assessment + subscription hooks
 */
export function useHomeRedirect() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: compositeData, loading: compositeLoading } = useProfileCompositeData();
  // Se guarda PARA QUÉ usuario se redirigió: al cambiar de cuenta sin recargar,
  // la identidad puede tardar un instante en actualizarse y la primera pasada
  // decide con los datos cacheados del usuario anterior. Cuando la identidad
  // se asienta, el efecto vuelve a correr y corrige el destino.
  const redirectedForUserRef = useRef<string | null>(null);
  const [isFading, setIsFading] = useState(false);
  const [destination, setDestination] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || (isAuthenticated && compositeLoading)) return;
    if (!isAuthenticated || !user) return;
    if (redirectedForUserRef.current === user.id) return;

    redirectedForUserRef.current = user.id;
    
    const returnTo = searchParams.get('returnTo');
    
    if (searchParams.has('new_user') || searchParams.has('returnTo')) {
      searchParams.delete('new_user');
      searchParams.delete('returnTo');
      setSearchParams(searchParams, { replace: true });
    }
    
    setIsFading(true);
    
    let dest: string;
    const hasAssessment = compositeData.assessmentsCount > 0;
    const sub = compositeData.subscription;
    // is_comped es un override de admin: mantiene acceso aunque el status no sea 'active'.
    const hasActivePremium = sub
      ? isPremiumPlan(sub.plan) && (sub.status === 'active' || sub.isComped === true)
      : false;

    if (hasActivePremium) {
      // Premium/RePremium van directo a Career Path (ignoran returnTo).
      // Si todavía no hicieron la autoevaluación, esa va primero.
      dest = hasAssessment ? '/progreso' : '/autoevaluacion';
    } else if (returnTo) {
      dest = decodeURIComponent(returnTo);
    } else if (!hasAssessment) {
      dest = '/autoevaluacion';
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
    user,
    compositeData,
    searchParams,
    setSearchParams,
    navigate
  ]);

  const isLoading = authLoading || compositeLoading;
  const isRedirecting = isAuthenticated && (isLoading || redirectedForUserRef.current !== (user?.id ?? null));

  return { isRedirecting, isFading, destination };
}
