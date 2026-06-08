import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Check, X, Building2 } from "lucide-react";
import { useMixpanelTracking } from "@/hooks/useMixpanelTracking";
import { DirectCheckoutButton } from "@/components/planes/DirectCheckoutButton";

interface B2BModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const B2BModal = ({ open, onOpenChange }: B2BModalProps) => {
  const { trackEvent } = useMixpanelTracking();

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      trackEvent("productprepa_business_modal_opened");
    } else {
      trackEvent("productprepa_business_modal_closed");
    }
    onOpenChange(isOpen);
  };

  const includedItems = [
    "Diagnóstico inicial del equipo y áreas de mejora",
    "Plan de capacitación a medida (estrategia, discovery, ejecución)",
    "Sesiones grupales en vivo con el equipo",
    "Acceso de todo el equipo a los cursos de ProductPrepa",
    "Reportes de avance al líder del área",
  ];

  const notIncludedItems = [
    "No es una consultoría de producto sobre el roadmap interno",
    "No reemplaza al PM/Líder del área",
    "No es coaching individual de carrera",
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg bg-gradient-to-br from-indigo-950 via-indigo-900 to-blue-950 text-white border-indigo-500/30 sm:rounded-2xl">
        <DialogHeader className="text-center items-center">
          <div className="mx-auto mb-3 w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-indigo-300" />
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-white via-indigo-100 to-blue-200 bg-clip-text text-transparent">
            ProductPrepa for B2B
          </DialogTitle>
          <div className="flex justify-center gap-2 mt-2">
            <Badge className="bg-indigo-500/20 text-indigo-200 border-indigo-500/30 text-xs">Equipos</Badge>
            <Badge className="bg-blue-500/20 text-blue-200 border-blue-500/30 text-xs">Capacitación a medida</Badge>
          </div>
          <DialogDescription className="text-indigo-100/70 mt-3 text-center max-w-sm mx-auto">
            Capacitá a tu equipo de Producto con un programa diseñado para el contexto y los objetivos de tu empresa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* What we include */}
          <div>
            <p className="text-xs font-semibold text-indigo-200 uppercase tracking-wider mb-2">Qué incluye</p>
            <ul className="space-y-2">
              {includedItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-indigo-100/85">
                  <Check className="w-4 h-4 text-indigo-300 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* What we don't */}
          <div>
            <p className="text-xs font-semibold text-red-300/80 uppercase tracking-wider mb-2">Qué NO es esto</p>
            <ul className="space-y-2">
              {notIncludedItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-white/50">
                  <X className="w-4 h-4 text-red-400/60 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* How it works */}
          <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-4">
            <p className="text-xs font-semibold text-indigo-200 uppercase tracking-wider mb-2">Cómo sigue</p>
            <ol className="space-y-1 text-sm text-indigo-100/70 list-decimal list-inside">
              <li>Reservás el cupo con el checkout</li>
              <li>Te contacto para entender al equipo y los objetivos</li>
              <li>Armamos el plan y arrancamos las sesiones</li>
            </ol>
          </div>

          {/* Checkout CTA */}
          <DirectCheckoutButton
            plan="productprepa_business"
            buttonText="Reservar mi cupo B2B"
            emailLabel="Email de contacto del equipo"
            className="w-full h-12 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-400 hover:to-blue-400 text-white font-semibold shadow-lg shadow-indigo-900/30 border-0 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-indigo-500/20 hover:shadow-xl"
          />

          <p className="text-xs text-center text-indigo-200/50">
            ¿Querés agendar una llamada antes? Escribinos a{" "}
            <a href="mailto:nicoproducto@hey.com" className="text-indigo-200 hover:text-white underline">
              nicoproducto@hey.com
            </a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
