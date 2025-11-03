import { CheckCircle, Target, TrendingUp, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    icon: CheckCircle,
    title: "Autoevaluación completa",
    description: "Evalúa tus habilidades en 11 dominios clave de Product Management",
    color: "text-primary"
  },
  {
    icon: Target,
    title: "Identifica áreas de mejora",
    description: "Descubre las áreas específicas donde puedes mejorar tu perfil profesional",
    color: "text-secondary-foreground"
  },
  {
    icon: TrendingUp,
    title: "Recursos personalizados",
    description: "Accede a recursos curados y un roadmap específico para tu crecimiento",
    color: "text-primary"
  },
  {
    icon: Trophy,
    title: "Progreso",
    description: "Mide tu evolución y mantén el foco en tus objetivos de carrera",
    color: "text-secondary-foreground"
  }
];

export function HowItWorks() {
  return (
    <section className="container py-12 sm:py-16 px-4 sm:px-6 bg-secondary/20">
      <div className="text-center mb-8 sm:mb-12">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4">¿Cómo funciona ProductPrepa?</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Un proceso simple y efectivo para impulsar tu carrera en Product Management
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
        {steps.map((step, index) => (
          <Card key={index} className="relative border-2 hover:border-primary/20 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="mb-4 flex justify-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <step.icon className={`h-6 w-6 ${step.color}`} />
                </div>
              </div>
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
              </div>
              <h3 className="font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}