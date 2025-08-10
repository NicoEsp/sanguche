import { Seo } from "@/components/Seo";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const skills = [
  "Discovery de usuarios",
  "Definición de métricas (North Star KPI)",
  "Roadmapping y priorización",
  "Liderazgo y alineación de stakeholders",
  "Diseño de experimentos A/B",
  "Analítica y SQL básico",
  "Go-to-Market y lanzamientos",
  "Gestión de backlog y refinamiento",
];

export default function SkillGaps() {
  return (
    <>
      <Seo
        title="Brechas de habilidades — ProductPrepa"
        description="Selecciona las habilidades que deseas fortalecer."
        canonical="/brechas"
      />
      <section className="container py-10">
        <h1 className="text-3xl font-semibold mb-3">Identifica tus brechas</h1>
        <p className="text-muted-foreground mb-6">
          Marca las áreas donde sientes que necesitas reforzar conocimientos.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {skills.map((s) => (
            <label key={s} className="flex items-center gap-3 rounded-md border p-4 bg-card cursor-pointer">
              <Checkbox id={s} />
              <span>{s}</span>
            </label>
          ))}
        </div>
        <div className="mt-8 flex gap-3">
          <Button asChild>
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
