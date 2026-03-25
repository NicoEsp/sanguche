import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, X, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMixpanelTracking } from "@/hooks/useMixpanelTracking";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/useUserProfile";
import { z } from "zod";

const emailSchema = z.string().trim().email("Ingresá un email válido").max(255);

interface ProductReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProductReviewModal = ({ open, onOpenChange }: ProductReviewModalProps) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { trackEvent } = useMixpanelTracking();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      toast({ title: "Email inválido", description: result.error.errors[0].message, variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("product_review_waitlist" as any)
        .insert({ email: result.data, user_id: profile?.id || null } as any);

      if (error) throw error;

      trackEvent("productastic_review_waitlist_joined", { email: result.data });
      setSubmitted(true);
      toast({ title: "¡Listo!", description: "Te anotaste en la lista de espera. Te contactamos pronto." });
    } catch {
      toast({ title: "Error", description: "No pudimos registrarte. Intentá de nuevo.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white border-emerald-500/30 sm:rounded-2xl">
        <DialogHeader className="text-center">
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
          <DialogDescription className="text-emerald-200/70 mt-3">
            Analizo tu proceso de construcción de producto — no opino, reviso tus decisiones.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Pricing */}
          <div className="text-center">
            <span className="text-lg text-white/40 line-through decoration-emerald-500/50 mr-3">USD 100</span>
            <span className="text-3xl font-bold text-white">USD 50</span>
          </div>

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
              <li>Te anotás en la lista de espera</li>
              <li>Te contacto para coordinar el envío de materiales</li>
              <li>Realizás el pago único de USD 50</li>
              <li>En 72 hs recibís el informe detallado</li>
            </ol>
          </div>

          {/* Waitlist form */}
          {submitted ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6 text-emerald-300" />
              </div>
              <p className="font-semibold text-white">¡Estás en la lista!</p>
              <p className="text-sm text-emerald-200/60 mt-1">Te contactamos pronto por email.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/5 border-emerald-500/20 text-white placeholder:text-emerald-300/30 focus-visible:ring-emerald-500/50"
                maxLength={255}
                required
              />
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold border-0 whitespace-nowrap"
              >
                {loading ? "..." : "Anotarme"}
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
