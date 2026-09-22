import ReactMarkdown, { type Components } from "react-markdown";
import { AlertTriangle, FileText } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import type { FetitaMessageStatus } from "@/lib/fetita/types";

/** Prose compacto para las respuestas de Fetita (texto corrido y listas cortas). */
export const FETITA_PROSE =
  "prose prose-sm prose-neutral dark:prose-invert max-w-none prose-p:my-2 prose-p:leading-relaxed prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-headings:text-foreground prose-strong:text-foreground";

// Los títulos de una respuesta no compiten con los de la página, y los links
// abren afuera para no perder la conversación. Las imágenes no se cargan: el
// texto puede venir de material pegado, y una imagen con una URL armada
// mandaría datos de la conversación a un tercero apenas se muestra.
const MARKDOWN_COMPONENTS: Components = {
  h1: "h3",
  h2: "h3",
  a: ({ node: _node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
  img: ({ alt }) => (alt ? <span>[{alt}]</span> : null),
};

export function FetitaMarkdown({ children }: { children: string }) {
  return <ReactMarkdown components={MARKDOWN_COMPONENTS}>{children}</ReactMarkdown>;
}

const STATUS_NOTE: Partial<Record<FetitaMessageStatus, string>> = {
  truncated: "La respuesta quedó cortada por longitud.",
  refused: "Fetita no pudo seguir con este pedido. Probá reformularlo.",
  error: "Esta respuesta se cortó por un error. Podés volver a mandar tu mensaje.",
};

interface UserBubbleProps {
  content: string;
  materialChars?: number | null;
  materialSummary?: string | null;
  pending?: boolean;
}

export function FetitaUserBubble({ content, materialChars, materialSummary, pending }: UserBubbleProps) {
  return (
    <div className="flex justify-end">
      <div className={cn("max-w-[85%] space-y-2", pending && "opacity-80")}>
        <div className="whitespace-pre-wrap rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
          {content}
        </div>
        {materialChars ? (
          <div className="rounded-lg border bg-muted/40 text-xs">
            {materialSummary ? (
              <Accordion type="single" collapsible>
                <AccordionItem value="material" className="border-0">
                  <AccordionTrigger className="px-3 py-2 text-xs hover:no-underline">
                    <span className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" />
                      Material pegado ({materialChars.toLocaleString("es-AR")} caracteres, no se guardó)
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-3 pb-3">
                    <p className="mb-2 text-muted-foreground">Esto es lo que Fetita leyó del material:</p>
                    <div className={FETITA_PROSE}>
                      <FetitaMarkdown>{materialSummary}</FetitaMarkdown>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ) : (
              <p className="flex items-center gap-1.5 px-3 py-2 text-muted-foreground">
                <FileText className="h-3.5 w-3.5" />
                Leyendo el material ({materialChars.toLocaleString("es-AR")} caracteres)…
              </p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

interface AssistantBubbleProps {
  content: string;
  status?: FetitaMessageStatus;
  streaming?: boolean;
  footer?: React.ReactNode;
}

export function FetitaAssistantBubble({ content, status = "complete", streaming, footer }: AssistantBubbleProps) {
  const note = STATUS_NOTE[status];
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
        F
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        {content ? (
          <div className={FETITA_PROSE}>
            <FetitaMarkdown>{content}</FetitaMarkdown>
            {streaming && <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-foreground/60 align-middle" />}
          </div>
        ) : streaming ? (
          <p className="text-sm text-muted-foreground animate-pulse">Fetita está pensando…</p>
        ) : null}
        {note && (
          <p className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            {note}
          </p>
        )}
        {footer}
      </div>
    </div>
  );
}
