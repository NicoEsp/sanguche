import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CourseCTAProps {
  variant: "mentoria" | "career-path";
}

export function CourseCTA({ variant }: CourseCTAProps) {
  if (variant === "mentoria") {
    return (
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/20">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-foreground mb-1">
                ¿Quieres ir más allá?
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                Obtén feedback personalizado y guía 1:1 con nuestro plan de mentoría.
              </p>
              <Link to="/planes">
                <Button>
                  Ver plan Mentoría
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-yellow-500/10 via-yellow-500/5 to-transparent border-yellow-500/20 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-yellow-500/20">
            <Sparkles className="h-6 w-6 text-yellow-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-foreground mb-1">
              Define tu camino profesional
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Descubre tu nivel actual y obtén un plan personalizado con nuestro Career Path.
            </p>
            <Link to="/assessment">
              <Button variant="outline" className="border-yellow-500/30 hover:bg-yellow-500/10">
                Comenzar assessment
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
