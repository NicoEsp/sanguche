import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface PolarCheckoutProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function PolarCheckout({ onSuccess, onError }: PolarCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

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
    
    try {
      const { data, error } = await supabase.functions.invoke('polar-checkout', {
        body: { userId: user.id }
      });

      if (error) {
        throw error;
      }

      if (data?.checkoutUrl) {
        // Redirect to Polar checkout
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('No checkout URL received');
      }

    } catch (error) {
      console.error('Checkout error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al crear el checkout';
      
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
      {loading ? "Procesando..." : "Suscribirse por $9.99/mes"}
    </Button>
  );
}