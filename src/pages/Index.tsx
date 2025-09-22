import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Seo } from "@/components/Seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, ArrowRight, Zap } from "lucide-react";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Testimonials } from "@/components/sections/Testimonials";
import { WhyProductPrepa } from "@/components/sections/WhyProductPrepa";
import { FAQ } from "@/components/sections/FAQ";
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { isAuthenticated } = useAuth();
  
  return (
    <>
      <Seo
        title="ProductPrepa — Autoevaluación PM"
        description="Evalúa tu seniority en Product Management y descubre tus brechas de habilidades."
        canonical="/"
      />
      <main className="min-h-screen bg-background">
        {/* Enhanced Hero Section */}
        <section className="container text-center py-16 sm:py-24 px-4 sm:px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 -z-10" />
          
          <div className="flex items-center justify-center mb-6">
            <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
              <Zap className="h-4 w-4 mr-2" />
              Evaluación específica para Product Managers
            </Badge>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
            Impulsa tu carrera en <span className="text-primary">Product Management</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
            Autoevalúa tu nivel de seniority en 11 dominios clave, identifica brechas específicas y recibe un roadmap personalizado para acelerar tu crecimiento profesional.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button asChild size="lg" className="w-full sm:w-auto text-base px-8 py-6 font-semibold">
              <Link to={isAuthenticated ? "/autoevaluacion" : "/auth"}>
                {isAuthenticated ? "Continuar evaluación" : "Comenzar evaluación gratis"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto text-base px-8 py-6">
              <Link to="/progreso">Ver funciones premium</Link>
            </Button>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>100% gratis para empezar</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>Sin tarjeta de crédito</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>Resultados inmediatos</span>
            </div>
          </div>
        </section>

        <HowItWorks />
        
        {/* <Testimonials /> */}
        
        <WhyProductPrepa />

        {/* Free vs Premium Section */}
        <section className="container py-12 sm:py-16 px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Todo lo que necesitas para crecer</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comienza gratis con la autoevaluación y brechas. Desbloquea recomendaciones y seguimiento con Premium.
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 md:gap-8 max-w-4xl mx-auto">
            {/* Plan Gratuito */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Gratis</CardTitle>
                  <Badge variant="secondary">Siempre gratis</Badge>
                </div>
                <p className="text-muted-foreground">Perfecto para comenzar tu autoevaluación</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Autoevaluación completa de habilidades PM</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Identificación y priorización de brechas</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Estimación de nivel de seniority</span>
                  </div>
                </div>
                <Button asChild className="w-full">
                  <Link to={isAuthenticated ? "/autoevaluacion" : "/auth"}>
                    {isAuthenticated ? "Ir a evaluación" : "Comenzar gratis"}
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Plan Premium */}
            <Card className="border-primary relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">
                  <Star className="h-3 w-3 mr-1" />
                  Más popular
                </Badge>
              </div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Premium</CardTitle>
                  <div className="text-right">
                    <div className="text-2xl font-bold">$10</div>
                    <div className="text-sm text-muted-foreground">/mes</div>
                  </div>
                </div>
                <p className="text-muted-foreground">Todo lo gratuito, más funciones avanzadas</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Recomendaciones personalizadas</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Panel de seguimiento de progreso</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Recursos curados por expertos</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Roadmap de carrera personalizado</span>
                  </div>
                </div>
                <Button asChild className="w-full">
                  <Link to="/recomendaciones">Suscribirse a Premium</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
        
        <FAQ />
      </main>
    </>
  );
};

export default Index;
