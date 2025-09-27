import { Seo } from "@/components/Seo";
import { ComingSoonProgress } from "@/components/ComingSoonProgress";

export default function Dashboard() {
  return (
    <>
      <Seo
        title="Panel de progreso — ProductPrepa"
        description="Monitorea tu avance en habilidades clave de producto."
        canonical="/progreso"
      />
      <ComingSoonProgress />
    </>
  );
}
