import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Building2, Mail, Calendar, ArrowRight, Eye, Compass } from "lucide-react";
import { Seo } from "@/components/Seo";
import { useMixpanelTracking } from "@/hooks/useMixpanelTracking";
import { useAuth } from "@/contexts/AuthContext";

export default function GraciasB2B() {
  const navigate = useNavigate();
  const { trackEvent } = useMixpanelTracking();
  const { isAuthenticated, isAdmin } = useAuth();
  const hasTrackedRef = useRef(false);

  useEffect(() => {
    if (hasTrackedRef.current) return;
    // Si es admin, no emitimos checkout_completed: la página se usa para
    // previsualizar el contenido y no debería contaminar el funnel.
    if (isAdmin) {
      hasTrackedRef.current = true;
      return;
    }
    hasTrackedRef.current = true;
    trackEvent("checkout_completed", {
      plan: "productprepa_business",
      provider: "lemon_squeezy",
      checkout_mode: "direct_hosted",
      source: "gracias_b2b_page",
      is_authenticated: isAuthenticated,
    });
  }, [trackEvent, isAuthenticated, isAdmin]);

  const handleAssessmentClick = () => {
    trackEvent("gracias_b2b_assessment_cta_clicked", {
      is_authenticated: isAuthenticated,
    });
    navigate(isAuthenticated ? "/autoevaluacion" : "/auth");
  };

  const contactEmail = "nicoproducto@hey.com";

  const nextSteps = [
    {
      icon: <Mail className="w-5 h-5 text-indigo-300" />,
      title: "Te llega el comprobante por mail",
      detail: "LemonSqueezy te envía la factura del pago.",
    },
    {
      icon: <Calendar className="w-5 h-5 text-indigo-300" />,
      title: "Te contacto para agendar el kickoff",
      detail: `En las próximas 24 hs te escribo a tu mail para coordinar la primera reunión de diagnóstico con el líder del equipo.`,
    },
    {
      icon: <Building2 className="w-5 h-5 text-indigo-300" />,
      title: "Armamos el plan y arrancamos",
      detail: "Después del diagnóstico inicial te paso el plan de capacitación a medida y arrancamos con las sesiones grupales.",
    },
  ];

  return (
    <>
      <Seo
        title="¡Gracias! · ProductPrepa for B2B"
        description="Confirmamos tu reserva. Mirá los próximos pasos para arrancar la capacitación del equipo."
      />

      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-blue-950 flex flex-col items-center justify-center p-4 text-white gap-3">
        {isAdmin && (
          <div className="max-w-2xl w-full flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-500/10 px-4 py-2 text-amber-100 text-xs">
            <Eye className="w-4 h-4" />
            <span><strong>Vista de admin</strong> · no se trackea checkout_completed en esta visita.</span>
          </div>
        )}
        <Card className="max-w-2xl w-full bg-gradient-to-br from-indigo-950/80 via-indigo-900/70 to-blue-950/80 border-indigo-500/30 text-white">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-indigo-500/15 rounded-full flex items-center justify-center border border-indigo-500/30">
              <CheckCircle2 className="w-10 h-10 text-indigo-300" />
            </div>
            <CardTitle className="text-3xl bg-gradient-to-r from-white via-indigo-100 to-blue-200 bg-clip-text text-transparent">
              ¡Cupo reservado!
            </CardTitle>
            <CardDescription className="text-indigo-100/80 text-lg">
              Recibí tu pago de ProductPrepa for B2B. Ahora seguimos por mail para coordinar el kickoff con el equipo.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-indigo-200">Próximos pasos</h4>
              <ol className="space-y-4">
                {nextSteps.map((step, idx) => (
                  <li key={idx} className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-sm font-semibold text-indigo-200">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {step.icon}
                        <span className="font-semibold text-white">{step.title}</span>
                      </div>
                      <p className="text-sm text-indigo-100/70 leading-relaxed">{step.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4">
              <p className="text-sm text-indigo-100/80">
                <strong className="text-white">Para acelerar el kickoff:</strong> respondé al mail de confirmación con el tamaño del equipo, la seniority promedio y dos o tres objetivos de negocio que quieran trabajar.
              </p>
            </div>

            <div className="grid gap-3 pt-2">
              <Button
                onClick={() => (window.location.href = `mailto:${contactEmail}?subject=Kickoff%20ProductPrepa%20for%20B2B`)}
                size="lg"
                className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-400 hover:to-blue-400 text-white"
              >
                <Mail className="w-4 h-4 mr-2" />
                Adelantar contexto por mail
              </Button>

              <Button
                onClick={() => navigate(isAuthenticated ? "/" : "/auth")}
                variant="outline"
                size="lg"
                className="w-full border-indigo-500/30 text-indigo-100 hover:bg-indigo-500/10 hover:text-white"
              >
                {isAuthenticated ? "Volver al inicio" : "Crear cuenta / iniciar sesión"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <div className="rounded-xl border border-indigo-300/20 bg-gradient-to-br from-indigo-500/10 to-blue-500/5 p-4 mt-2">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
                  <Compass className="w-5 h-5 text-indigo-200" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white mb-1">¿Llegaste por curiosidad?</p>
                  <p className="text-xs text-indigo-100/70 mb-3 leading-relaxed">
                    Si todavía no conocés ProductPrepa, podés empezar por una autoevaluación gratuita de tu perfil PM. En 10 minutos sabés en qué áreas trabajar.
                  </p>
                  <Button
                    onClick={handleAssessmentClick}
                    variant="outline"
                    size="sm"
                    className="border-indigo-300/40 text-indigo-100 hover:bg-indigo-500/20 hover:text-white"
                  >
                    Hacer mi autoevaluación gratuita
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>

            <p className="text-xs text-center text-indigo-200/60 pt-2 border-t border-indigo-500/10">
              ¿Dudas o algo no llegó? Escribinos a{" "}
              <a href={`mailto:${contactEmail}`} className="text-indigo-200 hover:text-white underline">
                {contactEmail}
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
