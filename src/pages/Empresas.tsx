import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Seo } from "@/components/Seo";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DirectCheckoutButton } from "@/components/planes/DirectCheckoutButton";
import { empresasFaqs } from "@/seo/faqs/empresas";
import {
  Home,
  ChevronRight,
  ArrowRight,
  ArrowDown,
  Check,
  X,
} from "lucide-react";

/**
 * Landing /empresas — ProductPrepa for Business.
 * Tono editorial/consultivo (No template SaaS).
 * Acento de marca indigo, anotaciones manuscritas con la fuente Caveat
 * (font-handwritten) y bloque de reserva con el gradiente indigo ya
 * establecido en el B2BModal. CTA principal = checkout directo.
 */

const RESERVA_ID = "reservar";

// Ejes del temario. Cada uno linkea a un artículo del blog (autoridad + SEO interno).
const ejes = [
  {
    key: "estrategia",
    n: "01",
    title: "Estrategia de producto",
    summary:
      "Saber si el equipo tiene una Estrategia real o está improvisando con buena intención.",
    points: [
      "Cómo se ve una Estrategia de Producto que el equipo entiende y usa para decidir.",
      "Conectar la visión con lo que se va construyendo.",
      "Tener señales de que están operando sin un rumbo claro.",
    ],
    article: {
      to: "/blog/estrategia-de-producto-como-saber-si-tu-startup-la-tiene-o-si-solo-esta-improvisando",
      label: "Estrategia: ¿la tenés o estás improvisando?",
    },
  },
  {
    key: "discovery",
    n: "02",
    title: "Discovery de producto",
    summary:
      "Diferenciar un discovery que cambia rumbos de uno vacio que solo valida las decisiones.",
    points: [
      "Cómo investigar antes de comprometer tiempo de desarrollo.",
      "Hablar con usuarios sin sesgar las respuestas.",
      "Cuándo un discovery se termina y empieza el delivery.",
    ],
    article: {
      to: "/blog/discovery-de-producto-que-es-por-que-importa-y-como-saber-si-el-tuyo-es-real-o-decorativo",
      label: "Discovery real vs. decorativo",
    },
  },
  {
    key: "ejecucion",
    n: "03",
    title: "Priorización y ejecución",
    summary:
      "Dejar de medir el trabajo por cantidad de features y empezar a moverse por impacto.",
    points: [
      "Decidir qué va primero cuando todo parece urgente.",
      "Outputs vs. outcomes: trabajar mucho sin mover la aguja.",
      "Criterios de priorización que el equipo (y vos) puedan defender.",
    ],
    article: {
      to: "/blog/outputs-vs-outcomes-por-que-tu-equipo-trabaja-mucho-y-mueve-poco-la-aguja",
      label: "Outputs vs. outcomes",
    },
  },
  {
    key: "ia",
    n: "04",
    title: "Producto en la era de la IA",
    summary:
      "Qué cambia y qué no en el trabajo de Producto cuando la IA acelera la construcción.",
    points: [
      "Dónde la IA ayuda al equipo y dónde es una trampa.",
      "El criterio de producto como el diferencial que no se automatiza.",
      "Cómo adaptar el proceso del equipo sin romperlo.",
    ],
    article: {
      to: "/blog/product-management-en-tiempos-de-ia-que-cambia-que-no-cambia-y-que-tenes-que-hacer-al-respecto",
      label: "Producto en tiempos de IA",
    },
  },
] as const;

const incluye = [
  "Diagnóstico inicial del equipo y de las áreas a fortalecer.",
  "Temario a medida, armado sobre los desafíos actuales.",
  "Hasta 3 sesiones grupales en vivo con el equipo.",
  "Acceso de todo el equipo a los cursos de ProductPrepa.",
  "Reporte de avance para el líder del área.",
];

const noEs = [
  "No es una consultoría sobre el roadmap interno de la empresa.",
  "No reemplaza al PM ni al líder del área.",
  "No es coaching individual de carrera.",
];

const pasos = [
  {
    n: "1",
    title: "Reservás el cupo",
    text: "Desde el checkout asegurás el lugar para tu equipo.",
  },
  {
    n: "2",
    title: "Alineamos",
    text: "Te contacto para entender al equipo, su contexto y los objetivos del programa.",
  },
  {
    n: "3",
    title: "Armamos y arrancamos",
    text: "Diseño el temario a medida y empezamos las sesiones en el lapso que definamos.",
  },
] as const;

// Nota manuscrita reutilizable (estilo "al margen de una propuesta").
const Margin = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => (
  <span
    className={`font-handwritten text-indigo-500/80 dark:text-indigo-300/80 leading-none ${className}`}
    aria-hidden="true"
  >
    {children}
  </span>
);

const Empresas = () => {
  const [activeEje, setActiveEje] = useState<string>(ejes[0].key);
  const eje = ejes.find((e) => e.key === activeEje) ?? ejes[0];

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
            <span className="text-foreground font-medium">Empresas</span>
          </nav>
        </div>

        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="container px-4 sm:px-6 pt-14 sm:pt-20 pb-12 sm:pb-16">
          <div className="grid lg:grid-cols-[1.5fr_1fr] gap-12 lg:gap-16 items-start">
            {/* Columna editorial */}
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300 mb-6">
                ProductPrepa <span className="text-muted-foreground">for Business</span>
              </p>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] text-foreground">
                Un programa de Producto{" "}
                <span className="relative whitespace-nowrap">
                  a medida
                  <svg
                    className="absolute -bottom-2 left-0 w-full text-indigo-500/60"
                    viewBox="0 0 200 12"
                    fill="none"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 8c40-5 120-6 196-3"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>{" "}
                para tu equipo.
              </h1>

              <p className="mt-8 text-lg sm:text-xl text-muted-foreground leading-relaxed">
                Capacitación en Producto para empresas que quieren llevar a un
                grupo, un área o sus líderes a tomar mejores decisiones. Temario
                pensado para los desafíos puntuales de{" "}
                <span className="text-foreground font-medium">tu equipo</span>, no es
                un curso enlatado.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row sm:items-center gap-4">
                <a
                  href={`#${RESERVA_ID}`}
                  className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-xl bg-foreground text-background font-semibold transition-transform hover:scale-[1.02]"
                >
                  Reservar un cupo
                  <ArrowDown className="h-4 w-4" />
                </a>
                <a
                  href='mailto:nicoproducto@hey.com?subject=ProductPrepa%20for%20Business'
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  o agendá una llamada antes
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            {/* Ficha del programa — "sello" de propuesta, no card genérica */}
            <aside className="lg:mt-3">
              <div className="relative border border-border rounded-2xl bg-muted/30 p-7">
                <Margin className="absolute -top-5 -right-2 text-2xl rotate-6">
                  one-time ·<br />sin suscripción
                </Margin>
                <dl className="divide-y divide-border">
                  <div className="flex items-baseline justify-between py-3 first:pt-0">
                    <dt className="text-sm text-muted-foreground">Formato</dt>
                    <dd className="text-sm font-medium text-foreground text-right">
                      Sesiones grupales en vivo
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between py-3">
                    <dt className="text-sm text-muted-foreground">Alcance</dt>
                    <dd className="text-sm font-medium text-foreground text-right">
                      Hasta 3 sesiones
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between py-3">
                    <dt className="text-sm text-muted-foreground">Temario</dt>
                    <dd className="text-sm font-medium text-foreground text-right">
                      A medida del equipo
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between py-3 last:pb-0">
                    <dt className="text-sm text-muted-foreground">Para</dt>
                    <dd className="text-sm font-medium text-foreground text-right">
                      Equipos, áreas y líderes
                    </dd>
                  </div>
                </dl>
              </div>
            </aside>
          </div>
        </section>

        {/* ── 01 · El problema ─────────────────────────────────── */}
        <section className="border-t border-border bg-muted/20">
          <div className="container px-4 sm:px-6 py-16 sm:py-24">
            <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-10 lg:gap-16">
              <div>
                <span className="text-sm font-mono text-indigo-600 dark:text-indigo-300">
                  01
                </span>
                <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  El equipo trabaja mucho.
                  <br />
                  ¿Mueve la aguja?
                </h2>
              </div>
              <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                <p>
                  La mayoría de los equipos no tiene un problema de esfuerzo:
                  tiene una falta de visión. Se construyen features, se
                  cierran sprints, se hace mucho y aun así los números no se
                  mueven y nadie sabe del todo por qué pasa esto.
                </p>
                <blockquote className="border-l-2 border-indigo-500/60 pl-5 text-foreground font-medium">
                  El diferencial hoy en día es saber qué vale la
                  pena construir, y por qué hacerlo ahora.
                </blockquote>
                <p>
                  Estrategia, discovery, priorización se aprenden y se
                  entrenan. Un equipo con visión de Producto decide mejor sin
                  que lo supervisen. Ese es el objetivo de este programa.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 02 · Armá tu temario (interactivo) ───────────────── */}
        <section className="container px-4 sm:px-6 py-16 sm:py-24">
          <div className="max-w-2xl">
            <span className="text-sm font-mono text-indigo-600 dark:text-indigo-300">
              02
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Armá tu temario
            </h2>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              Estos son los ejes sobre los que solemos trabajar. El programa se
              construye combinando los que tu equipo necesita. Elegí uno para ver
              qué incluye.
            </p>
          </div>

          <div className="mt-10 grid lg:grid-cols-[0.9fr_1.1fr] gap-6 lg:gap-10 items-start">
            {/* Selector de ejes */}
            <div className="flex flex-col gap-1.5">
              {ejes.map((e) => {
                const isActive = e.key === activeEje;
                return (
                  <button
                    key={e.key}
                    type="button"
                    onClick={() => setActiveEje(e.key)}
                    aria-pressed={isActive}
                    className={`group flex items-baseline gap-4 text-left rounded-xl px-5 py-4 transition-colors ${
                      isActive
                        ? "bg-indigo-500/10 ring-1 ring-indigo-500/30"
                        : "hover:bg-muted"
                    }`}
                  >
                    <span
                      className={`text-sm font-mono ${
                        isActive
                          ? "text-indigo-600 dark:text-indigo-300"
                          : "text-muted-foreground"
                      }`}
                    >
                      {e.n}
                    </span>
                    <span
                      className={`text-base sm:text-lg font-semibold ${
                        isActive ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {e.title}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Detalle del eje activo */}
            <div className="rounded-2xl border border-border bg-card p-7 sm:p-9">
              <p className="text-lg sm:text-xl text-foreground font-medium leading-snug">
                {eje.summary}
              </p>
              <ul className="mt-6 space-y-3">
                {eje.points.map((p) => (
                  <li
                    key={p}
                    className="flex items-start gap-3 text-muted-foreground"
                  >
                    <Check className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              <Link
                to={eje.article.to}
                className="mt-7 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-300 hover:gap-2.5 transition-all"
              >
                Leé más: {eje.article.label}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── 03 · Qué incluye / Qué NO es ─────────────────────── */}
        <section className="border-t border-border bg-muted/20">
          <div className="container px-4 sm:px-6 py-16 sm:py-24">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
              <div>
                <span className="text-sm font-mono text-indigo-600 dark:text-indigo-300">
                  03
                </span>
                <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  Qué incluye el programa
                </h2>
                <ul className="mt-8 space-y-5">
                  {incluye.map((item, i) => (
                    <li key={item} className="flex items-start gap-4">
                      <span className="font-mono text-sm text-indigo-600 dark:text-indigo-300 pt-0.5 w-6 shrink-0">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-foreground leading-relaxed">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="lg:pt-10">
                <div className="relative rounded-2xl border border-dashed border-border p-7">
                  <Margin className="absolute -top-5 left-5 text-xl -rotate-3 bg-muted/20 px-2">
                    seamos honestos
                  </Margin>
                  <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                    Qué NO es esto
                  </p>
                  <ul className="space-y-3">
                    {noEs.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-3 text-muted-foreground"
                      >
                        <X className="h-4 w-4 text-muted-foreground/60 shrink-0 mt-1" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-5 text-sm text-muted-foreground">
                    ¿Buscás mentoría individual? Mirá los planes{" "}
                    <Link
                      to="/planes"
                      className="text-indigo-600 dark:text-indigo-300 underline underline-offset-2 font-medium"
                    >
                      Premium o RePremium
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 04 · Cómo sigue ──────────────────────────────────── */}
        <section className="container px-4 sm:px-6 py-16 sm:py-24">
          <div className="max-w-2xl">
            <span className="text-sm font-mono text-indigo-600 dark:text-indigo-300">
              04
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Cómo seguimos
            </h2>
          </div>
          <ol className="mt-10 grid gap-px sm:grid-cols-3 bg-border rounded-2xl overflow-hidden border border-border">
            {pasos.map((paso) => (
              <li key={paso.n} className="bg-background p-7 sm:p-8">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center h-9 w-9 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 font-semibold">
                    {paso.n}
                  </span>
                  <h3 className="text-lg font-semibold text-foreground">
                    {paso.title}
                  </h3>
                </div>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  {paso.text}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Reserva (checkout) — gradiente de marca ──────────── */}
        <section id={RESERVA_ID} className="container px-4 sm:px-6 pb-20 sm:pb-28 scroll-mt-20">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-indigo-900 to-blue-950 text-white p-8 sm:p-14">
            <div className="grid lg:grid-cols-[1.2fr_1fr] gap-10 lg:gap-16 items-center">
              <div>
                <Margin className="text-indigo-300/80 text-xl block mb-3 -rotate-2">
                  empecemos por acá ↓
                </Margin>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-blue-200 bg-clip-text text-transparent">
                  Reservá el cupo para tu equipo
                </h2>
                <p className="mt-5 text-indigo-100/80 text-lg leading-relaxed max-w-md">
                  Asegurás el lugar y enseguida te contacto para entender al
                  equipo y armar el temario. El programa arranca recién cuando
                  esté alineado a su contexto.
                </p>
                <p className="mt-6 text-sm text-indigo-200/60">
                  ¿Preferís hablar antes? Escribime a{" "}
                  <a
                    href='mailto:nicoproducto@hey.com?subject=ProductPrepa%20for%20Business'
                    className="text-indigo-100 hover:text-white underline underline-offset-2"
                  >
                    nicoproducto@hey.com
                  </a>{" "}
                  con el asunto «ProductPrepa for Business».
                </p>
              </div>

              <div className="rounded-2xl bg-white/5 border border-white/10 p-6 sm:p-7 backdrop-blur-sm">
                <DirectCheckoutButton
                  plan="productprepa_business"
                  buttonText="Reservar mi cupo B2B"
                  emailLabel="Email de contacto del equipo"
                  className="w-full h-12 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-400 hover:to-blue-400 text-white font-semibold shadow-lg shadow-indigo-900/30 border-0 rounded-xl transition-all duration-300 hover:scale-[1.02]"
                />
                <p className="mt-4 text-xs text-center text-indigo-200/50">
                  One-time · sin suscripción · hasta 3 sesiones
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────── */}
        <section className="border-t border-border bg-muted/20">
          <div className="container px-4 sm:px-6 py-16 sm:py-24">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground text-center">
                Preguntas frecuentes
              </h2>
              <Accordion type="single" collapsible className="mt-10 w-full">
                {empresasFaqs.map((faq, i) => (
                  <AccordionItem key={i} value={`faq-${i}`}>
                    <AccordionTrigger className="text-left text-base font-medium">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default Empresas;
