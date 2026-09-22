import { useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useMixpanelTracking } from "@/hooks/useMixpanelTracking";
import { FEEDBACK_REASONS, type FetitaFeedbackReason } from "@/lib/fetita/types";
import type { FetitaFeedbackRow } from "@/hooks/useFetita";

interface FetitaFeedbackButtonsProps {
  messageId: string;
  current: FetitaFeedbackRow | undefined;
  onSubmit: (input: { messageId: string; rating: 1 | -1; reason?: FetitaFeedbackReason | null; comment?: string | null }) => void;
  disabled?: boolean;
}

/**
 * Pulgar arriba o abajo sobre una respuesta. El pulgar abajo pide un motivo:
 * "inventó algo" alimenta la tasa de alucinación del admin, por eso no viene
 * elegido de antemano: tiene que marcarlo la persona.
 */
export function FetitaFeedbackButtons({ messageId, current, onSubmit, disabled }: FetitaFeedbackButtonsProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<FetitaFeedbackReason | null>(null);
  const [comment, setComment] = useState("");
  const { trackEvent } = useMixpanelTracking();

  // Al abrir se parte de lo que ya dejó (el feedback carga después que la burbuja).
  const handleOpenChange = (next: boolean) => {
    if (next) {
      setReason(current?.rating === -1 ? current.reason : null);
      setComment(current?.rating === -1 ? current.comment ?? "" : "");
    }
    setOpen(next);
  };

  const sendPositive = () => {
    onSubmit({ messageId, rating: 1 });
    trackEvent("fetita_feedback", { rating: 1 });
  };

  const sendNegative = () => {
    if (!reason) return;
    onSubmit({ messageId, rating: -1, reason, comment: comment.trim() || null });
    trackEvent("fetita_feedback", { rating: -1, reason });
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-0.5">
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-7 w-7 text-muted-foreground", current?.rating === 1 && "text-emerald-600 dark:text-emerald-400")}
        onClick={sendPositive}
        disabled={disabled}
        aria-label="Me sirvió"
        aria-pressed={current?.rating === 1}
      >
        <ThumbsUp className="h-3.5 w-3.5" />
      </Button>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-7 w-7 text-muted-foreground", current?.rating === -1 && "text-red-600 dark:text-red-400")}
            disabled={disabled}
            aria-label="No me sirvió"
            aria-pressed={current?.rating === -1}
          >
            <ThumbsDown className="h-3.5 w-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72" align="start">
          <div className="space-y-3">
            <p className="text-sm font-medium">¿Qué falló?</p>
            <RadioGroup value={reason ?? ""} onValueChange={(v) => setReason(v as FetitaFeedbackReason)}>
              {(Object.keys(FEEDBACK_REASONS) as FetitaFeedbackReason[]).map((key) => (
                <div key={key} className="flex items-center gap-2">
                  <RadioGroupItem value={key} id={`${messageId}-${key}`} />
                  <Label htmlFor={`${messageId}-${key}`} className="text-sm font-normal">
                    {FEEDBACK_REASONS[key]}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Contanos más (opcional)"
              className="min-h-[64px] text-sm"
              maxLength={1000}
            />
            <Button size="sm" className="w-full" onClick={sendNegative} disabled={!reason}>
              Enviar
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
