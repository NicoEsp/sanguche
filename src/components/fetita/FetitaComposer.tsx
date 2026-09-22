import { useEffect, useRef, useState } from "react";
import { ArrowUp, Paperclip, Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { MAX_MATERIAL_CHARS, MAX_MESSAGE_CHARS } from "@/lib/fetita/types";

interface FetitaComposerProps {
  value: string;
  onChange: (value: string) => void;
  material: string;
  onMaterialChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  /** Fetita está respondiendo en esta conversación. */
  streaming: boolean;
  /** Se puede cortar el stream: el mensaje ya quedó guardado. Antes de eso, cortar lo perdería. */
  canStop?: boolean;
  /** Motivo temporal por el que no se puede mandar (se puede seguir escribiendo). */
  busyReason?: string | null;
  disabledReason?: string | null;
  remaining?: number | null;
  autoFocus?: boolean;
}

// En pantallas táctiles no hay Shift+Enter: Enter hace salto de línea y se
// manda con el botón.
const isTouch = () => typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches;

/**
 * Caja de mensaje. Enter manda, Shift+Enter hace salto de línea. El material
 * (transcripciones, notas, datos) va en un campo aparte porque se procesa
 * distinto: se lee una vez y no se guarda.
 */
export function FetitaComposer({
  value,
  onChange,
  material,
  onMaterialChange,
  onSend,
  onStop,
  streaming,
  canStop = true,
  busyReason,
  disabledReason,
  remaining,
  autoFocus,
}: FetitaComposerProps) {
  const [showMaterial, setShowMaterial] = useState(material.length > 0);
  const [materialCut, setMaterialCut] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const disabled = !!disabledReason;
  const canSend = !disabled && !streaming && !busyReason && value.trim().length > 0;

  // Crece con el texto hasta un tope, después scrollea.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }, [value]);

  useEffect(() => {
    if (autoFocus && !disabled) textareaRef.current?.focus();
  }, [autoFocus, disabled]);

  // El campo se deshabilita mientras Fetita responde y el navegador le saca
  // el foco: al terminar se le devuelve para seguir escribiendo.
  const wasStreaming = useRef(streaming);
  useEffect(() => {
    if (wasStreaming.current && !streaming && !disabled && !isTouch()) textareaRef.current?.focus();
    wasStreaming.current = streaming;
  }, [streaming, disabled]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // keyCode 229: Safari confirma la composición del IME con isComposing en false.
    if (e.nativeEvent.isComposing || e.nativeEvent.keyCode === 229) return;
    if (e.key === "Enter" && !e.shiftKey && !isTouch()) {
      e.preventDefault();
      if (canSend) onSend();
    }
  };

  const handleMaterialChange = (next: string) => {
    setMaterialCut(Math.max(0, next.length - MAX_MATERIAL_CHARS));
    onMaterialChange(next.slice(0, MAX_MATERIAL_CHARS));
  };

  if (disabled) {
    return (
      <div className="rounded-xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">{disabledReason}</div>
    );
  }

  return (
    <div className="space-y-2">
      {showMaterial && (
        <div className="rounded-xl border bg-muted/30 p-3">
          <div className="mb-2 flex items-start justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Pegá transcripciones, notas de entrevistas o datos. Fetita los lee una vez para desafiarte y guarda sólo lo que
              extrajo, con citas cortas: el material completo no se guarda. Sacá nombres, emails y teléfonos antes de pegar.
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => {
                onMaterialChange("");
                setMaterialCut(0);
                setShowMaterial(false);
              }}
              aria-label="Quitar material"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Textarea
            value={material}
            onChange={(e) => handleMaterialChange(e.target.value)}
            placeholder="Pegá acá el material"
            aria-label="Material para Fetita"
            className="min-h-[96px] bg-background text-sm"
            disabled={streaming}
          />
          <div className="mt-1 flex items-start justify-between gap-2 text-[11px]">
            <p className="text-amber-700 dark:text-amber-400" aria-live="polite">
              {materialCut > 0
                ? `Se recortaron los últimos ${materialCut.toLocaleString("es-AR")} caracteres: Fetita lee hasta ${MAX_MATERIAL_CHARS.toLocaleString("es-AR")}. Pegá el resto en otro mensaje.`
                : ""}
            </p>
            <p className="shrink-0 text-muted-foreground">
              {material.length.toLocaleString("es-AR")} / {MAX_MATERIAL_CHARS.toLocaleString("es-AR")}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-end gap-2 rounded-2xl border bg-background p-2 shadow-sm focus-within:ring-2 focus-within:ring-ring">
        {!showMaterial && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 text-muted-foreground"
            onClick={() => setShowMaterial(true)}
            disabled={streaming}
            aria-label="Agregar material"
            title="Agregar material (transcripciones, notas, datos)"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
        )}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, MAX_MESSAGE_CHARS))}
          onKeyDown={handleKeyDown}
          rows={1}
          aria-label="Mensaje para Fetita"
          placeholder={streaming ? "Fetita está respondiendo…" : "Contale a Fetita qué decisión querés tomar"}
          className={cn(
            "max-h-[220px] min-h-[36px] flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground",
          )}
          disabled={streaming}
        />
        {streaming ? (
          <Button
            size="icon"
            variant="secondary"
            className="h-9 w-9 shrink-0"
            onClick={onStop}
            disabled={!canStop}
            aria-label="Detener"
            title={canStop ? "Detener" : "Se puede detener cuando Fetita empieza a responder"}
          >
            <Square className="h-3.5 w-3.5 fill-current" />
          </Button>
        ) : (
          <Button size="icon" className="h-9 w-9 shrink-0" onClick={onSend} disabled={!canSend} aria-label="Enviar">
            <ArrowUp className="h-4 w-4" />
          </Button>
        )}
      </div>
      <p className="px-1 text-[11px] text-muted-foreground">
        {busyReason ? `${busyReason} ` : ""}
        {typeof remaining === "number"
          ? `Te quedan ${remaining} ${remaining === 1 ? "mensaje" : "mensajes"} este mes. `
          : ""}
        Fetita puede equivocarse: chequeá lo que afirma.
      </p>
    </div>
  );
}
