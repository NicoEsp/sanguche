import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Target, CheckCircle, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MentoriaHeroProps {
  mentoriaCompleted: boolean;
  lastMentoriaDate?: string | null;
}

function isNewMonth(lastDate?: string | null): boolean {
  if (!lastDate) return true;
  
  const last = new Date(lastDate);
  const now = new Date();
  
  return (
    now.getMonth() !== last.getMonth() ||
    now.getFullYear() !== last.getFullYear()
  );
}

export function MentoriaHero({ mentoriaCompleted, lastMentoriaDate }: MentoriaHeroProps) {
  const navigate = useNavigate();
  
  const handleScheduleClick = () => {
    window.open('https://calendar.notion.so/meet/nicoproducto/zf4fl4q8q', '_blank');
  };

  const handleProgressClick = () => {
    navigate('/progreso');
  };

  // Si completó mentoría pero es un nuevo mes, mostrar card de sesión mensual
  if (mentoriaCompleted && isNewMonth(lastMentoriaDate)) {
    return (
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">
                ¡Tu sesión mensual está disponible!
              </h2>
              <p className="text-muted-foreground text-lg">
                Es momento de nuestra reunión mensual. Agenda tu próxima sesión de 45 min.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>45 minutos</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                <span>100% personalizado</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Online via Google Meet</span>
              </div>
            </div>

            <Button 
              size="lg" 
              onClick={handleScheduleClick}
              className="px-8 text-lg"
            >
              <Calendar className="mr-2 h-5 w-5" />
              Agendar Sesión Mensual
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Versión Post-Mentoría (mismo mes)
  if (mentoriaCompleted) {
    return (
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">
                ¡Excelente trabajo en tu mentoría!
              </h2>
              <p className="text-muted-foreground text-lg">
                Ahora es momento de poner en práctica lo conversado. Completa tus ejercicios y enfócate en tu Career Path.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                <span>Objetivos definidos</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Plan en marcha</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Próxima sesión: inicio del próximo mes</span>
              </div>
            </div>

            <Button 
              size="lg" 
              onClick={handleProgressClick}
              className="px-8 text-lg"
            >
              <TrendingUp className="mr-2 h-5 w-5" />
              Ver mi Career Path
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Versión Agendar Sesión (original)

  return (
    <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
      <CardContent className="p-8">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">
              Agenda tu mentoría 1:1 con NicoProducto
            </h2>
            <p className="text-muted-foreground text-lg">
              Sesión personalizada de 45 min enfocada en tus áreas de mejora específicas
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>45 minutos</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span>100% personalizado</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Online via Google Meet</span>
            </div>
          </div>

          <Button 
            size="lg" 
            onClick={handleScheduleClick}
            className="px-8 text-lg"
          >
            <Calendar className="mr-2 h-5 w-5" />
            Agendar Sesión
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}