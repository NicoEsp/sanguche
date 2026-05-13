import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Seo } from "@/components/Seo";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Lightbulb,
  Rocket,
  Target,
  Brain,
  TrendingUp,
  Users,
  ArrowRight,
  CheckCircle2,
  BarChart3,
  Zap,
  Home,
  ChevronRight,
  MessageCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { soyDevFaqs } from "@/seo/faqs/soyDev";
import { SoyDevHeroVideo } from "@/components/landing/SoyDevHeroVideo";

const whyCards = [
  {
    icon: Brain,
    title: "El contexto cambió",
    description:
      "Con AI generando código, el diferencial ya no es solo saber programar. Es entender qué construir y por qué. Los devs que entienden producto son los que lideran equipos, toman decisiones y aportan mucho más valor.",
    link: {
      to: "/blog/product-management-en-tiempos-de-ia-que-cambia-que-no-cambia-y-que-tenes-que-hacer-al-respecto",
      label: "Cómo cambia Producto con IA",
    },
  },
  {
    icon: Users,
    title: "Hablá el idioma del negocio",
    description:
      "Cuando entendés de métricas, priorización y product discovery, la comunicación con PMs, diseñadores y stakeholders deja de ser un cuello de botella. Tu carrera se acelera y las fricciones desaparecen.",
    link: {
      to: "/blog/outputs-vs-outcomes-por-que-tu-equipo-trabaja-mucho-y-mueve-poco-la-aguja",
      label: "Outputs vs outcomes",
    },
  },
  {
    icon: TrendingUp,
    title: "De ejecutor a estratega",
    description:
      "Pasar de recibir tickets a influir en la dirección del Producto. Los devs con mentalidad de producto son los más valorados en cualquier equipo, y los que más chances tienen de ser promovidos a Tech Lead, Staff o Engineering Manager.",
    link: {
      to: "/blog/priorizacion-en-startups-por-que-siempre-hay-demasiado-para-hacer-y-como-decidir-que-va-primero",
      label: "Cómo priorizar en startups",
    },
  },
  {
    icon: Rocket,
    title: "Emprendimiento y side-projects",
    description:
      "Si querés lanzar tu propio producto, necesitás priorización, product discovery y distribución. Solo con código no alcanza — la razón #1 de fracaso de startups no es técnica.",
    link: {
      to: "/blog/product-builder-por-que-los-pms-deberian-construir-sus-propios-proyectos",
      label: "Por qué construir tus propios proyectos",
    },
  },
] as const;

const benefits = [
  {
    icon: Target,
    text: "Evaluá tus habilidades de producto actuales con una autoevaluación diseñada por un experto con más de 10 años de experiencia.",
  },
  {
    icon: BarChart3,
    text: "Identificá gaps específicos para tu perfil técnico y obtené tu nivel de seniority en producto.",
  },
  {
    icon: Lightbulb,
    text: "Accedé a recursos curados pensados para perfiles que vienen del desarrollo de software.",
  },
  {
    icon: CheckCircle2,
    text: "Tené un roadmap claro de crecimiento en producto con objetivos concretos y medibles.",
  },
  {
    icon: MessageCircle,
    text: (
      <>
        Accedé a sesiones de mentoría personalizada 1:1 con{" "}
        <a
          href="https://www.linkedin.com/in/nicolas-espindola/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:text-primary/80 transition-colors underline font-medium"
        >
          NicoProducto
        </a>{" "}
        para acelerar tu crecimiento en producto.
      </>
    ),
  },
] as const;

const stats = [
  {
    value: "35%",
    label:
      "de startups fracasan porque no había necesidad de mercado. Es la razón #1 de fracaso.",
    source: "CB Insights, 2021",
    url: "https://www.cbinsights.com/research/report/startup-failure-reasons-top/",
  },
  {
    value: "4-5x",
    label:
      "más rápido crecen en revenue las empresas donde producto, cultura y herramientas están alineados.",
    source: "McKinsey, 2020",
    url: "https://www.mckinsey.com/industries/technology-media-and-telecommunications/our-insights/developer-velocity-how-software-excellence-fuels-business-performance",
  },
  {
    value: "84%",
    label:
      "de developers ya usan herramientas de AI para programar. Solo código ya no es el diferencial.",
    source: "Stack Overflow Survey, 2025",
    url: "https://survey.stackoverflow.co/2025/ai",
  },
];

const SoyDev = () => {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <Seo />

      <main className="min-h-screen bg-background animate-fade-in">
        {/* Breadcrumb */}
        <div className="container px-4 sm:px-6 pt-6">
          <nav className="flex items-center gap-1 text-sm text-muted-foreground">
            <Link
              to="/"
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Home className="h-3.5 w-3.5" />
              Inicio
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground font-medium">Soy Dev</span>
          </nav>
        </div>

        {/* Hero */}
        <section className="container py-12 sm:py-20 px-4 sm:px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 -z-10" />

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center mb-10 sm:mb-12">
            {/* Título + subtítulo */}
            <div className="text-center lg:text-left order-2 lg:order-1">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Sos Dev. Aprender Producto es tu{" "}
                <span className="text-primary">superpoder</span>.
                <br className="hidden sm:block" />
                <span className="text-primary">Es el momento.</span>
              </h1>

              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed lg:max-w-xl">
                El mundo cambió. AI escribe código, pero no "sabe" qué
                construir ni para quién. Los devs que entienden de Producto son
                los que definen el futuro. ¿Estás listo?
              </p>
            </div>

            {/* Video */}
            <div className="order-1 lg:order-2">
              <SoyDevHeroVideo />
            </div>
          </div>

          {/* CTA centrado */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="text-lg px-10 py-7 font-semibold shadow-lg"
            >
              <Link to={isAuthenticated ? "/autoevaluacion" : "/auth"}>
                Comenzar evaluación gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Por qué Producto importa */}
        <section className="container py-12 sm:py-20 px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              De Software Engineer a Product Builder: por qué importa
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              No se trata de dejar de programar. Se trata de entender el
              contexto completo de lo que construís.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 max-w-4xl mx-auto">
            {whyCards.map((card) => (
              <Card
                key={card.title}
                className="bg-gradient-to-br from-card to-muted/30 border-border/60 hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <card.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {card.description}
                  </p>
                  <Link
                    to={card.link.to}
                    className="text-sm text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1 mt-auto"
                  >
                    {card.link.label}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Datos del mercado */}
        <section className="container py-12 sm:py-20 px-4 sm:px-6">
          <div className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 rounded-2xl border border-border/60 p-8 sm:p-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
              Por qué los devs necesitan Producto en la era de la IA
            </h2>
            <div className="grid gap-8 sm:grid-cols-3 max-w-3xl mx-auto text-center">
              {stats.map((stat) => (
                <div key={stat.value}>
                  <div className="text-4xl sm:text-5xl font-bold text-primary mb-2">
                    {stat.value}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {stat.label}
                  </p>
                  <a
                    href={stat.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary/60 hover:text-primary underline mt-1 inline-block"
                  >
                    Fuente: {stat.source}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Qué vas a descubrir */}
        <section className="container py-12 sm:py-20 px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Cómo ProductPrepa ayuda a un developer a crecer en Producto
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Herramientas pensadas para que un perfil técnico pueda evaluar,
              aprender y crecer en sus habilidades de Producto. Conocé los{" "}
              <Link to="/planes" className="text-primary hover:underline">
                planes
              </Link>
              , los{" "}
              <Link to="/cursos-info" className="text-primary hover:underline">
                cursos
              </Link>{" "}
              o agendá{" "}
              <Link to="/mentoria" className="text-primary hover:underline">
                mentoría 1:1
              </Link>
              .
            </p>
          </div>

          <div className="space-y-4 max-w-2xl mx-auto">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 rounded-xl bg-muted/40 border border-border/40"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <benefit.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm sm:text-base text-foreground leading-relaxed">
                  {benefit.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-12 px-4 bg-muted/30">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-2">
              Preguntas frecuentes
            </h2>
            <p className="text-center text-muted-foreground mb-8">
              Lo que más nos preguntan los devs antes de empezar
            </p>

            <Accordion type="single" collapsible className="w-full">
              {soyDevFaqs.map((faq, index) => (
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

            <p className="text-center text-sm text-muted-foreground mt-8">
              ¿Querés profundizar?{" "}
              <Link to="/blog" className="text-primary hover:underline">
                Leé el blog
              </Link>{" "}
              con casos y guías para devs que quieren crecer en Producto.
            </p>
          </div>
        </section>

        {/* CTA Final */}
        <section className="container py-16 sm:py-24 px-4 sm:px-6">
          <Card className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 border-primary/20 max-w-3xl mx-auto">
            <CardContent className="p-8 sm:p-12 text-center">
              <Zap className="h-12 w-12 text-primary mx-auto mb-6" />
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                ¿Listo para descubrir tu nivel de producto?
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto mb-8">
                Es gratis, toma 5 minutos y vas a obtener un diagnóstico
                personalizado de tus habilidades de producto.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  asChild
                  size="lg"
                  className="text-lg px-10 py-7 font-semibold shadow-lg"
                >
                  <Link to={isAuthenticated ? "/autoevaluacion" : "/auth"}>
                    Comenzar evaluación gratis
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="lg">
                  <Link to="/planes">
                    Ver planes
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </>
  );
};

export default SoyDev;
