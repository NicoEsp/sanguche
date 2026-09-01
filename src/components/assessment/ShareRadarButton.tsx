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
      const { outcome, textCopied } = await shareOrDownloadRadar(props);
      if (outcome === "cancelled") return;

      // La descarga y la hoja nativa son eventos distintos y no comparables: de
      // la imagen bajada no vamos a saber nunca adónde fue a parar, y ese
      // conteo es toda la señal que tenemos de esa mitad del feature.
      const imageEvent = {
        assessment_type: props.assessmentType ?? "legacy",
        promedio_global: props.promedioGlobal,
        domains_count: props.scores.length
      };
      trackEvent(outcome === "shared" ? "radar_image_shared" : "radar_image_downloaded", imageEvent);
      if (textCopied) {
        trackEvent("share_text_copied", { assessment_type: props.assessmentType ?? "legacy" });
      }

      if (outcome === "downloaded") {
        toast(
          textCopied
            ? {
                // Pasaron dos cosas de un solo click: si el aviso nombra una
                // sola, el texto queda en el portapapeles sin que nadie lo pegue.
                title: "Imagen descargada y texto copiado",
                description: "Adjuntá la imagen y pegá el texto: ya lleva el link a la evaluación."
              }
            : {
                title: "Imagen descargada",
                description: "Tu mapa de competencias quedó listo para compartir."
              }
        );
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
