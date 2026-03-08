import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Seo } from "@/components/Seo";
import { Code, Lightbulb, Rocket, Target, Brain, TrendingUp, Users, ArrowRight, CheckCircle2, BarChart3, Zap, Home, ChevronRight, MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import SkillCard from "@/components/soydev/SkillCard";
const whyCards = [{
  icon: Brain,
  title: "El contexto cambió",
  description: "Con AI generando código, el diferencial ya no es solo saber programar. Es entender qué construir y por qué. Los devs que entienden producto son los que lideran equipos, toman decisiones y aportar mucho más valor."
}, {
  icon: Users,
  title: "Hablá idioma del negocio",
  description: "Cuando entendés de métricas, priorización y product discovery, la comunicación con PMs, diseñadores y stakeholders en general deja de ser un cuello de botella. Tu carrera se acelera y las fricciones desaparecen."
}, {
  icon: TrendingUp,
  title: "De ejecutor a estratega",
  description: "Pasar de recibir tickets a influir en la dirección del Producto. Los devs con mentalidad de producto son los más valorados en cualquier equipo, y los que más chances tienen de ser promovidos."
}, {
  icon: Rocket,
  title: "Emprendimiento y side-projects",
  description: "Si querés lanzar tu propio producto, necesitás saber priorización, product discovery y distribución, solo con código no alcanza. El 35% de las startups fracasan porque no había necesidad de mercado — es la razón #1 de fracaso (CB Insights, 2021)."
}];
const benefits = [{
  icon: Target,
  text: "Evaluá tus habilidades de producto actuales con una autoevaluación diseñada por un experto con más de 10 años de experiencia."
}, {
  icon: BarChart3,
  text: "Identificá gaps específicos para tu perfil técnico y obtené tu nivel de seniority en producto"
}, {
  icon: Lightbulb,
  text: "Accedé a recursos curados pensados para perfiles que vienen del desarrollo de software"
}, {
  icon: CheckCircle2,
  text: "Tené un roadmap claro de crecimiento en producto con objetivos concretos y medibles"
}, {
  icon: MessageCircle,
  text: <>Accedé a sesiones de mentoría personalizada 1:1 con <a href="https://www.linkedin.com/in/nicolas-espindola/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors underline font-medium">NicoProducto</a> para acelerar tu crecimiento en producto</>
}] as const;
const stats = [{
  value: "35%",
  label: "de startups fracasan porque no había necesidad de mercado. Es la razón #1 de fracaso.",
  source: "CB Insights, 2021",
  url: "https://www.cbinsights.com/research/report/startup-failure-reasons-top/"
}, {
  value: "4-5x",
  label: "más rápido crecen en revenue las empresas donde producto, cultura y herramientas están alineados",
  source: "McKinsey, 2020",
  url: "https://www.mckinsey.com/industries/technology-media-and-telecommunications/our-insights/developer-velocity-how-software-excellence-fuels-business-performance"
}, {
  value: "84%",
  label: "de developers ya usan herramientas de AI para programar. Solo código ya no es el diferencial.",
  source: "Stack Overflow Survey, 2025",
  url: "https://survey.stackoverflow.co/2025/ai"
}];
const SoyDev = () => {
  const {
    isAuthenticated
  } = useAuth();
  const [skillsVisible, setSkillsVisible] = useState(false);
  const skillsSectionRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setSkillsVisible(false);
    const el = skillsSectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setSkillsVisible(true);
        observer.disconnect();
      }
    }, {
      threshold: 0.15
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return <>
      <Seo />

      <main className="min-h-screen bg-background animate-fade-in">
        {/* Breadcrumb */}
        <div className="container px-4 sm:px-6 pt-6">
          <nav className="flex items-center gap-1 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors flex items-center gap-1">
              <Home className="h-3.5 w-3.5" />
              Inicio
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground font-medium">Soy Dev</span>
          </nav>
        </div>

        {/* Hero */}
        <section className="container text-center py-16 sm:py-24 px-4 sm:px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 -z-10" />

          <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
            <Code className="h-4 w-4 mr-2" />
            Para Devs
          </Badge>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 max-w-4xl mx-auto leading-tight">
            ¿Sos Dev? Convertite en Product Builder.
            <br className="hidden sm:block" />
            <span className="text-orange-500"> Es el momento.</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            El mundo cambió. AI escribe código, pero no sabe qué construir ni
            para quién. Los devs que entienden producto son los que definen el
            futuro. ¿Estás listo?
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="text-lg px-10 py-7 font-semibold shadow-lg">
              <Link to={isAuthenticated ? "/autoevaluacion" : "/auth"}>
                Comenzar evaluación gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/starterpack">
                Ver Starter Pack
                <Rocket className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Por qué Producto importa */}
        <section className="container py-12 sm:py-20 px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Por qué Producto importa para Devs
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              No se trata de dejar de programar. Se trata de entender el
              contexto completo de lo que construís.
            </p>
          </div>

          <div ref={skillsSectionRef} className="grid gap-6 sm:grid-cols-2 max-w-4xl mx-auto">
            {whyCards.map((card, index) => <SkillCard key={card.title} icon={card.icon} title={card.title} description={card.description} delay={index * 400} triggerAnimation={skillsVisible} />)}
          </div>
        </section>

        {/* Datos del mercado */}
        <section className="container py-12 sm:py-20 px-4 sm:px-6">
          <div className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 rounded-2xl border border-border/60 p-8 sm:p-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
              Los números hablan
            </h2>
            <div className="grid gap-8 sm:grid-cols-3 max-w-3xl mx-auto text-center">
              {stats.map(stat => <div key={stat.value}>
                  <div className="text-4xl sm:text-5xl font-bold text-primary mb-2">
                    {stat.value}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {stat.label}
                  </p>
                  <a href={stat.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary/60 hover:text-primary underline mt-1 inline-block">
                    Fuente: {stat.source}
                  </a>
                </div>)}
            </div>
          </div>
        </section>

        {/* Qué vas a descubrir */}
        <section className="container py-12 sm:py-20 px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Qué vas a descubrir en ProductPrepa
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Herramientas pensadas para que un perfil técnico pueda evaluar, aprender y crecer en sus habilidades de Producto.
            </p>
          </div>

          <div className="space-y-4 max-w-2xl mx-auto">
            {benefits.map((benefit, index) => <div key={index} className="flex items-start gap-4 p-4 rounded-xl bg-muted/40 border border-border/40">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <benefit.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm sm:text-base text-foreground leading-relaxed">
                  {benefit.text}
                </p>
              </div>)}
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
                <Button asChild size="lg" className="text-lg px-10 py-7 font-semibold shadow-lg">
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
    </>;
};
export default SoyDev;