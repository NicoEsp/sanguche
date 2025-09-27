import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PolarCheckout } from "@/components/PolarCheckout";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useAuth";
export function ComingSoonProgress() {
  const {
    hasActivePremium
  } = useSubscription();
  const {
    toast
  } = useToast();
  return <div className="container py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold mb-4">
            📈 Progreso — muy pronto disponible
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Esta funcionalidad forma parte del plan Premium de ProductPrepa.
              Si ya lo activaste, no tenés que pagar nada extra: vas a poder acceder automáticamente cuando esté disponible.
            </p>
            
            <div className="text-left space-y-2">
              <p className="font-medium">Con Progreso, vas a poder construir y seguir tu propio Career Path, combinando:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Lo que surja en tus sesiones de Mentoría personalizada</li>
                <li>Las disciplinas, metodologías y habilidades que quieras desarrollar</li>
                <li>Objetivos concretos para medir tu avance</li>
              </ul>
            </div>

            <p className="text-muted-foreground">
              Todo en un solo lugar, para que veas con claridad cómo vas creciendo en tu carrera como PM!
            </p>

            
          </div>

          {!hasActivePremium && (
            <div className="pt-4">
              <PolarCheckout />
            </div>
          )}
        </CardContent>
      </Card>
    </div>;
}