import { Seo } from "@/components/Seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "react-router-dom";

const recs = [
  {
    title: "Profundiza en Discovery",
    steps: ["Realiza 5 entrevistas con usuarios", "Mapea oportunidades (Opportunity Solution Tree)", "Define hipótesis y experimentos"],
  },
  {
    title: "Mejora tu Analítica",
    steps: ["Aprende SQL básico", "Define métricas de producto", "Crea un dashboard de seguimiento"],
  },
  {
    title: "Fortalece Roadmapping",
    steps: ["Explora marcos (RICE/ICE)", "Planifica por outcomes", "Coordina con marketing y tech"],
  },
];

export default function Recommendations() {
  return (
    <>
      <Seo
        title="Recomendaciones personalizadas — ProductPrepa"
        description="Recibe sugerencias accionables para avanzar en tu carrera."
        canonical="/recomendaciones"
      />
      <section className="container py-10">
        <h1 className="text-3xl font-semibold mb-6">Recomendaciones personalizadas</h1>
        <div className="grid gap-6 md:grid-cols-3">
          {recs.map((r) => (
            <Card key={r.title} className="h-full">
              <CardHeader>
                <CardTitle>{r.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  {r.steps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-8 flex gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button disabled>Compartir en LinkedIn</Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Próximamente</p>
            </TooltipContent>
          </Tooltip>
          <Button asChild variant="outline">
            <Link to="/brechas">Atrás</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
