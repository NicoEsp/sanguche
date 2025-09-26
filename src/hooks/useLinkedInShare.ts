import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export function useLinkedInShare() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const createLinkedInShare = async (assessmentId: string) => {
    if (!user) {
      toast({
        title: "Acceso requerido",
        description: "Debes iniciar sesión para compartir en LinkedIn.",
        variant: "destructive"
      });
      return false;
    }

    setLoading(true);
    try {
      // Get client IP and user agent for security logging
      const userAgent = navigator.userAgent;
      
      const { data, error } = await supabase.rpc('create_linkedin_share' as any, {
        p_assessment_id: assessmentId,
        p_user_agent: userAgent
      });

      if (error) {
        if (error.message.includes('Rate limit exceeded')) {
          toast({
            title: "Límite alcanzado",
            description: "Solo puedes compartir una vez por día en LinkedIn.",
            variant: "destructive"
          });
        } else if (error.message.includes('Assessment not found')) {
          toast({
            title: "Error",
            description: "No se encontró la evaluación para compartir.",
            variant: "destructive"
          });
        } else {
          throw error;
        }
        return false;
      }

      // Generate LinkedIn share URL with pre-filled content
      const linkedInMessage = `🚀 Estuve probando ProductPrepa de @Nicolás Espíndola y me ayudó a identificar mis brechas como Product Manager.

Es una herramienta increíble que analiza tus habilidades y te da recomendaciones personalizadas para mejorar en el rol.

Si estás en producto o querés crecer en el área, te la recomiendo 💯

#ProductManagement #Desarrollo #ProductPrepa`;

      const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin)}&text=${encodeURIComponent(linkedInMessage)}`;
      
      // Open LinkedIn sharing dialog
      window.open(linkedInUrl, '_blank', 'width=600,height=600');

      toast({
        title: "¡Compartido exitosamente!",
        description: "Ahora tienes acceso a recomendaciones personalizadas por 48 horas.",
      });

      return true;
    } catch (error) {
      console.error('Error creating LinkedIn share:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el enlace de LinkedIn. Inténtalo nuevamente.",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const checkLinkedInAccess = async () => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('has_linkedin_share_access' as any);
      
      if (error) {
        console.error('Error checking LinkedIn access:', error);
        return false;
      }

      return data || false;
    } catch (error) {
      console.error('Error checking LinkedIn access:', error);
      return false;
    }
  };

  return {
    createLinkedInShare,
    checkLinkedInAccess,
    loading
  };
}