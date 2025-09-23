import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import { getAssessment } from "@/utils/storage";
import { isFeatureAvailable, FEATURES } from "@/utils/features";
import { useSubscription } from "@/hooks/useAuth";
export default function SkillGaps() {
  const {
    hasActivePremium
  } = useSubscription();
  const record = getAssessment();
  const gaps = record?.result.gaps ?? [];
  const strengths = record?.result.strengths ?? [];
  const neutralAreas = record?.result.neutralAreas ?? [];
  const canAccessRecommendations = isFeatureAvailable(FEATURES.RECOMMENDATIONS, hasActivePremium);
  return <>
      <Seo title="Resultados de tu evaluación — ProductPrepa" description="Revisa tu desempeño completo: fortalezas y áreas de mejora identificadas." canonical="/brechas" />
      <section className="container py-6 sm:py-10 px-4 sm:px-6">
        <h1 className="text-2xl sm:text-3xl font-semibold mb-3">Resultados de tu evaluación</h1>
        {!record ? <Alert className="mb-6">
            <AlertTitle>No hay resultados aún</AlertTitle>
            <AlertDescription>
              Realiza primero la <Link to="/autoevaluacion" className="underline">autoevaluación</Link> para ver tus brechas priorizadas.
            </AlertDescription>
          </Alert> : <div className="mb-6 space-y-3">
            <p className="text-muted-foreground">
              Nivel estimado: <strong>{record.result.nivel}</strong> (promedio {record.result.promedioGlobal}).
            </p>
            <div className="p-4 rounded-lg bg-muted/50 border">
              <h3 className="font-medium mb-2">🎯 Tu perfil profesional</h3>
              <p className="text-sm text-muted-foreground">{record.result.profileEstimate}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Especialización: <strong>{record.result.specialization}</strong>
              </p>
            </div>
          </div>}

        {record && <div className="space-y-8">
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
          {canAccessRecommendations ? <Button asChild disabled={!record} className="w-full sm:w-auto">
              <Link to="/recomendaciones">Ver mentoría personalizada</Link>
            </Button> : <Button asChild disabled={!record} variant="outline" className="w-full sm:w-auto">
              <Link to="/recomendaciones">Agendar mentoría personalizada (Premium)</Link>
            </Button>}
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link to="/autoevaluacion">Atrás</Link>
          </Button>
        </div>
      </section>
    </>;
}