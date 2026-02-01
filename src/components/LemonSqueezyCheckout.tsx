import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMixpanelTracking } from "@/hooks/useMixpanelTracking";
import { EmailCaptureDialog } from "./EmailCaptureDialog";
import { usePricing } from "@/hooks/usePricing";

export type PlanType = 'premium' | 'repremium' | 'curso_estrategia' | 'cursos_all';

interface LemonSqueezyCheckoutProps {
  plan?: PlanType;
  buttonText?: string;
  children?: React.ReactNode;
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onCheckoutStart?: () => void;
}

export function LemonSqueezyCheckout({ 
  plan = 'premium',
  buttonText,
  children,
  variant = 'default',
  size = 'lg',
  className,
  onSuccess, 
  onError, 
  onCheckoutStart 
}: LemonSqueezyCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { trackEvent } = useMixpanelTracking();
  const { premium, repremium, curso_estrategia, cursos_all } = usePricing();

  const handleCheckout = async (email?: string) => {
    onCheckoutStart?.();

    setLoading(true);
    
    // Feedback inmediato al usuario
    toast({
      title: "Preparando checkout...",
      description: "Redirigiendo a la página de pago segura.",
      duration: 3000,
    });
    
    trackEvent('checkout_started', { 
      plan, 
      price: plan === 'premium' ? premium.amount : 
             plan === 'repremium' ? repremium.amount :
             plan === 'curso_estrategia' ? curso_estrategia.amount : cursos_all.amount, 
      provider: 'lemon_squeezy',
      is_anonymous: !user
    });
    
    try {
      const { data, error } = await supabase.functions.invoke('lemon-squeezy-checkout', {
        body: { 
          userId: user?.id,
          email: email,
          plan
        }
      });

      if (error) {
        throw error;
      }

      if (data?.checkoutUrl) {
        trackEvent('checkout_redirect', { 
          checkout_url: data.checkoutUrl, 
          provider: 'lemon_squeezy',
          is_anonymous: !user,
          plan
        });
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('No checkout URL received');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear el checkout';
      
      // Detectar rate limit (429)
      const isRateLimited = errorMessage.includes('429') || errorMessage.toLowerCase().includes('rate limit');
      
      if (isRateLimited) {
        trackEvent('checkout_rate_limited', { 
          provider: 'lemon_squeezy',
          is_anonymous: !user,
          user_email: user?.email || email,
          plan,
          timestamp: new Date().toISOString()
        });
        
        toast({
          variant: "destructive",
          title: "Demasiados intentos",
          description: "Has alcanzado el límite de intentos. Por favor espera 10 minutos e intenta nuevamente.",
          duration: 7000
        });
      } else {
        // Track intent fallido con detalles
        trackEvent('checkout_failed', { 
          error: errorMessage, 
          provider: 'lemon_squeezy',
          is_anonymous: !user,
          error_type: error instanceof Error ? error.name : 'unknown',
          user_email: user?.email || email,
          plan,
          timestamp: new Date().toISOString()
        });
        
        toast({
          variant: "destructive",
          title: "Error en el checkout",
          description: "No pudimos crear la sesión de pago. Por favor intenta nuevamente o contacta a soporte.",
          duration: 5000
        });
      }
      
      onError?.(errorMessage);
      setShowEmailDialog(false);
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = () => {
    if (user) {
      // Usuario logueado - checkout directo
      handleCheckout();
    } else {
      // Usuario no logueado - mostrar dialog para capturar email
      setShowEmailDialog(true);
    }
  };

  const handleEmailSubmit = (email: string) => {
    handleCheckout(email);
  };

  // Default button text based on plan
  const getDefaultButtonText = () => {
    switch (plan) {
      case 'premium':
        return `Suscribirse por ${premium.formatted}/mes`;
      case 'repremium':
        return `Suscribirse a RePremium`;
      case 'curso_estrategia':
        return `Comprar Curso`;
      case 'cursos_all':
        return `Comprar Todos los Cursos`;
      default:
        return `Comprar`;
    }
  };

  return (
    <>
      <Button 
        size={size}
        variant={variant}
        className={className ?? "w-full min-h-[44px]"} 
        onClick={handleButtonClick}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Redirigiendo a checkout...
          </>
        ) : (
          children || buttonText || getDefaultButtonText()
        )}
      </Button>
      
      <EmailCaptureDialog
        open={showEmailDialog}
        onOpenChange={setShowEmailDialog}
        onEmailSubmit={handleEmailSubmit}
        isLoading={loading}
        plan={plan}
      />
    </>
  );
}
