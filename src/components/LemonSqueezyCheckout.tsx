import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMixpanelTracking } from "@/hooks/useMixpanelTracking";
import { EmailCaptureDialog } from "./EmailCaptureDialog";
import { usePricing } from "@/hooks/usePricing";
import { preconnectCheckout, warmUpCheckout } from "@/lib/checkoutPrefetch";

export type PlanType = 'premium' | 'repremium' | 'curso_estrategia' | 'cursos_all';

interface LemonSqueezyCheckoutProps {
  plan?: PlanType;
  buttonText?: string;
  children?: React.ReactNode;
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

/** Error del checkout con lo que hace falta para medirlo. */
class CheckoutError extends Error {
  constructor(message: string, readonly status?: number, readonly responseData?: unknown) {
    super(message);
  }
}

export function LemonSqueezyCheckout({
  plan = 'premium',
  buttonText,
  children,
  variant = 'default',
  size = 'lg',
  className,
}: LemonSqueezyCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const loadingToastRef = useRef<string | number | null>(null);
  const { user } = useAuth();
  const { trackEvent } = useMixpanelTracking();
  const { premium, pricesByPlan } = usePricing();

  // Tras el redirect el botón queda en "Redirigiendo...". Si la persona vuelve
  // con el botón atrás y el navegador restaura la página desde el bfcache, hay
  // que devolverlo a su estado normal.
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      setLoading(false);
      if (loadingToastRef.current !== null) toast.dismiss(loadingToastRef.current);
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  const handleCheckout = async (email?: string) => {
    // Con el email tipeado pudieron pasar más de 10 s desde el hover.
    preconnectCheckout();

    setLoading(true);

    // Feedback inmediato; si falla, el mismo toast pasa a mostrar el error.
    const toastId = toast.loading("Preparando checkout...", {
      description: "Redirigiendo a la página de pago segura.",
    });
    loadingToastRef.current = toastId;

    trackEvent('checkout_started', {
      plan,
      price: pricesByPlan[plan],
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
        // invoke envuelve las respuestas no-2xx en FunctionsHttpError: el
        // mensaje real y el status vienen en la Response original.
        let status: number | undefined;
        let serverMessage: string | undefined;
        if (error instanceof FunctionsHttpError) {
          const response = error.context as Response;
          status = response.status;
          const body = await response.json().catch(() => null);
          serverMessage = body?.message || body?.error;
        }
        throw new CheckoutError(serverMessage || 'Error al crear el checkout', status);
      }

      if (!data?.checkoutUrl) {
        throw new CheckoutError('No checkout URL received', undefined, data ?? null);
      }

      trackEvent('checkout_redirect', {
        checkout_url: data.checkoutUrl,
        provider: 'lemon_squeezy',
        is_anonymous: !user,
        plan
      });
      window.location.href = data.checkoutUrl;
      // Sin setLoading(false): el botón queda en "Redirigiendo..." hasta que
      // el navegador cambia de página.
      return;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear el checkout';
      const status = error instanceof CheckoutError ? error.status : undefined;

      if (status === 429) {
        trackEvent('checkout_rate_limited', {
          provider: 'lemon_squeezy',
          is_anonymous: !user,
          user_email: user?.email || email,
          plan,
          timestamp: new Date().toISOString()
        });

        toast.error("Demasiados intentos", {
          id: toastId,
          description: "Has alcanzado el límite de intentos. Por favor espera 10 minutos e intenta nuevamente.",
          duration: 7000,
          richColors: true,
        });
      } else {
        const responseData = error instanceof CheckoutError ? error.responseData : undefined;
        trackEvent('checkout_failed', {
          error: errorMessage,
          provider: 'lemon_squeezy',
          is_anonymous: !user,
          error_type: error instanceof Error ? error.name : 'unknown',
          user_email: user?.email || email,
          plan,
          response_data: responseData !== undefined ? JSON.stringify(responseData) : undefined,
          timestamp: new Date().toISOString()
        });

        toast.error("Error en el checkout", {
          id: toastId,
          description: "No pudimos crear la sesión de pago. Por favor intenta nuevamente o contacta a soporte.",
          duration: 5000,
          richColors: true,
        });
      }

      setShowEmailDialog(false);
    }
    loadingToastRef.current = null;
    setLoading(false);
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
        className={className ?? "w-full min-h-[44px] h-auto whitespace-normal py-2 leading-snug text-center"}
        onClick={handleButtonClick}
        // Intención de compra: se prepara la conexión y la función antes del clic.
        onPointerEnter={warmUpCheckout}
        onFocus={warmUpCheckout}
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
        onEmailSubmit={handleCheckout}
        isLoading={loading}
        plan={plan}
      />
    </>
  );
}
