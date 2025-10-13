import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { Calendar, CreditCard, User } from "lucide-react";

export function SubscriptionManager() {
  const { subscription, loading } = useSubscription();
  const [canceling, setCanceling] = useState(false);
  const { toast } = useToast();

  const handleCancelSubscription = async () => {
    if (!subscription || subscription.plan !== 'premium') {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se encontró información de la suscripción"
      });
      return;
    }

    setCanceling(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { error } = await supabase.functions.invoke('cancel-subscription');

      if (error) throw error;

      toast({
        title: "Suscripción cancelada",
        description: "Tu suscripción se ha cancelado correctamente. Mantendrás acceso hasta el final del período actual."
      });
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cancelar la suscripción. Inténtalo de nuevo."
      });
    } finally {
      setCanceling(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-8 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isPremium = subscription?.plan === 'premium' && subscription?.status === 'active';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Gestión de Suscripción
          </CardTitle>
          <Badge variant={isPremium ? "default" : "secondary"}>
            {isPremium ? "Premium" : "Gratuito"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">Plan actual</p>
              <p className="text-sm text-muted-foreground">
                {isPremium ? "Premium - $9.99/mes" : "Gratuito"}
              </p>
            </div>
          </div>

          {subscription?.current_period_end && (
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Próximo cobro</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(subscription.current_period_end).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          )}
        </div>

        {isPremium && (
          <div className="pt-4 border-t">
            <Button 
              variant="destructive" 
              onClick={handleCancelSubscription}
              disabled={canceling}
              className="w-full"
            >
              {canceling ? "Cancelando..." : "Cancelar Suscripción"}
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Mantendrás acceso a las funciones premium hasta el final del período actual
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}