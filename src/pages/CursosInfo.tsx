import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Seo } from "@/components/Seo";
import { CourseInquiryCta } from "@/components/planes/CourseInquiryCta";
import { LemonSqueezyCheckout } from "@/components/LemonSqueezyCheckout";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { usePricing } from "@/hooks/usePricing";
import { useSubscription } from "@/hooks/useSubscription";
import {
  BookOpen, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  Play, 
  ArrowRight,
  Sparkles,
  Target,
  Users,
  Crown
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function CursosInfo() {
  const { user, isAuthenticated } = useAuth();
  const { profile } = useUserProfile();
  const { curso_estrategia, cursos_all, repremium, loading: pricingLoading } = usePricing();
  const { 
    hasActiveRePremium, 
    hasCursoEstrategia, 
    hasCursosAll 
  } = useSubscription();

  // FAQs data
  const faqs = [
    {
      question: "¿Cuánto dura el curso Estrategia de Producto?",
      answer: "El curso tiene una duración de 80 minutos, dividido en videos cortos de menos de 10 minutos cada uno para que puedas avanzar a tu ritmo."
    },
    {
      question: "¿Los cursos tienen acceso de por vida?",
      answer: "Sí, todos nuestros cursos incluyen acceso de por vida con un único pago. Además, recibirás actualizaciones futuras sin costo adicional."
    },
    {
      question: "¿Puedo acceder desde el celular?",
      answer: "Sí, la plataforma es 100% responsive y puedes ver los videos y hacer ejercicios desde cualquier dispositivo."
    },
    {
      question: "¿Qué pasa si compro el curso y lanzan nuevos contenidos?",
      answer: "Al comprar el curso tienes acceso a todas las actualizaciones futuras del mismo curso sin costo adicional. Si quieres acceso a nuevos cursos, puedes optar por el bundle 'Todos los Cursos'."
    },
    {
      question: "¿Los cursos tienen certificado?",
      answer: "Los cursos incluyen certificado de finalización que puedes compartir en LinkedIn una vez completes todas las lecciones y ejercicios."
    }
  ];

  const cursosInfoSchema = [
    // ItemList Schema for courses
    {
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
    },
    // BreadcrumbList Schema
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Inicio",
          "item": "https://productprepa.com"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Cursos",
          "item": "https://productprepa.com/cursos-info"
        }
      ]
    },
    // FAQPage Schema
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    }
  ];

  return (
    <>
      <Seo
        title="Cursos de Producto | Estrategia, Discovery y más - ProductPrepa"
        description="Aprende Estrategia de Producto con cursos cortos y prácticos. Videos de menos de 10 minutos, ejercicios aplicables y acceso de por vida. Ideal para principiantes."
        canonical="/cursos-info"
        keywords="cursos Estrategia de Producto, curso product manager principiantes, formación PM online, aprender product management, curso estrategia producto, cursos PM gratis, como ser product manager sin experiencia, curso estrategia de producto online, formación product manager latinoamérica, curso PM en español"
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
                <div className="flex flex-col">
                  {/* Course Image - Full width, no cropping */}
                  <div className="relative w-full">
                    <img 
                      src="https://lgscevufwnetegglgpnw.supabase.co/storage/v1/object/public/course-thumbnails/estrategia-de-producto-para-principiantes-1768839792745.jpeg"
                      alt="Curso Estrategia de Producto para principiantes"
                      className="w-full h-auto rounded-t-lg"
                    />
                    <div className="absolute bottom-4 left-4">
                      <Badge variant="nuevo">
                        <Calendar className="w-3 h-3 mr-1" />
                        Lanza 20 de febrero
                      </Badge>
                    </div>
                  </div>

                  {/* Course Details - Below image */}
                  <div className="p-6">
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
                          "Fundamentos de Estrategia de Producto",
                          "Las Seis Dimensiones",
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

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-2xl font-bold">
                            {pricingLoading ? "..." : curso_estrategia.formatted}
                          </span>
                          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
                            Precio pre-lanzamiento
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">pago único</span>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <LemonSqueezyCheckout 
                          plan="curso_estrategia"
                          variant="default"
                          size="default"
                          className="w-full sm:w-auto"
                        >
                          Comprar ahora
                        </LemonSqueezyCheckout>
                        <Button asChild variant="outline">
                          <Link to="/planes">
                            Ver planes
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Link>
                        </Button>
                      </div>
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
          </div>
        </section>

        {/* Pricing Options Section */}
        <section className="px-4 py-12 bg-background">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-2">Opciones de compra</h2>
            <p className="text-center text-muted-foreground mb-8">
              Elegí la opción que mejor se adapte a tus necesidades
            </p>
            
            <div className="grid md:grid-cols-3 gap-6">
              {/* Curso individual */}
              <Card className={`p-6 text-center ${hasCursoEstrategia ? 'border-green-500 bg-green-50 dark:bg-green-950/30' : ''}`}>
                <BookOpen className="w-8 h-8 text-primary mx-auto mb-4" />
                <h3 className="font-bold mb-2">Curso Individual</h3>
                <p className="text-2xl font-bold mb-1">
                  {pricingLoading ? "..." : curso_estrategia.formatted}
                </p>
                <p className="text-sm text-muted-foreground mb-4">pago único</p>
                <ul className="text-sm text-left space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Estrategia de Producto</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Acceso de por vida</span>
                  </li>
                </ul>
                {hasCursoEstrategia ? (
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/cursos">Acceder al curso</Link>
                  </Button>
                ) : (
                  <LemonSqueezyCheckout plan="curso_estrategia" buttonText="Comprar curso" className="w-full" />
                )}
              </Card>
              
              {/* Todos los cursos */}
              <Card className={`p-6 text-center relative ${hasCursosAll ? 'border-green-500 bg-green-50 dark:bg-green-950/30' : 'border-primary bg-primary/5'}`}>
                {!hasCursosAll && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Mejor valor</Badge>
                )}
                <Sparkles className="w-8 h-8 text-amber-500 mx-auto mb-4" />
                <h3 className="font-bold mb-2">Todos los Cursos</h3>
                <p className="text-2xl font-bold mb-1">
                  {pricingLoading ? "..." : cursos_all.formatted}
                </p>
                <p className="text-sm text-muted-foreground mb-4">pago único</p>
                <ul className="text-sm text-left space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Todos los cursos actuales</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Cursos futuros incluidos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Acceso de por vida</span>
                  </li>
                </ul>
                {hasCursosAll ? (
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/cursos">Acceder a cursos</Link>
                  </Button>
                ) : (
                  <LemonSqueezyCheckout plan="cursos_all" buttonText="Comprar bundle" className="w-full" />
                )}
              </Card>
              
              {/* RePremium */}
              <Card className={`p-6 text-center ${hasActiveRePremium ? 'border-green-500 bg-green-50 dark:bg-green-950/30' : ''}`}>
                <Crown className="w-8 h-8 text-amber-500 mx-auto mb-4" />
                <h3 className="font-bold mb-2">Con Mentoría</h3>
                <p className="text-2xl font-bold mb-1">
                  {pricingLoading ? "..." : repremium.formatted}
                </p>
                <p className="text-sm text-muted-foreground mb-4">/mes</p>
                <ul className="text-sm text-left space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Todos los cursos incluidos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>2 sesiones mensuales 1:1</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Career Path personalizado</span>
                  </li>
                </ul>
                {hasActiveRePremium ? (
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/mentoria">Ir a tu mentoría</Link>
                  </Button>
                ) : (
                  <LemonSqueezyCheckout plan="repremium" buttonText="Suscribirse" className="w-full" />
                )}
              </Card>
            </div>
            
            {/* Upgrade CTA for curso_estrategia users */}
            {hasCursoEstrategia && !hasCursosAll && !hasActiveRePremium && (
              <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-center sm:text-left">
                    <p className="font-medium">Ya tenés el curso Estrategia de Producto</p>
                    <p className="text-sm text-muted-foreground">¿Querés acceder a todos los cursos actuales y futuros?</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <LemonSqueezyCheckout 
                      plan="cursos_all" 
                      buttonText="Upgrade a Todos los Cursos"
                      variant="outline"
                    />
                    <LemonSqueezyCheckout 
                      plan="repremium" 
                      buttonText="Upgrade a RePremium"
                      variant="default"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="px-4 py-12 bg-muted/30">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-2">Preguntas frecuentes</h2>
            <p className="text-center text-muted-foreground mb-8">
              Todo lo que necesitás saber sobre nuestros cursos
            </p>
            
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
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
