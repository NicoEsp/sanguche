import { useState } from "react";
import cursoEstrategiaThumbnail from "@/assets/curso-estrategia-thumbnail.jpg";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Seo } from "@/components/Seo";
import { LemonSqueezyCheckout } from "@/components/LemonSqueezyCheckout";
import { useAuth } from "@/contexts/AuthContext";
import { usePricing } from "@/hooks/usePricing";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  BookOpen,
  Clock,
  CheckCircle2,
  Play,
  ArrowRight,
  Target,
  Users,
  Crown,
  Mail
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function CursosInfo() {
  const { user, isAuthenticated } = useAuth();
  const { curso_estrategia, repremium, loading: pricingLoading } = usePricing();
  const {
    hasActiveRePremium,
    hasCursoEstrategia,
  } = useSubscription();
  const { toast } = useToast();
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistLoading, setWaitlistLoading] = useState(false);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = waitlistEmail.trim();
    if (!email) return;

    setWaitlistLoading(true);
    try {
      const { error } = await (supabase as any)
        .from('course_waitlist')
        .insert({ email });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Ya estás en la lista",
            description: "Este email ya está registrado. Te avisamos cuando haya novedades.",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "¡Listo!",
          description: "Te avisamos cuando los nuevos módulos estén disponibles.",
        });
      }
      setWaitlistEmail("");
    } catch {
      toast({
        title: "No pudimos registrarte",
        description: "Intentá de nuevo en unos minutos.",
        variant: "destructive",
      });
    } finally {
      setWaitlistLoading(false);
    }
  };

  // FAQs data
  const faqs = [
    {
      question: "¿Para quién es este curso?",
      answer: "Para personas que vienen de otro rol (diseño, desarrollo, Scrum) y quieren entender Producto desde la base. También para juniors que arrancaron en producto y nunca tuvieron un marco claro de estrategia. No necesitás experiencia previa en Product Management."
    },
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
      answer: "Al comprar el curso tienes acceso a todas las actualizaciones futuras del mismo curso sin costo adicional."
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
      "description": "Cursos especializados para Product Builders. Aprendé Estrategia de Producto con videos cortos y ejercicios prácticos.",
      "itemListElement": [
        {
          "@type": "Course",
          "@id": "https://productprepa.com/cursos/estrategia-producto",
          "position": 1,
          "name": "Estrategia de Producto desde cero",
          "description": "Aprende los conceptos básicos de lo que implica una Estrategia de Producto con un framework concreto de 6 dimensiones.",
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
            "availability": "https://schema.org/InStock"
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

  const dimensiones = [
    {
      bold: "A quién le estás resolviendo un problema",
      text: "Definir tu Target Audience con criterio, no por intuición"
    },
    {
      bold: "Qué problema resolvés exactamente",
      text: "Formular un Problem Statement que guíe cada decisión de producto"
    },
    {
      bold: "Por qué tu solución vale la pena",
      text: "Construir una Value Proposition que se sostenga ante cualquier pregunta"
    },
    {
      bold: "Qué te diferencia de las alternativas",
      text: "Entender tu Strategic Differentiation antes de construir una feature más"
    },
    {
      bold: "Cómo llegás a tu usuario",
      text: "Elegir una Channel Strategy que tenga sentido para tu contexto"
    },
    {
      bold: "Cómo el producto genera valor económico",
      text: "Definir tu Monetization Strategy con lógica, no por copia"
    }
  ];

  return (
    <>
      <Seo jsonLd={cursosInfoSchema} />

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        {/* Hero Section */}
        <section className="pt-12 pb-8 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">
              <BookOpen className="w-3 h-3 mr-1" />
              Cursos de ProductPrepa
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Estrategia de Producto desde cero
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-6 leading-relaxed">
              Para diseñadores, desarrolladores, Scrum Masters y Marketers que quieren entender Producto de verdad. Sin supuestos, sin jerga. En menos de 80 minutos.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Videos de menos de 10 minutos
              </span>
              <span className="flex items-center gap-1">
                <Target className="w-4 h-4" />
                Ejercicios prácticos aplicables
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
                      alt="Curso Estrategia de Producto desde cero"
                      className="w-full h-auto rounded-t-lg"
                    />
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
                      Estrategia de Producto desde cero
                    </h2>

                    {/* ¿Qué vas a aprender? */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3">¿Qué vas a aprender?</h3>
                      <p className="text-muted-foreground mb-4">
                        Estrategia de Producto es uno de los conceptos más mal entendidos en el mundo del producto, quedate tranquilo que no es culpa tuya. Este curso lo desmitifica desde cero, con un framework concreto de 6 dimensiones que podés aplicar a cualquier producto, en cualquier etapa.
                      </p>

                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm text-primary">Las Seis Dimensiones de la Estrategia de Producto</h4>
                        <ul className="space-y-3">
                          {dimensiones.map((dim, index) => (
                            <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                              <span className="text-sm">
                                <strong>{dim.bold}</strong>. {dim.text}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <p className="text-muted-foreground mt-4 text-sm">
                        Al terminar el curso vas a tener un mapa claro de la estrategia de tu producto. O la claridad de que falta construirla.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-2xl font-bold">
                            {pricingLoading ? "..." : curso_estrategia.formatted}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">Pago único · Acceso de por vida</span>
                        <p className="text-xs text-muted-foreground">Pesos Argentinos · Todos los medios de pago</p>
                      </div>
                      <div className="w-full sm:w-auto">
                        {hasCursoEstrategia ? (
                          <Button asChild variant="outline" className="w-full sm:w-auto">
                            <Link to="/cursos">Acceder al curso</Link>
                          </Button>
                        ) : (
                          <LemonSqueezyCheckout
                            plan="curso_estrategia"
                            variant="default"
                            size="default"
                            className="w-full sm:w-auto"
                          >
                            Quiero empezar
                          </LemonSqueezyCheckout>
                        )}
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

        {/* Pricing Options Section */}
        <section className="px-4 py-12 bg-background">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-2">Opciones de compra</h2>
            <p className="text-center text-muted-foreground mb-8">
              Elegí la opción que mejor se adapte a tus necesidades
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Curso individual */}
              <Card className={`p-6 text-center ${hasCursoEstrategia ? 'border-green-500 bg-green-50 dark:bg-green-950/30' : ''}`}>
                <BookOpen className="w-8 h-8 text-primary mx-auto mb-4" />
                <h3 className="font-bold mb-2">Estrategia de Producto desde cero</h3>
                <p className="text-2xl font-bold mb-1">
                  {pricingLoading ? "..." : curso_estrategia.formatted}
                </p>
                <p className="text-sm text-muted-foreground mb-1">Pago único</p>
                <p className="text-xs text-muted-foreground mb-4">Acceso de por vida · Todos los medios de pago</p>
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
                  <LemonSqueezyCheckout plan="curso_estrategia" buttonText="Quiero empezar" className="w-full" />
                )}
              </Card>

              {/* Mentoría personalizada */}
              <Card className={`p-6 text-center ${hasActiveRePremium ? 'border-green-500 bg-green-50 dark:bg-green-950/30' : ''}`}>
                <Crown className="w-8 h-8 text-amber-500 mx-auto mb-4" />
                <h3 className="font-bold mb-2">Mentoría personalizada</h3>
                <p className="text-2xl font-bold mb-1">
                  {pricingLoading ? "..." : repremium.formatted}
                </p>
                <p className="text-sm text-muted-foreground mb-1">/mes</p>
                <p className="text-xs text-muted-foreground mb-4">Pesos Argentinos</p>
                <ul className="text-sm text-left space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>2 sesiones 1:1 por mes con Nico</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Career Path personalizado</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Acceso a todos los cursos incluido</span>
                  </li>
                </ul>
                {hasActiveRePremium ? (
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/mentoria">Ir a tu mentoría</Link>
                  </Button>
                ) : (
                  <Button asChild variant="default" className="w-full">
                    <Link to="/planes">
                      Ver qué incluye
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                )}
              </Card>
            </div>
          </div>
        </section>

        {/* Próximamente / Lo que viene */}
        <section className="px-4 py-8 bg-muted/30">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">Lo que viene</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Estamos produciendo los próximos módulos. Si querés que te avisemos cuando estén disponibles, dejá tu mail acá.
            </p>

            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              {[
                { title: "Discovery de usuarios", icon: "🔍" },
                { title: "Métricas y North Star", icon: "📊" },
                { title: "Roadmaps que funcionan", icon: "🗺️" },
              ].map((course, index) => (
                <Card key={index} className="p-4 bg-background/50">
                  <div className="text-3xl mb-2">{course.icon}</div>
                  <h3 className="font-semibold">{course.title}</h3>
                </Card>
              ))}
            </div>

            {/* Email capture */}
            <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="tu@email.com"
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  required
                  className="pl-9"
                />
              </div>
              <Button type="submit" disabled={waitlistLoading}>
                {waitlistLoading ? "Registrando..." : "Avisame cuando estén listos"}
              </Button>
            </form>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="px-4 py-12 bg-background">
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
            <h2 className="text-2xl font-bold mb-6">¿Tenés dudas antes de arrancar?</h2>
            <Button asChild size="lg">
              <a href="mailto:nicoproducto@hey.com">
                <Mail className="w-4 h-4 mr-2" />
                Escribime directo
              </a>
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}
