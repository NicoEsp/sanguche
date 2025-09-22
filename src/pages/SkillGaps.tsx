import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import { getAssessment } from "@/utils/storage";
import { isFeatureAvailable, FEATURES } from "@/utils/features";
import { useSubscription } from "@/hooks/useAuth";

export default function SkillGaps() {
  const { hasActivePremium } = useSubscription();
  const record = getAssessment();
  const gaps = record?.result.gaps ?? [];
  const strengths = record?.result.strengths ?? [];
  const canAccessRecommendations = isFeatureAvailable(FEATURES.RECOMMENDATIONS, hasActivePremium);

  return (
    <>
      <Seo
        title="Resultados de tu evaluación — ProductPrepa"
        description="Revisa tu desempeño completo: fortalezas y áreas de mejora identificadas."
        canonical="/brechas"
      />
      <section className="container py-6 sm:py-10 px-4 sm:px-6">
        <h1 className="text-2xl sm:text-3xl font-semibold mb-3">Resultados de tu evaluación</h1>
        {!record ? (
          <Alert className="mb-6">
            <AlertTitle>No hay resultados aún</AlertTitle>
            <AlertDescription>
              Realiza primero la <Link to="/autoevaluacion" className="underline">autoevaluación</Link> para ver tus brechas priorizadas.
            </AlertDescription>
          </Alert>
        ) : (
          <p className="text-muted-foreground mb-6">
            Nivel estimado: <strong>{record.result.nivel}</strong> (promedio {record.result.promedioGlobal}).
          </p>
        )}

        {record && (
          <div className="space-y-8">
            {/* Fortalezas */}
            {strengths.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">🎯 Tus fortalezas</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {strengths.map((s) => (
                    <div key={s.key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-md border p-4 bg-card gap-2 sm:gap-0">
                      <div>
                        <div className="font-medium">{s.label}</div>
                        <div className="text-sm text-muted-foreground">Puntaje: {s.value} / 5</div>
                      </div>
                      <Badge 
                        variant="default"
                        className="self-start sm:self-auto"
                      >
                        Fortaleza
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Áreas de mejora */}
            {gaps.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">📈 Áreas de mejora</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {gaps.map((g) => (
                    <div key={g.key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-md border p-4 bg-card gap-2 sm:gap-0">
                      <div>
                        <div className="font-medium">{g.label}</div>
                        <div className="text-sm text-muted-foreground">Puntaje: {g.value} / 5</div>
                      </div>
                      <Badge 
                        variant={g.prioridad === "Alta" ? "destructive" : "secondary"}
                        className="self-start sm:self-auto"
                      >
                        {g.prioridad}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}


        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          {canAccessRecommendations ? (
            <Button asChild disabled={!record} className="w-full sm:w-auto">
              <Link to="/recomendaciones">Ver recomendaciones</Link>
            </Button>
          ) : (
            <Button asChild disabled={!record} variant="outline" className="w-full sm:w-auto">
              <Link to="/recomendaciones">Ver recomendaciones (Premium)</Link>
            </Button>
          )}
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link to="/autoevaluacion">Atrás</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
