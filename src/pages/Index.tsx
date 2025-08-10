import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Seo } from "@/components/Seo";

const Index = () => {
  return (
    <>
      <Seo
        title="ProductPrepa — Autoevaluación PM"
        description="Evalúa tu seniority en Product Management y descubre tus brechas de habilidades."
        canonical="/"
      />
      <main className="min-h-screen flex items-center justify-center bg-background">
        <section className="container text-center py-16">
          <h1 className="text-4xl font-bold mb-4">Impulsa tu carrera en Product Management</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Autoevalúa tu nivel de seniority, identifica brechas de habilidades y recibe recomendaciones personalizadas para crecer más rápido.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button asChild>
              <Link to="/autoevaluacion">Comenzar autoevaluación</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/progreso">Ver panel de progreso</Link>
            </Button>
          </div>
        </section>
      </main>
    </>
  );
};

export default Index;
