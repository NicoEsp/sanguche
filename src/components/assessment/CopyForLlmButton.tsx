import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMixpanelTracking } from "@/hooks/useMixpanelTracking";
import { AnyAssessmentValues, AssessmentResult, AssessmentTypeKey } from "@/utils/scoring";
import { copyText } from "@/utils/clipboard";

// El armado del Markdown (textos de todos los dominios) va en su propio chunk y
// se pide con la página ya en pantalla. El botón se habilita cuando llegó: así
// el click copia sin esperas y la copia queda dentro del gesto del usuario, que
// Safari exige para el portapapeles.
type MarkdownModule = typeof import("@/utils/assessmentMarkdown");
let markdownModule: MarkdownModule | undefined;
const loadMarkdown = () =>
  import("@/utils/assessmentMarkdown").then((module) => (markdownModule = module));

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

  const [ready, setReady] = useState(() => markdownModule !== undefined);
  useEffect(() => {
    if (ready) return;
    let alive = true;
    // Si el chunk no baja, el botón se habilita igual: el click lo vuelve a
    // pedir y, si tampoco llega, avisa con el toast de error.
    const settle = () => alive && setReady(true);
    loadMarkdown().then(settle, settle);
    return () => {
      alive = false;
    };
  }, [ready]);

  const handleClick = async () => {
    let markdown: string;
    try {
      const { buildAssessmentMarkdown } = markdownModule ?? (await loadMarkdown());
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
      disabled={!ready}
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
