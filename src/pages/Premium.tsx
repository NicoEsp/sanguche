import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, Star, TrendingUp, BookOpen, MapPin, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Seo } from "@/components/Seo";
import { PolarCheckout } from "@/components/PolarCheckout";
import { FAQ } from "@/components/sections/FAQ";
export default function Premium() {
  const {
    user
  } = useAuth();
  return <>
      <Seo title="Funciones Premium - ProductPrepa" description="Descubre todas las funciones premium de ProductPrepa: mentoría personalizada, seguimiento de progreso, recursos curados y roadmap de carrera." />
      
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        {/* Hero Section */}
        <section className="pt-20 pb-16 px-4">
          <div className="max-w-6xl mx-auto text-center">
            
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Destaca como Product Manager
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
              Desbloquea herramientas avanzadas de seguimiento, mentoría personalizada y recursos curados para llevar tu carrera al siguiente nivel.
            </p>
          </div>
        </section>

        {/* Feature Comparison */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">¿Qué incluye Premium?</h2>
            
            <div className="grid md:grid-cols-2 gap-8 mb-16">
              {/* Free Plan */}
              <Card className="relative">
                <CardHeader>
                  <CardTitle className="text-2xl">Plan Gratuito</CardTitle>
                  <CardDescription>Perfecto para comenzar</CardDescription>
                  <div className="text-3xl font-bold">$0<span className="text-sm font-normal text-muted-foreground">/mes</span></div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500" />
                      <span>Autoevaluación completa</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500" />
                      <span>Identificación de áreas de mejora</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500" />
                      <span>Recursos básicos</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500" />
                      <span>Recursos gratuitos para ayudarte</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Premium Plan */}
              <Card className="relative border-primary bg-primary/5">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">Más Popular</Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-2xl">Plan Premium</CardTitle>
                  <CardDescription>Para profesionales ambiciosos</CardDescription>
                  <div className="text-3xl font-bold">$9.99<span className="text-sm font-normal text-muted-foreground">/mes</span></div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500" />
                      <span>Todo lo del plan gratuito</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary" />
                      <span>Mentoria personalizada una vez por mes con <a href="https://www.linkedin.com/in/nicolas-espindola/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors underline">NicoProducto</a></span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary" />
                      <span>Seguimiento detallado de tu progreso</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary" />
                      <span>Recursos curados en base a tus Áreas de mejora</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary" />
                      <span>Roadmap de carrera personalizado (Career Path)</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary" />
                      <span>Actualizaciones mensuales de contenido y recursos</span>
                    </li>
                  </ul>
                  
                  <div className="mt-6">
                    <PolarCheckout />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Detailed Features */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Funciones Premium en Detalle</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card>
                <CardHeader className="text-center">
                  <MessageCircle className="w-12 h-12 text-primary mx-auto mb-4" />
                  <CardTitle className="text-xl">Mentoría Personalizada</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center">
                    Sesión mensual 1:1 con <a href="https://www.linkedin.com/in/nicolas-espindola/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors underline">NicoProducto</a> para revisar tu progreso y planificar próximos pasos.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="text-center">
                  <TrendingUp className="w-12 h-12 text-primary mx-auto mb-4" />
                  <CardTitle className="text-xl">Dashboard de Progreso</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center">
                    Visualiza tu evolución en tiempo real con métricas detalladas y gráficos de progreso por área de competencia.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="text-center">
                  <BookOpen className="w-12 h-12 text-primary mx-auto mb-4" />
                  <CardTitle className="text-xl">Recursos Curados</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center">
                    Acceso a una biblioteca de recursos específicos basados en tus áreas de mejora identificadas.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="text-center">
                  <MapPin className="w-12 h-12 text-primary mx-auto mb-4" />
                  <CardTitle className="text-xl">Career Roadmap</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center">
                    Hoja de ruta personalizada con objetivos específicos y pasos concretos para avanzar en tu carrera.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">¿Listo para acelerar tu carrera?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Únete a ProductPrepa Premium y obtén las herramientas que necesitas para destacar como Product Manager.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {user ? <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link to="/progreso">Ver mi progreso</Link>
                </Button> : <>
                  <Button asChild size="lg" className="w-full sm:w-auto">
                    <Link to="/auth">Comenzar ahora</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                    
                  </Button>
                </>}
            </div>
          </div>
        </section>

        <Separator className="max-w-6xl mx-auto" />

        {/* Free Resource Section */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">
              ¿No estás seguro? Accede a este recurso gratuito como ejemplo
            </h2>
            <p className="text-lg mb-8 text-muted-foreground max-w-2xl mx-auto">
              Prueba nuestra autoevaluación gratuita y descubre qué puede ayudarte en el momento en el que estás
            </p>
            <Card className="max-w-md mx-auto bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">A darle Métricas!</h3>
                  <p className="text-muted-foreground mb-4">
                    Recurso complementario para ayudarte a tener una mirada más precisa sobre Métricas de Producto
                  </p>
                  <Button disabled className="w-full">
                    Descargar recurso
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </>;
}