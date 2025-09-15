import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Seo } from "@/components/Seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star } from "lucide-react";

const Index = () => {
  return (
    <>
      <Seo
        title="ProductPrepa — Autoevaluación PM"
        description="Evalúa tu seniority en Product Management y descubre tus brechas de habilidades."
        canonical="/"
      />
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="container text-center py-12 sm:py-16 px-4 sm:px-6">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">Impulsa tu carrera en Product Management</h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Autoevalúa tu nivel de seniority, identifica brechas de habilidades y recibe recomendaciones personalizadas para crecer más rápido.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link to="/autoevaluacion">Comenzar gratis</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link to="/progreso">Ver funciones premium</Link>
            </Button>
          </div>
        </section>

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
                  <Link to="/autoevaluacion">Comenzar gratis</Link>
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
      </main>
    </>
  );
};

export default Index;
