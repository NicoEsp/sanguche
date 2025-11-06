import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, Star, TrendingUp, BookOpen, MapPin, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { Seo } from "@/components/Seo";
import { LemonSqueezyCheckout } from "@/components/LemonSqueezyCheckout";
import { useMixpanelTracking } from "@/hooks/useMixpanelTracking";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Premium() {
  const {
    user
  } = useAuth();
  const {
    hasActivePremium
  } = useSubscription();
  const { trackEvent } = useMixpanelTracking();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Track premium page view
  useEffect(() => {
    trackEvent('premium_page_viewed', {
      has_premium: hasActivePremium
    });
  }, [hasActivePremium, trackEvent]);

  // Check for success payment and force subscription refresh
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      // Wait for webhook to process (2 seconds), then invalidate subscription
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['subscription'] });
        
        trackEvent('checkout_completed', {
          plan: 'premium',
          price: 50000,
          provider: 'lemon_squeezy'
        });
        
        toast({
          title: "¡Suscripción exitosa!",
          description: "Bienvenido a ProductPrepa Premium. Ya tienes acceso a todas las funcionalidades."
        });
        
        window.history.replaceState({}, '', '/premium');
      }, 2000);
    }
  }, [toast, trackEvent, queryClient]);
  return <>
      <Seo title="Premium: Crece como Product Manager con mentoría personalizada | ProductPrepa" description="Evaluá tus habilidades, trabajá en tus áreas de mejora y recibí mentoría mensual con NicoProducto. Desde ARS $50.000/mes. Cancelá cuando quieras." canonical="/premium" />
      
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        {/* Hero Section */}
        <section className="pt-12 pb-8 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent md:text-4xl">
              Crece como Product Manager, con foco y acompañamiento real
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
              Descubrí una forma práctica de avanzar: evaluá tus habilidades, trabajá en tus áreas de mejora y recibí guía personalizada para construir tu propio camino en Producto.
            </p>
          </div>
        </section>

        {/* Feature Comparison */}
        <section className="px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">¿Qué incluye Premium?</h2>
            
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Free Plan */}
              <Card className="relative">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🥪</span>
                    <CardTitle className="text-2xl">PLAN GRATUITO</CardTitle>
                  </div>
                  <CardDescription>Ideal para dar el primer paso</CardDescription>
                  <div className="text-3xl font-bold">$0<span className="text-sm font-normal text-muted-foreground">/mes</span></div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Autoevaluación completa de tus habilidades basada en 11 dominios específicos</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Identificación de tus áreas de mejora</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Recursos introductorios sobre Product Management</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>PDFs y guías gratuitas para seguir aprendiendo</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Premium Plan */}
              <Card className="relative border-primary bg-primary/5">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1">30 usuarios activos</Badge>
                </div>
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">⭐</span>
                    <CardTitle className="text-2xl">PLAN PREMIUM</CardTitle>
                  </div>
                  <CardDescription>Pensado para quienes quieren crecer en serio</CardDescription>
                  <div className="text-3xl font-bold">ARS $50.000<span className="text-sm font-normal text-muted-foreground">/mes</span></div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>Todo lo incluido en el plan gratuito</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>Guía de carrera personalizada diseñada por <a href="https://www.linkedin.com/in/nicolas-espindola/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors underline">NicoProducto</a></span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>Seguimiento visual de tu progreso y objetivos</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>Recursos curados según tus áreas de mejora</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>Roadmap de carrera diseñado a tu medida</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>Nuevos contenidos y ejercicios cada mes</span>
                    </li>
                  </ul>
                  
                  <div className="mt-6">
                    {hasActivePremium ? <Button asChild size="lg" className="w-full min-h-[44px]">
                        <Link to="/mentoria">Acceder a Premium</Link>
                      </Button> : <LemonSqueezyCheckout />}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Detailed Features */}
        <section className="py-12 px-4 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Funciones Premium en Detalle</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card>
                <CardHeader className="text-center">
                  <MessageCircle className="w-12 h-12 text-primary mx-auto mb-4" />
                  <CardTitle className="text-xl">Mentoría Personalizada</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center">
                    Sesión mensual 1:1 con <a href="https://www.linkedin.com/in/nicolas-espindola/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors underline">NicoProducto</a> para diseñar tu guía de carrera y acompañarte en tus próximos pasos.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="text-center">
                  <TrendingUp className="w-12 h-12 text-primary mx-auto mb-4" />
                  <CardTitle className="text-xl">Dashboard de Progreso</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center">
                    Visualiza tu evolución en tiempo real con métricas detalladas y gráficos de progreso por área de competencia.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="text-center">
                  <BookOpen className="w-12 h-12 text-primary mx-auto mb-4" />
                  <CardTitle className="text-xl">Recursos Curados</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center">
                    Acceso a una biblioteca de recursos específicos basados en tus áreas de mejora identificadas.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="text-center">
                  <TrendingUp className="w-12 h-12 text-primary mx-auto mb-4" />
                  <CardTitle className="text-xl">Progreso</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center">
                    Hoja de ruta y canvas personalizado con objetivos específicos y pasos concretos para avanzar en tu carrera.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Social Proof Section */}
        <section className="py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                      <Star className="w-8 h-8 text-primary" />
                    </div>
                  </div>
                  <div className="text-center md:text-left">
                    <p className="text-lg italic mb-4">&quot;ProductPrepa me ayudó a identificar exactamente en qué trabajar y donde hacer foco. La mentoría mensual con Nico me dió claridad además de ordenar mis próximos pasos.&quot;</p>
                    <p className="font-semibold">— Mariel, Product Manager</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">¿Listo para acelerar tu carrera?</h2>
            <p className="text-xl text-muted-foreground mb-6">
              Únete a ProductPrepa Premium y obtené las herramientas que necesitas para subir de nivel como Product Manager.
            </p>
            
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              💳 Cancelá cuando quieras. Sin compromisos.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {user ? <Button asChild size="lg" className="w-full sm:w-auto min-h-[48px]">
                  <Link to="/progreso">Suscribirme a Premium</Link>
                </Button> : <Button asChild size="lg" className="w-full sm:w-auto min-h-[48px]">
                  <Link to="/auth">Comenzar ahora</Link>
                </Button>}
            </div>
          </div>
        </section>

        <Separator className="max-w-6xl mx-auto" />

        {/* Free Resource Section */}
        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">¿No estás seguro todavía?</h2>
            <p className="text-lg mb-8 text-muted-foreground max-w-2xl mx-auto">
              Empezá gratis con la autoevaluación y descubrí en qué punto estás ahora.
            </p>
            <Card className="max-w-md mx-auto bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">A darle Métricas!</h3>
                  <p className="text-muted-foreground mb-4">
                    Recurso complementario para ayudarte a tener una mirada más precisa sobre Métricas de Producto
                  </p>
                  <Button asChild className="w-full">
                    <Link to="/auth">Empezar gratis</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </>;
}