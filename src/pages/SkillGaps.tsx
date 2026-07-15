import { Seo } from "@/components/Seo";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import { ArrowRight, FileDown } from "lucide-react";
import { useSubscription } from "@/hooks/useAuth";
import { ResourcesList } from "@/components/resources/ResourcesList";
import { useAssessmentData } from "@/hooks/useAssessmentData";
import { Skeleton } from "@/components/ui/skeleton";
import { useMixpanelTracking } from "@/hooks/useMixpanelTracking";
import { useCallback, useEffect, useMemo } from "react";
import {
  AssessmentTypeKey,
  DomainScore,
  getAssessmentTypeDef,
  getDomainsForType,
  getNivelDisplay
} from "@/utils/scoring";

import { PremiumCTACard } from "@/components/PremiumCTACard";
import { ContextualCTA } from "@/components/ContextualCTA";
import { CompetencyRadar } from "@/components/assessment/CompetencyRadar";
import { PlanCTACard } from "@/components/assessment/PlanCTACard";
import { ReevaluationBanner } from "@/components/assessment/ReevaluationBanner";

// Títulos de sección según la evaluación: la misma estructura de resultados
// se lee distinto para quien recién arranca, un builder o un líder.
const SECTION_TITLES: Record<AssessmentTypeKey, { strengths: string; neutral: string; gaps: string }> = {
  experimentado: {
    strengths: "🎯 Tus fortalezas",
    neutral: "✅ Competencias sólidas",
    gaps: "📈 Áreas de mejora"
  },
  sin_experiencia: {
    strengths: "🎯 Donde ya tenés terreno ganado",
    neutral: "✅ Áreas con base",
    gaps: "📈 Terreno por explorar"
  },
  builder: {
    strengths: "🎯 Donde ya tenés método",
    neutral: "✅ Procesos encaminados",
    gaps: "📈 Donde te falta método"
  },
  lider: {
    strengths: "🎯 Fortalezas del equipo",
    neutral: "✅ Procesos encaminados",
    gaps: "📈 Dónde nivelar al equipo"
  }
};

// Mensaje cuando no hay brechas: la felicitación por seniority no aplica a
// quien recién arranca ni al diagnóstico de un equipo.
const NO_GAPS_COPY: Record<AssessmentTypeKey | "legacy", { title: string; text: string }> = {
  experimentado: {
    title: "🎉 ¡Excelente desempeño!",
    text: "No se detectaron áreas críticas de mejora. Tu perfil muestra competencias sólidas en todos los dominios evaluados."
  },
  sin_experiencia: {
    title: "🎉 Tenés una base muy pareja",
    text: "Tu mapa no muestra zonas en blanco: hay afinidad o base en todos los dominios. Estás en muy buen punto para dar el salto con un plan de estudio."
  },
  builder: {
    title: "🎉 Construís con método",
    text: "No se detectaron áreas donde estés a pura intuición. El siguiente paso es validar el producto en sí con una mirada externa."
  },
  lider: {
    title: "🎉 Tu equipo tiene procesos sólidos",
    text: "No se detectaron dominios críticos. El foco ahora está en sostener esos procesos y mantener al equipo actualizado."
  },
  legacy: {
    title: "🎉 ¡Excelente desempeño!",
    text: "No se detectaron áreas críticas de mejora. Tu perfil muestra competencias sólidas en todos los dominios evaluados."
  }
};

export default function SkillGaps() {
  const {
    hasActivePremium
  } = useSubscription();
  const {
    result,
    values,
    loading,
    hasAssessment,
    updatedAt,
    optionalValues,
    assessmentType,
    isLegacyAssessment
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

  const typeDef = assessmentType ? getAssessmentTypeDef(assessmentType) : null;
  const nivelDisplay = result ? getNivelDisplay(assessmentType, result.nivel) : null;
  const sectionTitles = SECTION_TITLES[assessmentType ?? "experimentado"];

  // Puntajes en el orden de los dominios de la evaluación, para que el radar
  // tenga siempre la misma forma entre visitas.
  const radarScores = useMemo<DomainScore[]>(() => {
    if (!assessmentType || !values) return [];
    return getDomainsForType(assessmentType)
      .map((d) => {
        const value = values[d.key];
        return typeof value === "number" ? { key: d.key, label: d.label, value } : null;
      })
      .filter((s): s is DomainScore => s !== null);
  }, [assessmentType, values]);

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
        estimated_level: result.nivel,
        assessment_type: assessmentType ?? 'legacy'
      });
    }
  }, [loading, result, gaps, strengths, neutralAreas, trackEvent, assessmentType]);
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
              Realizá primero la <Link to="/autoevaluacion" className="underline">evaluación</Link> para ver tus brechas priorizadas.
            </AlertDescription>
          </Alert> : null}

        {/* Evaluaciones del formato anterior: invitar a re-evaluarse para ver el radar */}
        {!loading && isLegacyAssessment && (
          <div className="mb-6">
            <ReevaluationBanner onCtaClick={() => handleCtaClick('legacy_reevaluation_banner')} />
          </div>
        )}

        {!loading && hasAssessment && result && <div className="mb-6 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-muted-foreground">
                {nivelDisplay ? nivelDisplay.title : "Nivel estimado"}:{" "}
                <strong>{nivelDisplay ? nivelDisplay.label : result.nivel}</strong> (promedio {result.promedioGlobal}).
              </p>
              {typeDef && (
                <Badge variant="outline" className={typeDef.accent.badge}>
                  {typeDef.resultTag}
                </Badge>
              )}
            </div>
            {result.suggestedRole && (
              <p className="text-muted-foreground text-sm">
                Rol de entrada sugerido: <strong>{result.suggestedRole.label}</strong>
              </p>
            )}
          </div>}

        {hasAssessment && result && !loading && <div className="space-y-8">
            {/* Mapa de competencias en radar (evaluaciones con perfil) */}
            {radarScores.length >= 3 && typeDef && (
              <div className="rounded-lg border bg-card p-5 sm:p-6 animate-fade-in">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <h2 className="text-xl font-semibold">Tu mapa de competencias</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {assessmentType === 'lider'
                    ? "Cada eje es un dominio evaluado de tu equipo, de 1 a 5."
                    : "Cada eje es un dominio evaluado, de 1 a 5."}
                </p>
                <CompetencyRadar scores={radarScores} accentHex={typeDef.accent.hex} />
              </div>
            )}

            {/* Fortalezas */}
            {strengths.length > 0 && <div>
                <h2 className="text-xl font-semibold mb-4">{sectionTitles.strengths}</h2>
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
                <h2 className="text-xl font-semibold mb-4">{sectionTitles.neutral}</h2>
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
                <h2 className="text-xl font-semibold mb-4">{sectionTitles.gaps}</h2>
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
                          ctaPath={typeDef ? typeDef.plan.route : "/premium"}
                          onCtaClick={() => handleCtaClick('contextual_skill_card', g.label)}
                        />
                      )}
                    </div>)}
                </div>
              </div>}

            {/* Mensaje cuando no hay brechas reales */}
            {gaps.length === 0 && (() => {
              const noGaps = NO_GAPS_COPY[assessmentType ?? "legacy"];
              return (
                <div className="text-center p-6 rounded-lg bg-green-50 border border-green-200">
                  <h3 className="font-medium text-green-800 mb-2">{noGaps.title}</h3>
                  <p className="text-sm text-green-700">{noGaps.text}</p>
                </div>
              );
            })()}

            {/* CTA de plan recomendado según la evaluación tomada. Se muestra
                también sin brechas: el copy del ctaInfo ya contempla los
                resultados altos. Las evaluaciones legacy conservan la tarjeta
                Premium anterior, solo con brechas como antes. */}
            {!hasActivePremium && (
              assessmentType && result.ctaInfo ? (
                <PlanCTACard
                  type={assessmentType}
                  text={result.ctaInfo.text}
                  onCtaClick={() => handleCtaClick('plan_cta_card')}
                />
              ) : gaps.length > 0 ? (
                <PremiumCTACard
                  ctaPath="/premium"
                  onCtaClick={() => handleCtaClick('premium_cta_card')}
                />
              ) : null
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

        <div className="mt-8 rounded-lg border border-primary/20 bg-primary/5 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <FileDown className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">¿Querés explorar más recursos?</p>
                <p className="text-sm text-muted-foreground">
                  Templates, guías y PDFs para Product Builders, gratuitos y premium.
                </p>
              </div>
            </div>
            <Link
              to="/descargables"
              onClick={() => trackEvent('skill_gaps_descargables_cta_click')}
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline sm:flex-shrink-0"
            >
              Ver todos los descargables
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>;
}
