import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMixpanelTracking } from "@/hooks/useMixpanelTracking";
import { AssessmentTypeKey, DomainScore, SeniorityLevel } from "@/utils/scoring";
import { shareOrDownloadRadar } from "@/utils/radarShareImage";

interface ShareRadarButtonProps {
  scores: DomainScore[];
  assessmentType: AssessmentTypeKey | null;
  nivel: SeniorityLevel;
  promedioGlobal: number;
  updatedAt: string | null;
}

/**
 * Baja el mapa de competencias como PNG (o abre la hoja nativa de compartir en
 * mobile). La imagen lleva la URL de la evaluación: es la única pieza del
 * resultado que sale de la plataforma y puede traer a alguien de vuelta.
 */
export function ShareRadarButton(props: ShareRadarButtonProps) {
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const { trackEvent } = useMixpanelTracking();

  const handleClick = async () => {
    setBusy(true);
    try {
      const outcome = await shareOrDownloadRadar(props);
      if (outcome === "cancelled") return;

      trackEvent("radar_image_shared", {
        outcome,
        assessment_type: props.assessmentType ?? "legacy",
        domains_count: props.scores.length
      });

      if (outcome === "downloaded") {
        toast({
          title: "Imagen descargada",
          description: "Tu mapa de competencias quedó listo para compartir."
        });
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error generando la imagen del radar:", error);
      toast({
        variant: "destructive",
        title: "No pudimos generar la imagen",
        description: "Probá de nuevo en un momento."
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={busy} className="shrink-0">
      {busy ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Share2 className="h-4 w-4 mr-2" />
      )}
      Compartir imagen
    </Button>
  );
}
