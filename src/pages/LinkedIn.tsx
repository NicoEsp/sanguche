import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export default function LinkedInConnect() {
  return (
    <>
      <Seo
        title="Conectar con LinkedIn — ProductPrepa"
        description="Vincula tu perfil para recomendaciones más precisas."
        canonical="/linkedin"
      />
      <section className="container py-10">
        <h1 className="text-3xl font-semibold mb-4">Conectar con LinkedIn</h1>
        <p className="text-muted-foreground mb-6">
          Próximamente podrás sincronizar tu perfil para potenciar tus recomendaciones.
        </p>
        <Button
          onClick={() =>
            toast({
              title: "Próximamente",
              description: "La integración con LinkedIn estará disponible en el siguiente paso.",
            })
          }
        >
          Conectar con LinkedIn
        </Button>
      </section>
    </>
  );
}
