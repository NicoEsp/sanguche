import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Sparkles, Users, CheckCircle2, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ComingSoonExercises() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const { toast } = useToast();

  const handleEarlyAccess = () => {
    if (!email) {
      toast({
        title: "Email requerido",
        description: "Por favor ingresa tu email para acceso anticipado",
        variant: "destructive"
      });
      return;
    }

    // Here you would normally save the email to your database
    console.log("Early access signup:", email);
    setSubscribed(true);
    toast({
      title: "¡Registrado!",
      description: "Te notificaremos cuando los ejercicios estén disponibles",
    });
  };

  return (
    <Card className="bg-gradient-to-br from-accent/20 to-secondary/20 border-accent/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent-foreground" />
          Ejercicios con casos reales
          <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded-full">
            Próximamente
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <p className="text-foreground">
            Pronto tendrás acceso a ejercicios prácticos basados en casos reales de empresas como:
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-background/60 rounded-lg">
              <div className="font-medium text-sm">Spotify</div>
              <div className="text-xs text-muted-foreground">Discovery</div>
            </div>
            <div className="p-3 bg-background/60 rounded-lg">
              <div className="font-medium text-sm">Airbnb</div>
              <div className="text-xs text-muted-foreground">Roadmap</div>
            </div>
            <div className="p-3 bg-background/60 rounded-lg">
              <div className="font-medium text-sm">Slack</div>
              <div className="text-xs text-muted-foreground">Stakeholders</div>
            </div>
            <div className="p-3 bg-background/60 rounded-lg">
              <div className="font-medium text-sm">Netflix</div>
              <div className="text-xs text-muted-foreground">Analítica</div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-foreground flex items-center gap-2">
            <Users className="h-4 w-4" />
            ¿Qué incluirán los ejercicios?
          </h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span>Casos reales con datos y contexto de empresas conocidas</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span>Ejercicios interactivos paso a paso</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span>Soluciones comentadas y alternativas</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span>Validación automática de tus respuestas</span>
            </li>
          </ul>
        </div>

        {!subscribed ? (
          <div className="space-y-3">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Acceso anticipado exclusivo para usuarios premium
            </h4>
            <div className="flex gap-2">
              <Input
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleEarlyAccess}>
                Notificarme
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center p-4 bg-success/10 border border-success/20 rounded-lg">
            <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2" />
            <p className="text-success font-medium">¡Te notificaremos cuando esté listo!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Serás de los primeros en acceder a los ejercicios prácticos
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}