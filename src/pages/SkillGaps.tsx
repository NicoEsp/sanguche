import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import { getAssessment } from "@/utils/storage";

export default function SkillGaps() {
  const record = getAssessment();
  const gaps = record?.result.gaps ?? [];

  return (
    <>
      <Seo
        title="Brechas de habilidades — ProductPrepa"
        description="Selecciona las habilidades que deseas fortalecer."
        canonical="/brechas"
      />
      <section className="container py-10">
        <h1 className="text-3xl font-semibold mb-3">Identifica tus brechas</h1>
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
          <div className="grid gap-3 sm:grid-cols-2">
            {gaps.map((g) => (
              <div key={g.key} className="flex items-center justify-between rounded-md border p-4 bg-card">
                <div>
                  <div className="font-medium">{g.label}</div>
                  <div className="text-sm text-muted-foreground">Puntaje: {g.value} / 5</div>
                </div>
                <Badge variant={g.prioridad === "Alta" ? "destructive" : "secondary"}>{g.prioridad}</Badge>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 flex gap-3">
          <Button asChild disabled={!record}>
            <Link to="/recomendaciones">Ver recomendaciones</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/autoevaluacion">Atrás</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
