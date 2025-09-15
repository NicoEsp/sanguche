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
        <h1 className="text-3xl font-semibold mb-4">Compartir en LinkedIn</h1>
        <p className="text-muted-foreground mb-6">
          Próximamente podrás compartir tus resultados y avances en tu perfil profesional.
        </p>
        <Button
          onClick={() =>
            toast({
              title: "Próximamente",
              description: "La función de compartir en LinkedIn estará disponible pronto.",
            })
          }
        >
          Compartir en LinkedIn
        </Button>
      </section>
    </>
  );
}
