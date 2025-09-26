import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Wrench, BookOpen, Users, ExternalLink, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { NeutralArea } from "@/utils/scoring";

interface LockedResourcesProps {
  neutralAreas: NeutralArea[];
}

export function LockedResources({ neutralAreas }: LockedResourcesProps) {
  // Mostrar solo la primera área como preview
  const previewArea = neutralAreas[0];

  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Recursos Dedicados</CardTitle>
          <Badge variant="outline" className="ml-auto">
            <Lock className="h-3 w-3 mr-1" />
            Bloqueado
          </Badge>
        </div>
        <CardDescription>
          Herramientas, contenido y comunidades curadas para tu perfil
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview del área principal */}
        {previewArea && (
          <div className="border rounded-lg p-4 bg-muted/50 relative">
            <h4 className="font-medium text-foreground capitalize mb-4">
              Recursos para {previewArea.label}
            </h4>
            
            {/* Preview de categorías de recursos */}
            <div className="grid gap-3">
              <div className="border rounded-lg p-3 bg-background/50 relative">
                <div className="flex items-center gap-2 mb-2">
                  <Wrench className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Herramientas Recomendadas</span>
                </div>
                
                {/* Overlay de contenido bloqueado */}
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Lock className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">3+ herramientas</p>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-3 bg-background/50 relative">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Contenido Curado</span>
                </div>
                
                {/* Overlay de contenido bloqueado */}
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Lock className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">5+ recursos</p>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-3 bg-background/50 relative">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Comunidades</span>
                </div>
                
                {/* Overlay de contenido bloqueado */}
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Lock className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">2+ comunidades</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mensaje informativo */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Wrench className="h-5 w-5" />
            <span className="font-medium">¿Qué recursos obtendrás?</span>
          </div>
          
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-primary" />
              <span>Herramientas específicas para cada área de mejora</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <span>Contenido curado (artículos, libros, cursos)</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span>Comunidades y redes de Product Managers</span>
            </div>
            <div className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-primary" />
              <span>Enlaces directos a recursos verificados</span>
            </div>
          </div>

          <div className="pt-2">
            <Button asChild className="w-full">
              <Link to="#hero">
                <ArrowRight className="h-4 w-4 mr-2" />
                Agendar Mentoría para Acceder a Recursos
              </Link>
            </Button>
          </div>
        </div>

        {/* Contador de áreas adicionales */}
        {neutralAreas.length > 1 && (
          <div className="text-center text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
            <Lock className="h-4 w-4 inline mr-1" />
            Recursos para {neutralAreas.length - 1} áreas adicionales disponibles
          </div>
        )}
      </CardContent>
    </Card>
  );
}