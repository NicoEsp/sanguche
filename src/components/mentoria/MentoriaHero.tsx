import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Target } from "lucide-react";

export function MentoriaHero() {
  const handleScheduleClick = () => {
    // Replace with your actual Notion Calendar customized URL
    window.open('https://calendar.notion.so/nicolassespindola', '_blank');
  };

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
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 text-lg"
          >
            <Calendar className="mr-2 h-5 w-5" />
            Agendar Sesión
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}