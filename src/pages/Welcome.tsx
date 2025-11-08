import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Mail, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Seo } from "@/components/Seo";
import { useMixpanelTracking } from "@/hooks/useMixpanelTracking";
import { useQueryClient } from "@tanstack/react-query";
export default function Welcome() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    isAuthenticated,
    user
  } = useAuth();
  const {
    trackEvent
  } = useMixpanelTracking();
  const queryClient = useQueryClient();
  const [countdown, setCountdown] = useState(3);
  const success = searchParams.get('success') === 'true';
  const isAnonymous = searchParams.get('anonymous') === 'true';
  useEffect(() => {
    if (success) {
      trackEvent('welcome_page_viewed', {
        is_anonymous: isAnonymous,
        is_authenticated: isAuthenticated
      });

      // Force refresh subscription data
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ['subscription']
        });
      }, 2000);
    }
  }, [success, isAnonymous, isAuthenticated, trackEvent, queryClient]);

  // Auto-redirect authenticated users after countdown
  useEffect(() => {
    if (isAuthenticated && success) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/mentoria');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isAuthenticated, success, navigate]);

  // Página de bienvenida genérica (sin parámetro success)
  if (!success) {
    return <>
        <Seo title="Bienvenido a ProductPrepa" description="Acelera tu crecimiento como Product Manager con mentoría personalizada" />
        
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-3xl">¡Bienvenido a ProductPrepa!</CardTitle>
              <CardDescription className="text-lg">
                Tu plataforma para acelerar tu carrera como Product Manager
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-4 text-center">
                <p className="text-muted-foreground">
                  ProductPrepa te ayuda a desarrollar las habilidades clave para destacar en Product Management.
                </p>
                
                <div className="space-y-2 text-sm text-muted-foreground text-left">
                  <h4 className="font-semibold text-foreground text-center">¿Qué puedes hacer?</h4>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Evalúa tus habilidades actuales</li>
                    <li>Recibe recomendaciones personalizadas</li>
                    <li>Accede a recursos exclusivos</li>
                    <li>Sigue tu progreso en tiempo real</li>
                  </ul>
                </div>
              </div>

              <div className="grid gap-3">
                <Button onClick={() => navigate('/auth')} size="lg" className="w-full">
                  Iniciar sesión
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                
                <Button onClick={() => navigate('/premium')} variant="outline" size="lg" className="w-full">
                  Ver Premium
                </Button>
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-center text-muted-foreground">¿Necesitas ayuda? Contáctanos a nicoproducto@hey.com{" "}
                  <a href="mailto:soporte@productprepa.com" className="text-primary hover:underline">
                    soporte@productprepa.com
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </>;
  }

  // Página de confirmación de pago (con success=true)
  return <>
      <Seo title="Bienvenido a ProductPrepa Premium" description="Tu suscripción ha sido confirmada. Revisa tu email para activar tu cuenta." />
      
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="text-3xl">¡Pago exitoso!</CardTitle>
            <CardDescription className="text-lg">
              {isAnonymous ? "Tu suscripción ha sido confirmada" : "Bienvenido a ProductPrepa Premium"}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {isAuthenticated ?
          // Usuario ya autenticado
          <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-lg">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span>Redirigiendo a tu dashboard en {countdown}...</span>
                </div>
                
                <Button onClick={() => navigate('/mentoria')} size="lg" className="w-full">
                  Ir ahora a Premium
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div> : isAnonymous ?
          // Usuario nuevo - checkout anónimo
          <div className="space-y-4">
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-2">Revisa tu email</h3>
                      <p className="text-sm text-muted-foreground">
                        Te enviamos un email con las instrucciones para activar tu cuenta y establecer tu contraseña.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <h4 className="font-semibold text-foreground">Próximos pasos:</h4>
                  <ol className="list-decimal list-inside space-y-2 ml-2">
                    <li>Revisa tu bandeja de entrada (y spam si no lo encuentras)</li>
                    <li>Haz clic en el enlace para establecer tu contraseña</li>
                    <li>Inicia sesión y accede a todo el contenido Premium</li>
                  </ol>
                </div>

                <div className="pt-4">
                  <Button onClick={() => navigate('/auth')} variant="outline" className="w-full">
                    Ir a iniciar sesión
                  </Button>
                </div>
              </div> :
          // Usuario existente que no está logueado
          <div className="space-y-4">
                <p className="text-center text-muted-foreground">
                  Tu suscripción está activa. Inicia sesión para acceder a Premium.
                </p>
                
                <Button onClick={() => navigate('/auth')} size="lg" className="w-full">
                  Iniciar sesión
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>}

            <div className="pt-4 border-t">
              <p className="text-xs text-center text-muted-foreground">
                ¿Necesitas ayuda? Contáctanos a{" "}
                <a href="mailto:soporte@productprepa.com" className="text-primary hover:underline">
                  soporte@productprepa.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>;
}