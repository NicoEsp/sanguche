import { Link } from "react-router-dom";
import type { CoursePublic } from "@/seo/contentSeo";
import { FALLBACK_PRICES, type PlanPricing, type PricingKey } from "@/constants/planesContent";

interface CursosInfoSeoContentProps {
  courses: CoursePublic[];
  prices: Record<PricingKey, PlanPricing>;
}

/**
 * Versión estática de /cursos-info para el HTML servido.
 *
 * Alcance acotado a propósito: el catálogo real, los precios y las vías de
 * compra. La página interactiva tiene además bastante copy de venta entrelazado
 * con el checkout y el formulario de lista de espera, y sacarlo de ahí obligaba
 * a refactorizar una página por la que pasa plata. Esto responde lo que
 * realmente se le pregunta a un asistente —qué cursos hay y cuánto salen— sin
 * tocar nada de eso.
 *
 * Los cursos salen de la misma consulta a Supabase que ya hace el prerender
 * para /cursos/:slug, así que no hay contenido duplicado que mantener.
 */
export function CursosInfoSeoContent({ courses, prices }: CursosInfoSeoContentProps) {
  const priceOf = (key: PricingKey) => (prices[key] ?? FALLBACK_PRICES[key]).formatted;

  return (
    <main className="container max-w-4xl py-16 space-y-12">
      <header className="space-y-4">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Cursos de Producto en ProductPrepa
        </h1>
        <p className="text-lg text-muted-foreground">
          Cursos especializados para Product Builders, con videos cortos, ejercicios prácticos y
          acceso de por vida. Se compran con pago único, sin suscripción ni renovaciones.
        </p>
      </header>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Cursos disponibles</h2>
        {courses.length === 0 ? (
          <p className="text-muted-foreground">
            Por el momento no hay cursos publicados. Escribinos a nicoproducto@hey.com para saber
            cuándo sale el próximo.
          </p>
        ) : (
          courses.map((course) => (
            <article key={course.slug} className="rounded-lg border bg-card p-6 space-y-2">
              <h3 className="text-xl font-semibold">
                <Link to={`/cursos/${course.slug}`} className="underline">
                  {course.title}
                </Link>
              </h3>
              {course.description && (
                <p className="text-muted-foreground">{course.description}</p>
              )}
              {course.outcome && (
                <p className="text-sm">
                  <strong>Qué te llevás:</strong> {course.outcome}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                {course.lessons.length} {course.lessons.length === 1 ? "lección" : "lecciones"}
                {course.duration_minutes ? ` · ${course.duration_minutes} minutos` : ""}
              </p>
            </article>
          ))
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold">Opciones de compra</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Curso de Estrategia de Producto — {priceOf("curso_estrategia")}, pago único</li>
          <li>Todos los cursos (bundle) — {priceOf("cursos_all")}, pago único</li>
          <li>
            Plan RePremium — {priceOf("repremium")} por mes, incluye el acceso completo a todos los
            cursos además de dos sesiones de mentoría 1:1
          </li>
        </ul>
        <p className="text-sm text-muted-foreground">
          Los precios están en pesos argentinos (ARS). El pago único da acceso de por vida al
          contenido del curso.
        </p>
        <p className="text-sm">
          <Link to="/planes" className="underline">
            Ver todos los planes y precios
          </Link>
        </p>
      </section>

      <footer className="text-sm text-muted-foreground">
        <p>
          ¿Dudas antes de arrancar? Escribinos a{" "}
          <a href="mailto:nicoproducto@hey.com" className="underline">
            nicoproducto@hey.com
          </a>
          .
        </p>
      </footer>
    </main>
  );
}
