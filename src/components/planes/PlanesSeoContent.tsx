import { Link } from "react-router-dom";
import {
  B2B_PROGRAM,
  FALLBACK_PRICES,
  PLANES_FAQS,
  PRODUCTASTIC_REVIEW,
  SUBSCRIPTION_PLANS,
  type PlanPricing,
  type PricingKey
} from "@/constants/planesContent";

interface PlanesSeoContentProps {
  prices: Record<PricingKey, PlanPricing>;
}

/**
 * Versión estática de /planes, la que el build escribe dentro del #root.
 *
 * Por qué existe: /planes es una SPA y su HTML servido no tenía una sola
 * mención de un precio ni de la palabra "Premium" — todo lo pinta React en
 * runtime. Googlebot ejecuta JS y lo ve igual, pero los fetchers de los
 * asistentes (GPTBot, ClaudeBot, PerplexityBot, ChatGPT-User) no, así que para
 * ellos la página de precios estaba en blanco.
 *
 * Es una vista aparte de la página interactiva y no la misma: los CTA reales
 * dependen de useAuth/useSubscription y del checkout, que no se pueden
 * renderizar en build. Lo que no se duplica es el contenido — planes, features,
 * precios y FAQs salen de constants/planesContent, así que las dos vistas no
 * pueden decir cosas distintas.
 *
 * Sin hooks ni browser globals (ver scripts/prerender/render.tsx). El único
 * contexto que necesita es el Router, por los <Link>.
 */
export function PlanesSeoContent({ prices }: PlanesSeoContentProps) {
  const priceOf = (key: PricingKey) => (prices[key] ?? FALLBACK_PRICES[key]).formatted;

  return (
    <main className="container max-w-5xl py-16 space-y-16">
      <header className="space-y-4">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Tu carrera en Producto, con acompañamiento humano.
        </h1>
        <p className="text-lg text-muted-foreground">
          Evaluación, mentoría 1:1 y un Career Path que construís con alguien que lleva más de
          diez años en Producto.
        </p>
        <p className="text-sm text-muted-foreground">
          Todos los precios están en pesos argentinos (ARS). Las suscripciones se cancelan
          cuando quieras, sin permanencia.
        </p>
      </header>

      <section className="space-y-8">
        <h2 className="text-2xl font-bold">Planes de suscripción</h2>

        {SUBSCRIPTION_PLANS.map((plan) => (
          <article key={plan.key} className="rounded-lg border bg-card p-6 space-y-3">
            <h3 className="text-xl font-semibold">
              {plan.name} — {plan.priceKey ? priceOf(plan.priceKey) : "$0"} por mes
            </h3>
            <p className="text-muted-foreground">{plan.description}</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              {plan.features.map((feature) => (
                <li key={feature.text}>{feature.text}</li>
              ))}
            </ul>
            {plan.sessionsNote && (
              <p className="text-xs text-muted-foreground">{plan.sessionsNote}</p>
            )}
          </article>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold">Cursos con pago único</h2>
        <p className="text-muted-foreground">
          Además de los planes de suscripción, ProductPrepa tiene cursos especializados con
          acceso de por vida. Los usuarios RePremium tienen incluido el acceso a todos los cursos.
        </p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Curso de Estrategia de Producto — {priceOf("curso_estrategia")}</li>
          <li>Todos los cursos (bundle) — {priceOf("cursos_all")}</li>
        </ul>
        <p className="text-sm">
          <Link to="/cursos-info" className="underline">
            Ver los cursos disponibles
          </Link>
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold">
          {PRODUCTASTIC_REVIEW.name} — {PRODUCTASTIC_REVIEW.price} ({PRODUCTASTIC_REVIEW.badge.toLowerCase()})
        </h2>
        <p className="text-muted-foreground">{PRODUCTASTIC_REVIEW.descriptionLines.join(" ")}</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          {PRODUCTASTIC_REVIEW.features.map((feature) => (
            <li key={feature.text}>{feature.text}</li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">{PRODUCTASTIC_REVIEW.priceNote}.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold">{B2B_PROGRAM.name} — precio a consultar</h2>
        <p className="text-muted-foreground">{B2B_PROGRAM.descriptionLines.join(" ")}</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          {B2B_PROGRAM.features.map((feature) => (
            <li key={feature.text}>{feature.text}</li>
          ))}
        </ul>
        <p className="text-sm">
          <Link to="/empresas" className="underline">
            Ver el programa completo para empresas
          </Link>
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Preguntas frecuentes</h2>
        {PLANES_FAQS.map((faq) => (
          <article key={faq.question} className="space-y-1">
            <h3 className="font-semibold">{faq.question}</h3>
            <p className="text-sm text-muted-foreground">{faq.answer}</p>
          </article>
        ))}
      </section>

      <footer className="space-y-2 text-sm text-muted-foreground">
        <p>
          Todos los planes de suscripción se pueden cancelar cuando quieras. Sin compromisos.
        </p>
        <p>
          ¿Dudas? Escribinos a{" "}
          <a href="mailto:nicoproducto@hey.com" className="underline">
            nicoproducto@hey.com
          </a>
          .
        </p>
        <p>
          ¿Todavía no sabés qué plan te sirve?{" "}
          <Link to="/evaluacion-product-manager" className="underline">
            Hacé la evaluación gratuita
          </Link>
          .
        </p>
      </footer>
    </main>
  );
}
