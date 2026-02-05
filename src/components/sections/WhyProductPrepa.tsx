import { MessageCircle, Zap, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
const features = [{
  icon: Zap,
  title: "Evaluación específica",
  description: "No es un test genérico. Diseñado específicamente para evaluar las 11 competencias core de Product Management.",
  highlight: true
}, {
  icon: BookOpen,
  title: "Recursos curados por expertos",
  description: "Accede a contenido seleccionado por profesionales experimentados, no contenido automático.",
  highlight: true
}, {
  icon: MessageCircle,
  title: "Guía personalizada estructurada",
  description: "Accede a guía estructurada diseñada por NicoProducto, Senior PM con experiencia en empresas tech, para acelerar tu desarrollo profesional.",
  highlight: true
}];
export function WhyProductPrepa() {
  return <section className="container sm:py-16 px-4 sm:px-6 bg-secondary/10 py-[25px]">
      <div className="text-center mb-8 sm:mb-12">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4">¿Por qué elegir ProductPrepa?</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          La plataforma de autoevaluación más completa y específica para Product Managers
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="grid gap-6 md:grid-cols-2 mb-6">
          {features.slice(0, 2).map((feature, index) => (
            <Card key={index} className={`${feature.highlight ? 'border-primary/20 bg-primary/5' : 'border-border'} transition-all hover:border-primary/30`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${feature.highlight ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex justify-center">
          <div className="w-full max-w-md">
            {features.slice(2).map((feature, index) => (
              <Card key={index + 2} className={`${feature.highlight ? 'border-primary/20 bg-primary/5' : 'border-border'} transition-all hover:border-primary/30`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${feature.highlight ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>;
}