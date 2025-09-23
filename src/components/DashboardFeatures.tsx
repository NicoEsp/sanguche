import { CheckCircle, Target, TrendingUp, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

const features = [
  {
    icon: CheckCircle,
    title: "Autoevaluación Completa",
    description: "Evalúa tus habilidades en 11 dominios clave de Product Management",
    color: "text-primary",
    route: "/autoevaluacion"
  },
  {
    icon: Target,
    title: "Identifica Áreas de Mejora",
    description: "Descubre las áreas específicas donde puedes mejorar tu perfil profesional",
    color: "text-secondary-foreground",
    route: "/brechas"
  },
  {
    icon: TrendingUp,
    title: "Mentoría Personalizada",
    description: "Recibe recursos curados y un roadmap específico para tu crecimiento",
    color: "text-primary",
    route: "/recomendaciones"
  },
  {
    icon: Trophy,
    title: "Seguimiento de Progreso",
    description: "Mide tu evolución y mantén el foco en tus objetivos de carrera",
    color: "text-secondary-foreground",
    route: "/progreso"
  }
];

export function DashboardFeatures() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
      {features.map((feature, index) => (
        <Link key={index} to={feature.route} className="group">
          <Card className="relative border-2 hover:border-primary/50 transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="mb-4 flex justify-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
              </div>
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
              </div>
              <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}