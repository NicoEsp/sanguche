import { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useMixpanelTracking } from "@/hooks/useMixpanelTracking";
import { Quote, Linkedin } from "lucide-react";

interface Testimonial {
  quote: string;
  name: string;
  initials: string;
  linkedinUrl: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "ProductPrepa es mi GPS en medio del laberinto de herramientas, metodologías y sobreinformación actual. Me ayuda a hacer foco en lo que realmente aporta valor a mi carrera y mis proyectos. Además, siempre es un gusto charlar con Nico y recibir sus recomendaciones.",
    name: "Celeste Palacios",
    initials: "CP",
    linkedinUrl: "https://www.linkedin.com/in/celestepalacios/",
  },
  {
    quote:
      "ProductPrepa me ayudó a destrabar proyectos que tenía en mente y que no lograba avanzar por falta de claridad y guía, algo que encontré en Nico. Gracias a su acompañamiento, su conocimiento, su empatía y también su gran sentido del humor, el aprendizaje a través de casos prácticos tuvo mucho más valor para mí. Me animó a presentar mis ideas, a confiar más en mí y a enfocarme en generar impacto tanto en el negocio como en mi desarrollo como PO.",
    name: "Natali Mendoza",
    initials: "NM",
    linkedinUrl: "https://www.linkedin.com/in/natalimendoza/",
  },
];

export function SocialProofBlock() {
  const { trackEvent } = useMixpanelTracking();
  const sectionRef = useRef<HTMLElement>(null);
  const tracked = useRef(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !tracked.current) {
          tracked.current = true;
          trackEvent("social_proof_viewed", {
            testimonial_count: TESTIMONIALS.length,
          });
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [trackEvent]);

  return (
    <section ref={sectionRef} className="px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <h3 className="text-lg font-semibold text-center text-muted-foreground mb-6">
          Lo que dicen quienes ya están creciendo con ProductPrepa
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          {TESTIMONIALS.map((t) => (
            <Card key={t.name} className="bg-muted/30 border-muted">
              <CardContent className="pt-6 pb-5 px-5 flex flex-col gap-4 h-full">
                <div className="flex items-start gap-2">
                  <Quote className="w-4 h-4 text-primary/40 flex-shrink-0 mt-0.5 rotate-180" />
                  <p className="text-sm leading-relaxed italic">{t.quote}</p>
                </div>
                <div className="flex items-center gap-3 mt-auto">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                      {t.initials}
                    </AvatarFallback>
                  </Avatar>
                  <a
                    href={t.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      trackEvent("social_proof_linkedin_click", {
                        name: t.name,
                      })
                    }
                    className="inline-flex items-center gap-1.5 text-sm font-medium leading-tight hover:text-primary transition-colors"
                  >
                    {t.name}
                    <Linkedin
                      className="w-3.5 h-3.5 text-muted-foreground"
                      aria-label="LinkedIn"
                    />
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
