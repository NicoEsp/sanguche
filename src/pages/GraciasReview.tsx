import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Search, Mail, ArrowRight, Clock } from "lucide-react";
import { Seo } from "@/components/Seo";
import { useMixpanelTracking } from "@/hooks/useMixpanelTracking";
import { useAuth } from "@/contexts/AuthContext";

export default function GraciasReview() {
  const navigate = useNavigate();
  const { trackEvent } = useMixpanelTracking();
  const { isAuthenticated } = useAuth();
  const hasTrackedRef = useRef(false);

  useEffect(() => {
    if (hasTrackedRef.current) return;
    hasTrackedRef.current = true;
    trackEvent("checkout_completed", {
      plan: "productastic_review",
      provider: "lemon_squeezy",
      checkout_mode: "direct_hosted",
      source: "gracias_review_page",
      is_authenticated: isAuthenticated,
    });
  }, [trackEvent, isAuthenticated]);

  const reviewEmail = "nicoproducto@hey.com";

  const nextSteps = [
    {
      icon: <Mail className="w-5 h-5 text-emerald-300" />,
      title: "Te llega el comprobante por mail",
      detail: "LemonSqueezy te envía la factura del pago.",
    },
    {
      icon: <Search className="w-5 h-5 text-emerald-300" />,
      title: "Mandame los materiales del review",
      detail: `Respondé al mail de confirmación (o escribime a ${reviewEmail}) con: link a tu producto, research que hiciste, hipótesis principales y la decisión de producto que querés validar.`,
    },
    {
      icon: <Clock className="w-5 h-5 text-emerald-300" />,
      title: "En 72 hs recibís el informe",
      detail: "Lo trabajo de manera asíncrona y te lo mando con recomendaciones accionables paso a paso.",
    },
  ];

  return (
    <>
      <Seo
        title="¡Gracias por tu compra! · Productastic Review"
        description="Tu pago fue confirmado. Mirá los próximos pasos para arrancar tu Productastic Review."
      />

      <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 flex items-center justify-center p-4 text-white">
        <Card className="max-w-2xl w-full bg-gradient-to-br from-emerald-950/80 via-emerald-900/70 to-teal-950/80 border-emerald-500/30 text-white">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-emerald-500/15 rounded-full flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 className="w-10 h-10 text-emerald-300" />
            </div>
            <CardTitle className="text-3xl bg-gradient-to-r from-white via-emerald-100 to-teal-200 bg-clip-text text-transparent">
              ¡Gracias por tu compra!
            </CardTitle>
            <CardDescription className="text-emerald-100/80 text-lg">
              Recibí tu pago del Productastic Review. Ahora seguimos por mail para coordinar el envío de materiales.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-emerald-200">Próximos pasos</h4>
              <ol className="space-y-4">
                {nextSteps.map((step, idx) => (
                  <li key={idx} className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-sm font-semibold text-emerald-200">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {step.icon}
                        <span className="font-semibold text-white">{step.title}</span>
                      </div>
                      <p className="text-sm text-emerald-100/70 leading-relaxed">{step.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
              <p className="text-sm text-emerald-100/80">
                <strong className="text-white">Tip:</strong> Cuanto más contexto me pases (research, métricas, decisiones tomadas), más útil va a ser la review. No hace falta que esté ordenado: yo me encargo de eso.
              </p>
            </div>

            <div className="grid gap-3 pt-2">
              <Button
                onClick={() => (window.location.href = `mailto:${reviewEmail}?subject=Materiales%20para%20mi%20Productastic%20Review`)}
                size="lg"
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white"
              >
                <Mail className="w-4 h-4 mr-2" />
                Enviar materiales por mail
              </Button>

              <Button
                onClick={() => navigate(isAuthenticated ? "/" : "/auth")}
                variant="outline"
                size="lg"
                className="w-full border-emerald-500/30 text-emerald-100 hover:bg-emerald-500/10 hover:text-white"
              >
                {isAuthenticated ? "Volver al inicio" : "Crear cuenta / iniciar sesión"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <p className="text-xs text-center text-emerald-200/60 pt-2 border-t border-emerald-500/10">
              ¿Dudas o algo no llegó? Escribime a{" "}
              <a href={`mailto:${reviewEmail}`} className="text-emerald-200 hover:text-white underline">
                {reviewEmail}
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
