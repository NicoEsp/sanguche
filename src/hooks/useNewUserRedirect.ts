import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAssessmentData } from './useAssessmentData';

export function useNewUserRedirect() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { hasAssessment, loading: assessmentLoading } = useAssessmentData();
  const hasRedirectedRef = useRef(false);
  
  useEffect(() => {
    // Solo ejecutar una vez
    if (hasRedirectedRef.current) return;
    
    // Esperar a que termine de cargar
    if (authLoading || assessmentLoading) return;
    
    // Solo actuar si es usuario nuevo autenticado
    const isNewUser = searchParams.get('new_user') === 'true';
    if (!isNewUser || !isAuthenticated) return;
    
    // Marcar como ejecutado
    hasRedirectedRef.current = true;
    
    // Limpiar parámetro de la URL
    searchParams.delete('new_user');
    setSearchParams(searchParams, { replace: true });
    
    // Redirigir basado en estado de evaluación
    if (!hasAssessment) {
      navigate('/autoevaluacion?from_signup=true', { replace: true });
    }
    // Si ya tiene evaluación, no hacer nada (se queda en Index)
  }, [
    authLoading, 
    assessmentLoading, 
    isAuthenticated, 
    hasAssessment, 
    searchParams, 
    setSearchParams,
    navigate
  ]);
}
