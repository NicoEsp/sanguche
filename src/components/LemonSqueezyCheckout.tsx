import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMixpanelTracking } from "@/hooks/useMixpanelTracking";

interface LemonSqueezyCheckoutProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function LemonSqueezyCheckout({ onSuccess, onError }: LemonSqueezyCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { trackEvent } = useMixpanelTracking();

  const handleCheckout = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debes iniciar sesión para suscribirte"
      });
      return;
    }

    setLoading(true);
    trackEvent('checkout_started', { plan: 'premium', price: 25000, provider: 'lemon_squeezy' });
    
    try {
      const { data, error } = await supabase.functions.invoke('lemon-squeezy-checkout', {
        body: { userId: user.id }
      });

      if (error) {
        throw error;
      }

      if (data?.checkoutUrl) {
        trackEvent('checkout_redirect', { checkout_url: data.checkoutUrl, provider: 'lemon_squeezy' });
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('No checkout URL received');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear el checkout';
      
      trackEvent('checkout_failed', { error: errorMessage, provider: 'lemon_squeezy' });
      
      toast({
        variant: "destructive",
        title: "Error en el checkout",
        description: errorMessage
      });
      
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      size="lg" 
      className="w-full min-h-[44px]" 
      onClick={handleCheckout}
      disabled={loading}
    >
      {loading ? "Procesando..." : "Suscribirse por ARS $25.000/mes"}
    </Button>
  );
}
