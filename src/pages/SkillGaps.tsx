import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import { isFeatureAvailable, FEATURES } from "@/utils/features";
import { useSubscription } from "@/hooks/useAuth";
import { ResourcesList } from "@/components/resources/ResourcesList";
import { useAssessmentData } from "@/hooks/useAssessmentData";
import { Skeleton } from "@/components/ui/skeleton";
import { useMixpanelTracking } from "@/hooks/useMixpanelTracking";
import { useEffect } from "react";

export default function SkillGaps() {
  const {
    hasActivePremium
  } = useSubscription();
  const {
    result,
    loading,
    hasAssessment,
    updatedAt
  } = useAssessmentData();
  const { trackEvent } = useMixpanelTracking();
  const gaps = result?.gaps ?? [];
  const strengths = result?.strengths ?? [];
  const neutralAreas = result?.neutralAreas ?? [];
  const canAccessRecommendations = isFeatureAvailable(FEATURES.RECOMMENDATIONS, hasActivePremium);
  const formattedUpdatedAt = updatedAt ? new Intl.DateTimeFormat("es-AR", {
    dateStyle: "long",
    timeStyle: "short"
  }).format(new Date(updatedAt)) : null;

  // Track skill gaps view
  useEffect(() => {
    if (!loading && result) {
      trackEvent('skill_gaps_viewed', {
        gaps_count: gaps?.length || 0,
        strengths_count: strengths?.length || 0,
        neutral_count: neutralAreas?.length || 0,
        estimated_level: result.nivel
      });
    }
  }, [loading, result, gaps, strengths, neutralAreas, trackEvent]);
  return <>
      <Seo title="Resultados de tu evaluación — ProductPrepa" description="Revisa tu desempeño completo: fortalezas y áreas de mejora identificadas." canonical="/mejoras" />
      <section className="container py-6 sm:py-10 px-4 sm:px-6">
        <h1 className="text-2xl sm:text-3xl font-semibold mb-3">Resultados de tu evaluación</h1>
        {loading && <div className="space-y-4 mb-6">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>}
        {!loading && !hasAssessment ? <Alert className="mb-6">
            <AlertTitle>No hay resultados aún</AlertTitle>
            <AlertDescription>
              Realiza primero la <Link to="/autoevaluacion" className="underline">autoevaluación</Link> para ver tus brechas priorizadas.
            </AlertDescription>
          </Alert> : null}
        {!loading && hasAssessment && result && <div className="mb-6 space-y-3">
            <p className="text-muted-foreground">
              Nivel estimado: <strong>{result.nivel}</strong> (promedio {result.promedioGlobal}).
            </p>
            
          </div>}

        {hasAssessment && result && !loading && <div className="space-y-8">
            {/* Fortalezas */}
            {strengths.length > 0 && <div>
                <h2 className="text-xl font-semibold mb-4">🎯 Tus fortalezas</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {strengths.map(s => <div key={s.key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-md border p-4 bg-card gap-2 sm:gap-0">
                      <div>
                        <div className="font-medium">{s.label}</div>
                        <div className="text-sm text-muted-foreground">Puntaje: {s.value} / 5</div>
                      </div>
                      <Badge variant={s.nivel === "Destacada" ? "default" : "secondary"} className="self-start sm:self-auto">
                        {s.nivel}
                      </Badge>
                    </div>)}
                </div>
              </div>}

            {/* Competencias sólidas */}
            {neutralAreas.length > 0 && <div>
                <h2 className="text-xl font-semibold mb-4">✅ Competencias sólidas</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {neutralAreas.map(n => <div key={n.key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-md border p-4 bg-card gap-2 sm:gap-0">
                      <div>
                        <div className="font-medium">{n.label}</div>
                        <div className="text-sm text-muted-foreground">Puntaje: {n.value} / 5</div>
                      </div>
                      <Badge variant="outline" className="self-start sm:self-auto">
                        Competente
                      </Badge>
                    </div>)}
                </div>
              </div>}

            {/* Áreas de mejora */}
            {gaps.length > 0 && <div>
                <h2 className="text-xl font-semibold mb-4">📈 Áreas de mejora</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {gaps.map(g => <div key={g.key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-md border p-4 bg-card gap-2 sm:gap-0">
                      <div>
                        <div className="font-medium">{g.label}</div>
                        <div className="text-sm text-muted-foreground">Puntaje: {g.value} / 5</div>
                      </div>
                      <Badge variant={g.prioridad === "Alta" ? "destructive" : "secondary"} className="self-start sm:self-auto">
                        Prioridad {g.prioridad}
                      </Badge>
                    </div>)}
                </div>
              </div>}

            {/* Mensaje cuando no hay brechas reales */}
            {gaps.length === 0 && <div className="text-center p-6 rounded-lg bg-green-50 border border-green-200">
                <h3 className="font-medium text-green-800 mb-2">🎉 ¡Excelente desempeño!</h3>
                <p className="text-sm text-green-700">
                  No se detectaron áreas críticas de mejora. Tu perfil muestra competencias sólidas en todos los dominios evaluados.
                </p>
              </div>}
          </div>}


        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          {canAccessRecommendations ? <Button asChild disabled={!hasAssessment || !result} className="w-full sm:w-auto">
              <Link to="/mentoria">Ver mentoría personalizada</Link>
            </Button> : <Button asChild disabled={!hasAssessment || !result} className="w-full sm:w-auto">
              <Link to="/premium">Acceder a mentoría personalizada</Link>
            </Button>}
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link to="/autoevaluacion">Atrás</Link>
          </Button>
        </div>

        <ResourcesList assessmentResult={result || null} />
      </section>
    </>;
}