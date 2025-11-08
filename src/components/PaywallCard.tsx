import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star } from "lucide-react";
import { LemonSqueezyCheckout } from "@/components/LemonSqueezyCheckout";
import { usePricing } from "@/hooks/usePricing";

interface PaywallCardProps {
  title?: string;
  feature?: string;
}

export function PaywallCard({ 
  title = "Preparate aún más para dar el salto",
  feature = "esta funcionalidad"
}: PaywallCardProps) {
  const { formatted, loading } = usePricing();
  
  const benefits = [
    <>Guía de carrera personalizada diseñada por <a href="https://www.linkedin.com/in/nicolas-espindola/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors underline">NicoProducto</a></>,
    "Seguimiento visual de tu progreso y objetivos",
    "Recursos curados según tus áreas de mejora",
    "Roadmap de carrera diseñado a tu medida",
    "Nuevos contenidos y ejercicios cada mes"
  ];

  return (
    <div className="container py-6 sm:py-10 px-4 sm:px-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Star className="h-5 w-5 text-primary" />
            <Badge variant="secondary">Premium</Badge>
            <Star className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-xl sm:text-2xl mb-2">{title}</CardTitle>
          <p className="text-muted-foreground text-sm sm:text-base">
            Para acceder a más funcionalidades de ProductPrepa necesitas una suscripción Premium
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <h3 className="font-semibold">Lo que obtienes con Premium:</h3>
            <ul className="space-y-2">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              {loading ? (
                <span className="inline-block animate-pulse">Cargando...</span>
              ) : (
                <>{formatted} <span className="text-base font-normal text-muted-foreground">/mes</span></>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Cancela cuando quieras
            </p>
          </div>
          
          <div className="pt-2">
            <LemonSqueezyCheckout />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}