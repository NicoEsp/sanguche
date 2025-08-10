import { Button } from "@/components/ui/button";
import { Seo } from "@/components/Seo";
import { Link } from "react-router-dom";

export default function Assessment() {
  return (
    <>
      <Seo
        title="Autoevaluación PM — ProductPrepa"
        description="Evalúa tu nivel de seniority en Product Management."
        canonical="/autoevaluacion"
      />
      <section className="container py-10">
        <h1 className="text-3xl font-semibold mb-3">Autoevaluación de seniority</h1>
        <p className="text-muted-foreground mb-8">
          Responde preguntas sobre tu experiencia en estrategia, ejecución, liderazgo, analítica, discovery y más.
        </p>
        <div className="rounded-lg border p-6 bg-card">
          <p className="mb-6">Próximamente verás aquí el cuestionario interactivo.</p>
          <div className="flex gap-3">
            <Button asChild>
              <Link to="/brechas">Continuar</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/">Volver</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
