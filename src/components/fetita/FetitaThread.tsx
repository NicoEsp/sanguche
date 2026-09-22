import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { FetitaMessage } from "@/lib/fetita/types";
import type { FetitaFeedbackRow } from "@/hooks/useFetita";
import type { PendingTurn } from "@/hooks/useFetitaChat";
import { FetitaAssistantBubble, FetitaUserBubble } from "./FetitaMessageBubble";
import { FetitaFeedbackButtons } from "./FetitaFeedbackButtons";

interface FetitaThreadProps {
  conversationId: string | null;
  /** El contenedor que scrollea: se mueve ese y no la ventana. */
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  messages: FetitaMessage[];
  loading: boolean;
  pending: PendingTurn | null;
  streaming: boolean;
  /** El último mensaje es de la persona y Fetita todavía no respondió (turno en curso tras recargar). */
  awaitingReply?: boolean;
  feedback: Record<string, FetitaFeedbackRow> | undefined;
  onFeedback: React.ComponentProps<typeof FetitaFeedbackButtons>["onSubmit"];
}

/** Los mensajes de la conversación, más el turno que está llegando por streaming. */
export function FetitaThread({
  conversationId,
  scrollContainerRef,
  messages,
  loading,
  pending,
  streaming,
  awaitingReply,
  feedback,
  onFeedback,
}: FetitaThreadProps) {
  const ids = new Set(messages.map((m) => m.id));
  const showPendingUser = pending && !(pending.userMessageId && ids.has(pending.userMessageId));
  const showPendingAssistant = pending && !(pending.assistantMessageId && ids.has(pending.assistantMessageId));
  const pendingLength = pending?.assistantText.length ?? 0;

  // Sigue al final mientras la persona esté abajo: si subió a releer, no se
  // la arrastra con cada pedazo de texto que llega.
  const stickToBottom = useRef(true);
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onScroll = () => {
      stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [scrollContainerRef]);

  // Al abrir una conversación o mandar un mensaje, siempre al final.
  useEffect(() => {
    stickToBottom.current = true;
  }, [conversationId, pending?.userText]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [scrollContainerRef, conversationId, loading, messages.length, pendingLength, streaming, pending?.statusText, pending?.userText]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="ml-auto h-12 w-2/3 rounded-2xl" />
        <Skeleton className="h-20 w-5/6" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {messages.map((m) =>
        m.role === "user" ? (
          <FetitaUserBubble
            key={m.id}
            content={m.content}
            materialChars={m.material_chars}
            materialSummary={m.material_summary}
          />
        ) : (
          <FetitaAssistantBubble
            key={m.id}
            content={m.content}
            status={m.status}
            footer={
              m.status === "complete" || m.status === "truncated" ? (
                <FetitaFeedbackButtons messageId={m.id} current={feedback?.[m.id]} onSubmit={onFeedback} />
              ) : null
            }
          />
        ),
      )}

      {showPendingUser && (
        <FetitaUserBubble
          content={pending.userText}
          materialChars={pending.materialChars}
          materialSummary={pending.materialSummary}
          pending
        />
      )}

      {showPendingAssistant && (
        <>
          {pending.statusText && !pending.assistantText && (
            <p className="flex items-center gap-2 pl-10 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {pending.statusText}
            </p>
          )}
          {(pending.assistantText || !pending.statusText) && (
            <FetitaAssistantBubble content={pending.assistantText} streaming={streaming} />
          )}
        </>
      )}
      {awaitingReply && (
        <p className="flex items-center gap-2 pl-10 text-sm text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Fetita está terminando la respuesta…
        </p>
      )}
    </div>
  );
}
