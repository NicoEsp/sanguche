import { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useMixpanelTracking } from "@/hooks/useMixpanelTracking";
import { Quote } from "lucide-react";

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  initials: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote: "Pasé de no tener estructura de priorización a liderar el roadmap de mi equipo en 8 semanas.",
    name: "Martín R.",
    role: "PM en startup fintech, Buenos Aires",
    initials: "MR",
  },
  {
    quote: "En 3 meses construí mi primer proceso de discovery real. Hoy lo usa todo mi equipo de producto.",
    name: "Camila S.",
    role: "Product Manager en SaaS B2B, CDMX",
    initials: "CS",
  },
  {
    quote: "La mentoría me ayudó a pasar de IC a liderar un equipo de 4 PMs en menos de 6 meses.",
    name: "Tomás L.",
    role: "Head of Product en ecommerce, Santiago",
    initials: "TL",
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
      <div className="max-w-6xl mx-auto">
        <h3 className="text-lg font-semibold text-center text-muted-foreground mb-6">
          Lo que dicen quienes ya están creciendo con ProductPrepa
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <Card key={t.name} className="bg-muted/30 border-muted">
              <CardContent className="pt-6 pb-5 px-5 flex flex-col gap-4">
                <div className="flex items-start gap-2">
                  <Quote className="w-4 h-4 text-primary/40 flex-shrink-0 mt-0.5 rotate-180" />
                  <p className="text-sm leading-relaxed italic">
                    {t.quote}
                  </p>
                </div>
                <div className="flex items-center gap-3 mt-auto">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                      {t.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium leading-tight">{t.name}</p>
                    <p className="text-xs text-muted-foreground leading-tight">
                      {t.role}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
