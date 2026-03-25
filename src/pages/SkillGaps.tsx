import { Seo } from "@/components/Seo";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import { useSubscription } from "@/hooks/useAuth";
import { ResourcesList } from "@/components/resources/ResourcesList";
import { useAssessmentData } from "@/hooks/useAssessmentData";
import { Skeleton } from "@/components/ui/skeleton";
import { useMixpanelTracking } from "@/hooks/useMixpanelTracking";
import { useCallback, useEffect, useMemo } from "react";

import { PremiumCTACard } from "@/components/PremiumCTACard";
import { ContextualCTA } from "@/components/ContextualCTA";

export default function SkillGaps() {
  const {
    hasActivePremium
  } = useSubscription();
  const {
    result,
    loading,
    hasAssessment,
    updatedAt,
    optionalValues
  } = useAssessmentData();
  const { trackEvent } = useMixpanelTracking();
  
  // Memoized calculations to avoid re-computation
  const gaps = useMemo(() => result?.gaps ?? [], [result]);
  const strengths = useMemo(() => result?.strengths ?? [], [result]);
  const neutralAreas = useMemo(() => result?.neutralAreas ?? [], [result]);
  const optionalImprovements = useMemo(() => result?.optionalImprovements ?? [], [result]);
  const answeredOptionalDomains = useMemo(() => result?.optionalDomains ?? {}, [result]);
  
  const priorityAreasCount = useMemo(
    () => gaps.filter(g => g.prioridad === "Alta").length,
    [gaps]
  );

  const handleCtaClick = useCallback((ctaLocation: string, skillName?: string) => {
    trackEvent('landing_page_cta_click', {
      cta_location: ctaLocation,
      ...(skillName && { skill_name: skillName }),
    });
  }, [trackEvent]);
  
  const formattedUpdatedAt = useMemo(
    () => updatedAt ? new Intl.DateTimeFormat("es-AR", {
      dateStyle: "long",
      timeStyle: "short"
    }).format(new Date(updatedAt)) : null,
    [updatedAt]
  );

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
      <Seo />
      
      <section className="container py-8 sm:py-12 px-4 sm:px-6 animate-fade-in">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">Resultados de tu evaluación</h1>
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
                  {gaps.map(g => <div key={g.key} className="flex flex-col rounded-md border p-4 bg-card gap-2">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                        <div>
                          <div className="font-medium">{g.label}</div>
                          <div className="text-sm text-muted-foreground">Puntaje: {g.value} / 5</div>
                        </div>
                        <Badge variant={g.prioridad === "Alta" ? "destructive" : "secondary"} className="self-start sm:self-auto">
                          Prioridad {g.prioridad}
                        </Badge>
                      </div>
                      {g.prioridad === "Alta" && !hasActivePremium && (
                        <ContextualCTA
                          skillName={g.label}
                          ctaPath="/premium"
                          onCtaClick={() => handleCtaClick('contextual_skill_card', g.label)}
                        />
                      )}
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

            {/* Premium CTA Card - solo para usuarios no premium con gaps */}
            {gaps.length > 0 && !hasActivePremium && (
              <PremiumCTACard
                userLevel={result.nivel}
                ctaPath="/premium"
                onCtaClick={() => handleCtaClick('premium_cta_card')}
              />
            )}

            {/* Dominios opcionales explorados */}
            {Object.keys(answeredOptionalDomains).length > 0 && (
              <div className="mt-4 p-4 rounded-lg bg-purple-50 border border-purple-200">
                <p className="text-sm text-purple-800">
                  🟣 Exploraste además estos dominios opcionales:{" "}
                  <strong>
                    {Object.keys(answeredOptionalDomains)
                      .map(k => k === 'growth' ? 'Growth' : 'IA aplicada a Producto')
                      .join(' y ')}
                  </strong>
                </p>
              </div>
            )}

            {/* Áreas de mejora generadas por preguntas opcionales */}
            {optionalImprovements.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">🟣 Áreas de mejora (dominios opcionales)</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Estas áreas se generaron según tus respuestas en los dominios opcionales.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {optionalImprovements.map((improvement) => (
                    <div 
                      key={improvement.key} 
                      className="rounded-lg border border-purple-200 bg-purple-50/50 p-4"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="border-purple-300 text-purple-700">
                          {improvement.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Respondiste: {improvement.value}/5
                        </span>
                      </div>
                      <h4 className="font-medium text-purple-900 mb-1">
                        {improvement.title}
                      </h4>
                      <p className="text-sm text-purple-700">
                        {improvement.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>}


        <hr className="mt-10 border-border" />

        <ResourcesList assessmentResult={result || null} />
      </section>
    </>;
}