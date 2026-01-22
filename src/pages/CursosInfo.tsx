import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Seo } from "@/components/Seo";
import { CourseInquiryCta } from "@/components/planes/CourseInquiryCta";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { usePricing } from "@/hooks/usePricing";
import { 
  BookOpen, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  Play, 
  ArrowRight,
  Sparkles,
  Target,
  TrendingUp,
  Users
} from "lucide-react";

export default function CursosInfo() {
  const { user, isAuthenticated } = useAuth();
  const { profile } = useUserProfile();
  const { curso_estrategia, cursos_all, loading: pricingLoading } = usePricing();

  const cursosInfoSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Cursos de Producto - ProductPrepa",
    "description": "Cursos especializados para Product Managers. Aprende Estrategia de Producto con videos cortos y ejercicios prácticos.",
    "itemListElement": [
      {
        "@type": "Course",
        "@id": "https://productprepa.com/cursos/estrategia-producto",
        "position": 1,
        "name": "Estrategia de Producto para principiantes",
        "description": "Aprende los conceptos básicos de lo que implica una Estrategia de Producto y cuáles son los frameworks más importantes.",
        "provider": {
          "@type": "Organization",
          "name": "ProductPrepa",
          "url": "https://productprepa.com"
        },
        "courseMode": "online",
        "educationalLevel": "Beginner",
        "inLanguage": "es",
        "hasCourseInstance": {
          "@type": "CourseInstance",
          "courseMode": "online",
          "duration": "PT80M"
        },
        "offers": {
          "@type": "Offer",
          "price": pricingLoading ? 0 : curso_estrategia.amount / 100,
          "priceCurrency": "ARS",
          "availability": "https://schema.org/PreOrder"
        }
      },
      {
        "@type": "Course",
        "@id": "https://productprepa.com/cursos/pm-101",
        "position": 2,
        "name": "Product Management 101",
        "description": "Introducción gratuita a Product Management. Perfecto para quienes recién comienzan.",
        "provider": {
          "@type": "Organization",
          "name": "ProductPrepa",
          "url": "https://productprepa.com"
        },
        "courseMode": "online",
        "educationalLevel": "Beginner",
        "inLanguage": "es",
        "isAccessibleForFree": true,
        "hasCourseInstance": {
          "@type": "CourseInstance",
          "courseMode": "online",
          "duration": "PT45M"
        }
      }
    ]
  };

  return (
    <>
      <Seo
        title="Cursos de Producto | Estrategia, Discovery y más - ProductPrepa"
        description="Aprende Estrategia de Producto con cursos cortos y prácticos. Videos de menos de 10 minutos, ejercicios aplicables y acceso de por vida. Ideal para principiantes."
        canonical="/cursos-info"
        keywords="cursos estrategia de producto, curso product manager principiantes, formación PM online, aprender product management, curso estrategia producto, cursos PM gratis"
        jsonLd={cursosInfoSchema}
      />

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        {/* Hero Section */}
        <section className="pt-12 pb-8 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">
              <BookOpen className="w-3 h-3 mr-1" />
              Cursos de ProductPrepa
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Cursos de Producto diseñados para aprender haciendo
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-6 leading-relaxed">
              Videos cortos de menos de 10 minutos, ejercicios prácticos y acceso de por vida. 
              Pensados para que puedas aplicar lo que aprendes desde el día uno.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Videos cortos
              </span>
              <span className="flex items-center gap-1">
                <Target className="w-4 h-4" />
                Ejercicios prácticos
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Acceso de por vida
              </span>
            </div>
          </div>
        </section>

        {/* Featured Course: Estrategia de Producto */}
        <section className="px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-card to-primary/5">
              <CardContent className="p-0">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Course Image */}
                  <div className="relative aspect-video md:aspect-auto bg-muted flex items-center justify-center p-6">
                    <div className="text-center">
                      <div className="w-24 h-24 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
                        <TrendingUp className="w-12 h-12 text-primary" />
                      </div>
                      <Badge variant="nuevo" className="mb-2">
                        <Calendar className="w-3 h-3 mr-1" />
                        Lanza 31 de enero
                      </Badge>
                    </div>
                  </div>

                  {/* Course Details */}
                  <div className="p-6 md:py-8">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline">Nivel: Principiante</Badge>
                      <Badge variant="secondary">
                        <Clock className="w-3 h-3 mr-1" />
                        80 min
                      </Badge>
                    </div>

                    <h2 className="text-2xl font-bold mb-3">
                      Estrategia de Producto para principiantes
                    </h2>

                    <p className="text-muted-foreground mb-4">
                      Vas a aprender los conceptos básicos de lo que implica una Estrategia de Producto 
                      y cuáles son los frameworks más importantes para que puedas empezar a aplicarlos 
                      desde el día uno.
                    </p>

                    <div className="space-y-2 mb-6">
                      <h3 className="font-semibold text-sm">Lo que vas a aprender:</h3>
                      <ul className="space-y-2">
                        {[
                          "Fundamentos de estrategia de producto",
                          "Frameworks esenciales para empezar",
                          "Cómo alinear producto con negocio",
                          "Ejercicios prácticos aplicables",
                        ].map((item, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold">
                          {pricingLoading ? "..." : curso_estrategia.formatted}
                        </span>
                        <span className="text-sm text-muted-foreground ml-1">pago único</span>
                      </div>
                      <Button asChild>
                        <Link to="/planes">
                          Ver planes
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Available Courses */}
        <section className="px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-2">Cursos Disponibles Ahora</h2>
            <p className="text-center text-muted-foreground mb-8">
              Comenzá gratis y avanzá a tu ritmo
            </p>

            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <div className="w-20 h-20 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Play className="w-10 h-10 text-primary" />
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                      <h3 className="text-xl font-bold">Product Management 101</h3>
                      <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                        Gratuito
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mb-3">
                      Introducción a Product Management. Perfecto para quienes recién comienzan 
                      o quieren repasar los fundamentos.
                    </p>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        45 minutos
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        Nivel: Principiante
                      </span>
                    </div>
                  </div>

                  <Button asChild variant="outline">
                    <Link to={isAuthenticated ? "/cursos" : "/auth"}>
                      {isAuthenticated ? "Acceder" : "Registrarse gratis"}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Upcoming Courses */}
        <section className="px-4 py-8 bg-muted/30">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="outline" className="mb-4">
              <Sparkles className="w-3 h-3 mr-1" />
              Próximamente
            </Badge>
            <h2 className="text-2xl font-bold mb-4">Más cursos en camino</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Estamos preparando más contenido sobre Discovery, Métricas, Roadmaps y más. 
              Los suscriptores de RePremium tendrán acceso automático a todos los nuevos cursos.
            </p>

            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              {[
                { title: "Discovery", icon: "🔍", description: "Técnicas de investigación" },
                { title: "Métricas", icon: "📊", description: "KPIs y análisis de datos" },
                { title: "Roadmaps", icon: "🗺️", description: "Planificación de producto" },
              ].map((course, index) => (
                <Card key={index} className="p-4 bg-background/50">
                  <div className="text-3xl mb-2">{course.icon}</div>
                  <h3 className="font-semibold mb-1">{course.title}</h3>
                  <p className="text-sm text-muted-foreground">{course.description}</p>
                </Card>
              ))}
            </div>

            <Card className="p-6 bg-primary/5 border-primary/20">
              <h3 className="font-bold mb-2">¿Querés acceso a todos los cursos?</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                Con el bundle "Todos los Cursos" ({pricingLoading ? "..." : cursos_all.formatted} pago único) 
                tenés acceso de por vida a todos los cursos actuales y futuros.
              </p>
              <Button asChild>
                <Link to="/planes">
                  Ver opciones de compra
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </Card>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">¿Tenés otras dudas sobre los cursos?</h2>
            <p className="text-muted-foreground mb-6">
              Escribinos y te ayudamos a elegir el mejor camino para vos.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button asChild size="lg">
                <Link to="/planes">
                  Ver planes y precios
                </Link>
              </Button>
            </div>

            <CourseInquiryCta
              isAuthenticated={isAuthenticated}
              profileName={profile?.name}
              userEmail={user?.email}
            />
          </div>
        </section>
      </div>
    </>
  );
}
