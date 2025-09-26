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
          onClick={() => {
            const linkedInMessage = `🚀 Estuve probando ProductPrepa de @Nicolás Espíndola y me ayudó a identificar mis brechas como Product Manager.

Es una herramienta increíble que analiza tus habilidades y te da recomendaciones personalizadas para mejorar en el rol.

Si estás en producto o querés crecer en el área, te la recomiendo 💯

#ProductManagement #Desarrollo #ProductPrepa`;

            const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin)}&text=${encodeURIComponent(linkedInMessage)}`;
            window.open(linkedInUrl, '_blank', 'width=600,height=600');
          }}
        >
          Compartir en LinkedIn
        </Button>
      </section>
    </>
  );
}
