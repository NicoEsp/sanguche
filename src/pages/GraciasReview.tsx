import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Search, Mail, ArrowRight, Clock, Compass } from "lucide-react";
import { Seo } from "@/components/Seo";
import { isReturningFromCheckout } from "@/utils/checkoutReturn";
import { useMixpanelTracking } from "@/hooks/useMixpanelTracking";
import { useAuth } from "@/contexts/AuthContext";

export default function GraciasReview() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { trackEvent } = useMixpanelTracking();
  const { isAuthenticated } = useAuth();
  const hasTrackedRef = useRef(false);
  // El checkout hosteado de LemonSqueezy vuelve a la URL pelada, sin
  // success=true, así que el referrer es la única señal de compra real.
  const success = isReturningFromCheckout(searchParams.toString());

  useEffect(() => {
    if (!success || hasTrackedRef.current) return;
    hasTrackedRef.current = true;
    trackEvent("checkout_completed", {
      plan: "productastic_review",
      provider: "lemon_squeezy",
      checkout_mode: "direct_hosted",
      source: "gracias_review_page",
      is_authenticated: isAuthenticated,
    });
  }, [success, trackEvent, isAuthenticated]);

  const handleAssessmentClick = () => {
    trackEvent("gracias_review_assessment_cta_clicked", {
      cta_location: "gracias_review_cross_sell",
      is_authenticated: isAuthenticated,
    });
    navigate(isAuthenticated ? "/autoevaluacion" : "/auth");
  };

  const handlePremiumClick = () => {
    trackEvent("gracias_review_premium_cta_clicked", {
      cta_location: "gracias_review_cross_sell",
      is_authenticated: isAuthenticated,
    });
    navigate("/planes");
  };

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
        robots="noindex, follow"
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
                className="w-full bg-transparent border-emerald-500/40 text-emerald-100 hover:bg-emerald-500/15 hover:text-white hover:border-emerald-400/60"
              >
                {isAuthenticated ? "Volver al inicio" : "Crear cuenta / iniciar sesión"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {/* Cross-sell: mismo patrón que GraciasB2B, para que el review no sea un callejón sin salida. */}
            <div className="rounded-xl border border-emerald-300/20 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-4 mt-2">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
                  <Compass className="w-5 h-5 text-emerald-200" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white mb-1">Mientras esperás el informe</p>
                  <p className="text-xs text-emerald-100/70 mb-3 leading-relaxed">
                    Hacé la evaluación gratuita de tu perfil: en 5 minutos sabés en qué áreas trabajar. Y si querés acompañamiento sostenido después del review, mirá los planes Premium.
                  </p>
                  <div className="grid gap-2">
                    <Button
                      onClick={handleAssessmentClick}
                      variant="outline"
                      size="sm"
                      className="w-full h-auto whitespace-normal text-left bg-transparent border-emerald-300/50 text-emerald-100 hover:bg-emerald-500/20 hover:text-white hover:border-emerald-300/80"
                    >
                      Hacer mi evaluación gratuita
                      <ArrowRight className="w-4 h-4 ml-2 flex-shrink-0" />
                    </Button>
                    <Button
                      onClick={handlePremiumClick}
                      variant="outline"
                      size="sm"
                      className="w-full h-auto whitespace-normal text-left bg-transparent border-emerald-300/50 text-emerald-100 hover:bg-emerald-500/20 hover:text-white hover:border-emerald-300/80"
                    >
                      Ver los planes Premium
                      <ArrowRight className="w-4 h-4 ml-2 flex-shrink-0" />
                    </Button>
                  </div>
                </div>
              </div>
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
