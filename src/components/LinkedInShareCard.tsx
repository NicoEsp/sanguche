import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LinkedinIcon, Share2Icon } from "lucide-react";
import { saveLinkedInShare } from "@/utils/storage";
import { toast } from "@/hooks/use-toast";

const LINKEDIN_MESSAGE = `🚀 Estuve probando ProductPrepa de @Nicolás Espíndola y me ayudó a identificar mis brechas como Product Manager.

Es una herramienta increíble que analiza tus habilidades y te da recomendaciones personalizadas para mejorar en el rol.

Si estás en producto o querés crecer en el área, te la recomiendo 💯

#ProductManagement #Desarrollo #ProductPrepa`;

export function LinkedInShareCard() {
  const handleShare = () => {
    // Guardar que el usuario compartió
    saveLinkedInShare();
    
    // Crear URL de LinkedIn con mensaje pre-cargado
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://productprepa.com')}&summary=${encodeURIComponent(LINKEDIN_MESSAGE)}`;
    
    // Abrir LinkedIn en nueva ventana
    window.open(linkedinUrl, '_blank', 'width=550,height=550');
    
    // Mostrar mensaje de éxito
    toast({
      title: "¡Acceso desbloqueado!",
      description: "Ya podés acceder a las recomendaciones por las próximas 48 horas.",
    });
    
    // Recargar la página para actualizar el estado
    setTimeout(() => window.location.reload(), 1000);
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
        >
          <LinkedinIcon className="mr-2 h-4 w-4" />
          Compartir en LinkedIn y Desbloquear
        </Button>
        
        <p className="text-xs text-muted-foreground text-center">
          Al hacer click, se abrirá LinkedIn con el mensaje pre-cargado. 
          El acceso será válido por 48 horas desde que compartas.
        </p>
      </CardContent>
    </Card>
  );
}