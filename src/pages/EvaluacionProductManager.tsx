import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ASSESSMENT_TYPES, DOMAINS } from '@/utils/scoring';
import { evaluacionFaqs } from '@/seo/faqs/evaluacion';

/**
 * Landing pública de la evaluación.
 *
 * Existe porque /autoevaluacion es ProtectedRoute: un visitante anónimo termina
 * redirigido a /auth, así que no hay nada que indexar y la búsqueda de
 * "evaluación product manager" no tenía dónde caer. Esta ruta es la versión
 * pública, indexable, y su CTA lleva al test real.
 *
 * Sin hooks ni browser globals a propósito: la renderiza el cliente y también
 * el build (scripts/prerender/render.tsx), que es lo que hace que el HTML
 * servido traiga el texto completo. Si necesitás estado, va en otro componente.
 *
 * Los perfiles y las competencias salen de src/utils/scoring.ts, la misma
 * fuente que usa el test, para que la página no pueda prometer algo que la
 * evaluación no mide.
 *
 * Cada perfil linkea a /autoevaluacion?tipo=<perfil>. Sin sesión, ProtectedRoute
 * manda a /auth con la ubicación completa en state.from (path y query), y
 * después del login o registro el usuario cae en la evaluación que eligió.
 */
export default function EvaluacionProductManager() {
  return (
    <div className="container max-w-4xl py-16 space-y-16">
      <header className="space-y-6">
        <span className="font-handwritten text-xl text-primary/80 inline-block rotate-[-2deg]">
          cinco minutos, gratis
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.1]">
          Evaluación de Product Manager
        </h1>
        <div className="space-y-4 text-lg text-muted-foreground leading-relaxed max-w-2xl">
          <p>
            Preguntale a tres personas qué te falta para el próximo nivel y vas a tener tres
            respuestas distintas. Ninguna con datos atrás.
          </p>
          <p>
            Esta evaluación te da un diagnóstico en lugar de opiniones: un radar con tus
            competencias de Producto, dónde estás fuerte, qué te está frenando y una recomendación
            hecha a tu medida. No hace falta experiencia previa.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start gap-3">
          <Button asChild size="lg" className="text-base px-8 py-6 font-semibold">
            <Link to="/autoevaluacion">
              Hacer la evaluación gratis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Cuatro evaluaciones, una por perfil
          </h2>
          <p className="text-muted-foreground leading-relaxed max-w-2xl">
            No es el mismo test para todos. Elegís desde dónde arrancás y el diagnóstico se arma a
            tu medida.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {ASSESSMENT_TYPES.map((type) => (
            <Link
              key={type.key}
              to={`/autoevaluacion?tipo=${type.key}`}
              className="group block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Card className="h-full transition-colors group-hover:border-primary/50">
                <CardContent className="p-6 space-y-2">
                  <span
                    className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${type.accent.badge}`}
                  >
                    {type.resultTag}
                  </span>
                  <h3 className="text-lg font-semibold leading-snug pt-1">{type.title}</h3>
                  <p className="text-sm text-muted-foreground">{type.persona}</p>
                  <p className="text-sm leading-relaxed text-foreground/80">{type.promise}</p>
                  <span className="inline-flex items-center pt-2 text-sm font-semibold text-primary">
                    Empezar esta evaluación
                    <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Las competencias que mide
          </h2>
          <p className="text-muted-foreground leading-relaxed max-w-2xl">
            Cada respuesta se traduce en un puntaje por competencia. El resultado es un radar, no un
            número suelto.
          </p>
        </div>
        <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {DOMAINS.map((domain) => (
            <div key={domain.key} className="border-l-2 border-primary/30 pl-4">
              <h3 className="font-semibold text-foreground text-sm">{domain.label}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{domain.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Preguntas frecuentes</h2>
        <div className="space-y-6">
          {evaluacionFaqs.map((faq) => (
            <div key={faq.question} className="space-y-2">
              <h3 className="font-semibold text-foreground">{faq.question}</h3>
              <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border pt-10">
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-8 space-y-4 text-center">
          <h2 className="text-xl font-bold text-foreground">
            Cinco minutos ahora, o seguir adivinando
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
            El diagnóstico es gratis y queda guardado, así podés volver a mirarlo y rehacerlo más
            adelante para ver cómo te moviste.
          </p>
          <Button asChild size="lg" className="text-base px-8 py-6 font-semibold">
            <Link to="/autoevaluacion">
              Empezar la evaluación
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
