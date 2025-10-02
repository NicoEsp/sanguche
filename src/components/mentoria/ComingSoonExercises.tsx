import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Mail } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function ComingSoonExercises() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleExerciseRequest = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes estar autenticado para solicitar ejercicios",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        throw new Error('Profile not found');
      }

      const { error } = await supabase
        .from('exercise_requests')
        .insert({
          user_id: profile.id,
          exercise_id: 'casos-reales'
        });

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: "¡Solicitud enviada!",
        description: "Te enviaremos el ejercicio a tu email",
      });
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error submitting exercise request:', error);
      toast({
        title: "Error",
        description: "No pudimos procesar tu solicitud. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <CardHeader className="relative">
        <div className="flex items-center gap-2">
          <CardTitle className="text-xl">Ejercicios con casos reales</CardTitle>
          <Badge variant="outline" className="bg-background">
            Próximamente
          </Badge>
        </div>
        <CardDescription>
          Practica con desafíos reales de empresas como Spotify, Airbnb y Netflix. 
          Desarrolla habilidades clave aplicando frameworks de Product Management.
        </CardDescription>
      </CardHeader>
      <CardContent className="relative space-y-6">
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Mail className="h-5 w-5" />
            <span className="font-medium">Quiero recibir este ejercicio por mail</span>
          </div>
          
           {!submitted ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Te enviaremos ejercicios prácticos basados en casos reales para que puedas practicar y mejorar tus habilidades.
              </p>
              <Button 
                onClick={handleExerciseRequest} 
                size="sm"
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? "Enviando..." : "Solicitar ejercicios"}
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-2">
              <CheckCircle2 className="h-6 w-6 text-primary mx-auto" />
              <p className="text-sm font-medium text-primary">
                ¡Perfecto! Te enviaremos los ejercicios a tu email
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}