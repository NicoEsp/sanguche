import { Link } from "react-router-dom";
import { Lock, BookOpen, Video, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface CoursePaywallProps {
  courseTitle?: string;
}

export function CoursePaywall({ courseTitle }: CoursePaywallProps) {
  const benefits = [
    {
      icon: Video,
      title: "Videos cortos y prácticos",
      description: "Lecciones de menos de 10 minutos, directo al punto",
    },
    {
      icon: BookOpen,
      title: "Ejercicios prácticos",
      description: "Aplica lo aprendido con ejercicios del mundo real",
    },
    {
      icon: Award,
      title: "Certificado de finalización",
      description: "Demuestra tu conocimiento con un certificado",
    },
  ];

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <Card className="max-w-lg w-full border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          {/* Lock icon */}
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {courseTitle ? `Accede a "${courseTitle}"` : "Accede a los cursos"}
          </h2>
          <p className="text-muted-foreground mb-8">
            Desbloquea todos los cursos con un plan que incluya acceso a cursos.
          </p>

          {/* Benefits */}
          <div className="space-y-4 mb-8 text-left">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                  <benefit.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground text-sm">
                    {benefit.title}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <Link to="/planes">
            <Button size="lg" className="w-full">
              Ver planes disponibles
            </Button>
          </Link>

          <p className="text-xs text-muted-foreground mt-4">
            Los cursos están incluidos en los planes RePremium y Curso de Estrategia
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
