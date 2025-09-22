import { Seo } from "@/components/Seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PaywallCard } from "@/components/PaywallCard";
import { isFeatureAvailable, FEATURES } from "@/utils/features";

const data = [
  { area: "Discovery", nivel: 60 },
  { area: "Analítica", nivel: 40 },
  { area: "Roadmap", nivel: 55 },
  { area: "Liderazgo", nivel: 70 },
  { area: "Go-to-Market", nivel: 35 },
];

export default function Dashboard() {
  // Verificar si el usuario tiene acceso al dashboard de progreso
  const hasAccess = isFeatureAvailable(FEATURES.PROGRESS);

  if (!hasAccess) {
    return (
      <>
        <Seo
          title="Panel de progreso — ProductPrepa"
          description="Monitorea tu avance en habilidades clave de producto."
          canonical="/progreso"
        />
        <PaywallCard 
          title="Desbloquea tu panel de progreso"
          feature="el seguimiento de tu avance"
        />
      </>
    );
  }

  return (
    <>
      <Seo
        title="Panel de progreso — ProductPrepa"
        description="Monitorea tu avance en habilidades clave de producto."
        canonical="/progreso"
      />
      <section className="container py-10">
        <h1 className="text-3xl font-semibold mb-6">Tu progreso</h1>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Avance general</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">Objetivos completados</p>
              <Progress value={48} />
              <p className="mt-2 text-sm">48% completado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Nivel por área</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.map((item) => (
                  <div key={item.area} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{item.area}</span>
                      <span className="text-sm text-muted-foreground">{item.nivel}%</span>
                    </div>
                    <Progress value={item.nivel} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}
