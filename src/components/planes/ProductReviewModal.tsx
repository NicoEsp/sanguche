import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Check, X, Search } from "lucide-react";
import { useMixpanelTracking } from "@/hooks/useMixpanelTracking";
import { LemonSqueezyCheckout } from "@/components/LemonSqueezyCheckout";

interface ProductReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProductReviewModal = ({ open, onOpenChange }: ProductReviewModalProps) => {
  const { trackEvent } = useMixpanelTracking();

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      trackEvent("productastic_review_modal_opened");
    } else {
      trackEvent("productastic_review_modal_closed");
    }
    onOpenChange(isOpen);
  };

  const reviewItems = [
    "Tu research: ¿cómo investigaste? ¿qué encontraste?",
    "Tus hipótesis: ¿están bien formuladas? ¿son testeables?",
    "Decisiones de producto: ¿por qué elegiste ese camino?",
    "Flujos críticos y priorización",
    "Recomendaciones accionables para los próximos pasos",
  ];

  const notReviewItems = [
    "No opino sobre tu producto porque sí",
    "No es una auditoría técnica ni de código",
    "No reemplaza un discovery completo",
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white border-emerald-500/30 sm:rounded-2xl">
        <DialogHeader className="text-center items-center">
          <div className="mx-auto mb-3 w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Search className="w-6 h-6 text-emerald-300" />
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-white via-emerald-100 to-teal-200 bg-clip-text text-transparent">
            Productastic Review
          </DialogTitle>
          <div className="flex justify-center gap-2 mt-2">
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">Pago único</Badge>
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs">Precio de lanzamiento</Badge>
          </div>
          <DialogDescription className="text-emerald-200/70 mt-3 text-center max-w-sm mx-auto">
            Analizo tu proceso de construcción de producto. No opino, reviso tus decisiones.
          </DialogDescription>
          {/* Pricing */}
          <div className="text-center pt-2">
            <span className="text-lg text-white/40 line-through decoration-emerald-500/50 mr-3">USD 100</span>
            <span className="text-3xl font-bold text-white">USD 50</span>
          </div>
        </DialogHeader>

        <div className="space-y-5 mt-2">

          {/* What we review */}
          <div>
            <p className="text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-2">Qué se revisa</p>
            <ul className="space-y-2">
              {reviewItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-emerald-100/80">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* What we don't */}
          <div>
            <p className="text-xs font-semibold text-red-300/80 uppercase tracking-wider mb-2">Qué NO es esto</p>
            <ul className="space-y-2">
              {notReviewItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-white/50">
                  <X className="w-4 h-4 text-red-400/60 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* How it works */}
          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4">
            <p className="text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-2">Cómo funciona</p>
            <ol className="space-y-1 text-sm text-emerald-100/70 list-decimal list-inside">
              <li>Pagás y te llega la confirmación</li>
              <li>Te contacto para coordinar el envío de materiales</li>
              <li>En 72 hs recibís el informe detallado</li>
            </ol>
          </div>

          {/* Checkout CTA */}
          <LemonSqueezyCheckout
            plan="productastic_review"
            buttonText="Solicitar mi review · USD 50"
            className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold shadow-lg shadow-emerald-900/30 border-0 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-emerald-500/20 hover:shadow-xl"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
