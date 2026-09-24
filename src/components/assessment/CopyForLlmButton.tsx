import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMixpanelTracking } from "@/hooks/useMixpanelTracking";
import { AnyAssessmentValues, AssessmentResult, AssessmentTypeKey } from "@/utils/scoring";
import { copyText } from "@/utils/clipboard";

// El armado del Markdown (textos de todos los dominios) va en su propio chunk:
// se pide con la página ya en pantalla o al acercarse al botón, así al click ya
// está cargado y la copia sigue dentro del gesto del usuario (Safari la exige).
const loadMarkdown = () => import("@/utils/assessmentMarkdown");

interface CopyForLlmButtonProps {
  result: AssessmentResult;
  values: AnyAssessmentValues | null;
  assessmentType: AssessmentTypeKey | null;
  updatedAt: string | null;
}

/**
 * Copia el resultado completo como Markdown para pegarlo en ChatGPT, Claude o
 * el asistente que la persona ya use.
 */
export function CopyForLlmButton({ result, values, assessmentType, updatedAt }: CopyForLlmButtonProps) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout>>();
  const { toast } = useToast();
  const { trackEvent } = useMixpanelTracking();

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  useEffect(() => {
    const timer = setTimeout(() => void loadMarkdown(), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleClick = async () => {
    let markdown: string;
    try {
      const { buildAssessmentMarkdown } = await loadMarkdown();
      markdown = buildAssessmentMarkdown({ result, values, assessmentType, updatedAt });
      await copyText(markdown);
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error copiando el markdown:", error);
      toast({
        variant: "destructive",
        title: "No pudimos copiar el texto",
        description: "Puede que tu navegador esté bloqueando el portapapeles."
      });
      return;
    }

    trackEvent("markdown_copied", {
      assessment_type: assessmentType ?? "legacy",
      promedio_global: result.promedioGlobal,
      gaps_count: result.gaps.length,
      characters: markdown.length
    });

    setCopied(true);
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopied(false), 2500);

    toast({
      title: "Copiado como Markdown",
      description: "Pegalo en la IA que uses y pedile que arme tu plan."
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      onPointerEnter={() => void loadMarkdown()}
      onFocus={() => void loadMarkdown()}
      className="shrink-0"
    >
      {copied ? (
        <Check className="h-4 w-4 mr-2 text-green-600" />
      ) : (
        <Copy className="h-4 w-4 mr-2" />
      )}
      {copied ? "¡Copiado!" : "Copiar para tu IA"}
    </Button>
  );
}
