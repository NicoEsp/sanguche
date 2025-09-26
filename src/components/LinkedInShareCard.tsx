import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LinkedinIcon, Share2Icon } from "lucide-react";
import { useLinkedInShare } from "@/hooks/useLinkedInShare";
import { useAssessmentData } from "@/hooks/useAssessmentData";
import { toast } from "@/hooks/use-toast";

const LINKEDIN_MESSAGE = `🚀 Estuve probando ProductPrepa de @Nicolás Espíndola y me ayudó a identificar mis brechas como Product Manager.

Es una herramienta increíble que analiza tus habilidades y te da recomendaciones personalizadas para mejorar en el rol.

Si estás en producto o querés crecer en el área, te la recomiendo 💯

#ProductManagement #Desarrollo #ProductPrepa`;

export function LinkedInShareCard() {
  const { createLinkedInShare, loading } = useLinkedInShare();
  const { result, hasAssessment } = useAssessmentData();

  const handleShare = async () => {
    if (!hasAssessment || !result) {
      toast({
        title: "Error",
        description: "Necesitas completar una evaluación primero.",
        variant: "destructive"
      });
      return;
    }
    
    // For now, we'll create the share without assessment ID since 
    // we need to link localStorage data to Supabase assessments
    try {
      // Generate LinkedIn share URL with pre-filled content
      const linkedInMessage = `🚀 Estuve probando ProductPrepa de @Nicolás Espíndola y me ayudó a identificar mis brechas como Product Manager.

Es una herramienta increíble que analiza tus habilidades y te da recomendaciones personalizadas para mejorar en el rol.

Si estás en producto o querés crecer en el área, te la recomiendo 💯

#ProductManagement #Desarrollo #ProductPrepa`;

      const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin)}&text=${encodeURIComponent(linkedInMessage)}`;
      
      // Open LinkedIn sharing dialog
      window.open(linkedInUrl, '_blank', 'width=600,height=600');

      toast({
        title: "¡Compartido exitosamente!",
        description: "Gracias por compartir ProductPrepa en LinkedIn.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo abrir LinkedIn. Inténtalo nuevamente.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Share2Icon className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Desbloquear Recomendaciones</CardTitle>
          <Badge variant="secondary" className="ml-auto">
            48h gratis
          </Badge>
        </div>
        <CardDescription>
          Compartí tu experiencia en LinkedIn y accedé a recomendaciones personalizadas por tiempo limitado
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm text-muted-foreground mb-2">Mensaje que se va a compartir:</p>
          <p className="text-sm italic leading-relaxed">"{LINKEDIN_MESSAGE}"</p>
        </div>
        
        <Button 
          onClick={handleShare}
          className="w-full"
          size="lg"
          disabled={loading || !hasAssessment}
        >
          <LinkedinIcon className="mr-2 h-4 w-4" />
          {loading ? "Compartiendo..." : "Compartir en LinkedIn"}
        </Button>
        
        <p className="text-xs text-muted-foreground text-center">
          Al hacer click, se abrirá LinkedIn con el mensaje pre-cargado. 
          El acceso será válido por 48 horas desde que compartas.
        </p>
      </CardContent>
    </Card>
  );
}