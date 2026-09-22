import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertTriangle, FileText, Info, Loader2, PanelLeft, X } from "lucide-react";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { useAssessmentData } from "@/hooks/useAssessmentData";
import {
  useDeleteFetitaConversation,
  useFetitaConversations,
  useFetitaFeedback,
  useFetitaMemo,
  useFetitaMessages,
  useFetitaStatus,
  useSetFetitaFeedback,
  isAwaitingReply,
} from "@/hooks/useFetita";
import { useFetitaChat } from "@/hooks/useFetitaChat";
import { buildAssessmentMarkdown } from "@/utils/assessmentMarkdown";
import { BLOCKED_COPY } from "@/lib/fetita/types";
import { FetitaConversationList } from "@/components/fetita/FetitaConversationList";
import { FetitaThread } from "@/components/fetita/FetitaThread";
import { FetitaComposer } from "@/components/fetita/FetitaComposer";
import { FetitaMemoPanel } from "@/components/fetita/FetitaMemoPanel";
import { FetitaProtocolStepper } from "@/components/fetita/FetitaProtocolStepper";
import { FetitaEmptyState } from "@/components/fetita/FetitaEmptyState";
import { FetitaLocked } from "@/components/fetita/FetitaLocked";
import { FetitaVerdictBadge } from "@/components/fetita/FetitaVerdictBadge";

const SEO = {
  title: "Fetita — ProductPrepa",
  description: "Fetita, el agente de ProductPrepa que desafía tus decisiones de producto antes de construir.",
  canonical: "/fetita",
  robots: "noindex, nofollow",
};

// El borrador se guarda en el navegador por persona y por conversación: un
// deploy recarga las pestañas abiertas y no queremos que se pierda lo que la
// persona venía escribiendo. El material pegado no se guarda en ningún lado,
// a propósito.
const draftKey = (userId: string | undefined, conversationId: string | null) =>
  `fetita-draft:${userId ?? "anon"}:${conversationId ?? "nueva"}`;

function readDraft(key: string): string {
  try {
    return localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function writeDraft(key: string, value: string) {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {
    // Sin localStorage (modo privado, cuota): el borrador vive sólo en memoria.
  }
}

/**
 * /fetita: conversaciones con Fetita, una decisión por conversación.
 *
 * La conversación abierta vive en ?c=<id> para que el link se pueda
 * compartir con uno mismo y la navegación la marque como activa.
 */
export default function Fetita() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const conversationId = searchParams.get("c");
  const { user } = useAuth();
  const currentDraftKey = draftKey(user?.id, conversationId);
  const [draft, setDraftState] = useState(() => readDraft(currentDraftKey));
  const [material, setMaterial] = useState("");
  const [listOpen, setListOpen] = useState(false);
  const [memoOpen, setMemoOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const conversationIdRef = useRef(conversationId);
  conversationIdRef.current = conversationId;

  const { status, hasAccess, isError, refetch } = useFetitaStatus();
  const {
    result,
    values,
    assessmentType,
    updatedAt,
    hasAssessment,
    loading: assessmentLoading,
  } = useAssessmentData();
  const conversations = useFetitaConversations();
  const messages = useFetitaMessages(conversationId);
  const memo = useFetitaMemo(conversationId);
  const deleteConversation = useDeleteFetitaConversation();
  const setFeedback = useSetFetitaFeedback(conversationId);

  // El perfil viaja sólo al crear una conversación y queda congelado en ella.
  const perfil = useMemo(
    () => (result ? buildAssessmentMarkdown({ result, values, assessmentType, updatedAt, forAgent: true }) : null),
    [result, values, assessmentType, updatedAt],
  );

  const selectConversation = useCallback(
    (id: string | null) => {
      setSearchParams(id ? { c: id } : {}, { replace: !id });
      setListOpen(false);
    },
    [setSearchParams],
  );

  // Sólo se pasa a la conversación recién creada si la persona sigue en la
  // vista de "nueva decisión": si ya se fue a otra, no se la saca de ahí.
  const onConversationCreated = useCallback(
    (id: string) => {
      if (conversationIdRef.current === null) setSearchParams({ c: id }, { replace: true });
    },
    [setSearchParams],
  );

  const { send, stop, pending, streaming, notice, clearNotice, keepNoticeFor } = useFetitaChat({
    conversationId,
    perfil,
    onConversationCreated,
  });

  // Cada conversación tiene su propio borrador y su propio material; un aviso
  // de otra conversación no se muestra en la que se abre.
  useEffect(() => {
    keepNoticeFor(conversationId);
    setDraftState(readDraft(currentDraftKey));
    setMaterial("");
  }, [conversationId, currentDraftKey, keepNoticeFor]);

  // Para lectores de pantalla: avisa cuando termina una respuesta.
  const wasStreaming = useRef(false);
  useEffect(() => {
    if (wasStreaming.current && !streaming) setAnnouncement("Fetita terminó de responder.");
    if (streaming) setAnnouncement("");
    wasStreaming.current = streaming;
  }, [streaming]);

  const setDraft = useCallback(
    (value: string | ((prev: string) => string)) => {
      setDraftState((prev) => {
        const next = typeof value === "function" ? value(prev) : value;
        writeDraft(currentDraftKey, next);
        return next;
      });
    },
    [currentDraftKey],
  );

  const assistantIds = useMemo(
    () => (messages.data ?? []).filter((m) => m.role === "assistant").map((m) => m.id),
    [messages.data],
  );
  const feedback = useFetitaFeedback(conversationId, assistantIds);

  const current = conversations.data?.find((c) => c.id === conversationId) ?? null;
  const title = current?.title ?? "Nueva decisión";

  const handleSend = async () => {
    const text = draft.trim();
    if (!text) return;
    const mat = material.trim() || null;
    setDraft("");
    setMaterial("");
    const saved = await send(text, mat);
    // Si el mensaje no llegó a guardarse, vuelve al campo para no perderlo.
    if (!saved) {
      setDraft((d) => d || text);
      if (mat) setMaterial((m) => m || mat);
    }
  };

  const handleDelete = (id: string) => {
    deleteConversation.mutate(id, {
      onSuccess: () => {
        if (id === conversationId) selectConversation(null);
      },
    });
  };

  if (isError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <Seo {...SEO} />
        <div className="max-w-sm space-y-3 text-center">
          <AlertTriangle className="mx-auto h-6 w-6 text-destructive" />
          <p className="text-muted-foreground">No pudimos verificar tu acceso a Fetita. Puede ser un problema temporal de conexión.</p>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  if (hasAccess === undefined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Seo {...SEO} />
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <>
        <Seo {...SEO} />
        <FetitaLocked />
      </>
    );
  }

  const blockedReason = status && !status.can_chat && status.reason ? BLOCKED_COPY[status.reason] : null;
  // El turno en curso se muestra sólo en su conversación: la persona puede
  // mirar otra mientras Fetita responde.
  const pendingHere = pending && pending.conversationId === conversationId ? pending : null;
  const streamingHere = streaming && pendingHere !== null;
  const noticeHere = notice && notice.conversationId === conversationId ? notice : null;
  const showEmpty = !conversationId && !pendingHere;
  // El perfil se congela al crear la conversación: se espera a que cargue.
  const waitingPerfil = !conversationId && assessmentLoading;
  const list = (
    <FetitaConversationList
      conversations={conversations.data}
      loading={conversations.isLoading}
      selectedId={conversationId}
      onSelect={(id) => selectConversation(id)}
      onNew={() => selectConversation(null)}
      onDelete={handleDelete}
      busyId={streaming ? pending?.conversationId ?? null : null}
    />
  );
  const memoPanel = <FetitaMemoPanel memo={memo.data ?? null} title={title} />;

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] overflow-hidden">
      <Seo {...SEO} />

      <aside className="hidden w-72 shrink-0 border-r md:block">{list}</aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b px-3 py-2 md:px-4">
          <Sheet open={listOpen} onOpenChange={setListOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden" aria-label="Ver decisiones">
                <PanelLeft className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex w-80 flex-col p-0">
              <SheetHeader className="px-4 pt-4">
                <SheetTitle>Tus decisiones</SheetTitle>
              </SheetHeader>
              <div className="min-h-0 flex-1">{list}</div>
            </SheetContent>
          </Sheet>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-sm font-semibold">{title}</h1>
              <Badge variant="secondary" className="shrink-0 px-1.5 py-0 text-[10px]">
                Beta
              </Badge>
            </div>
            {current && <FetitaProtocolStepper currentStep={current.protocol_step} className="mt-1.5 overflow-x-auto" />}
          </div>

          {conversationId && (
            <Sheet open={memoOpen} onOpenChange={setMemoOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="shrink-0 gap-1.5 xl:hidden">
                  <FileText className="h-4 w-4" />
                  Memo
                  {memo.data && <FetitaVerdictBadge verdict={memo.data.verdict} short className="ml-1 px-1.5 py-0 text-[10px]" />}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-md">
                <SheetHeader className="px-5 pt-5">
                  <SheetTitle>Memo de la decisión</SheetTitle>
                </SheetHeader>
                {memoPanel}
              </SheetContent>
            </Sheet>
          )}
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 py-6">
            {showEmpty ? (
              <FetitaEmptyState onPick={setDraft} hasAssessment={hasAssessment} />
            ) : (
              <FetitaThread
                conversationId={conversationId}
                scrollContainerRef={scrollRef}
                messages={messages.data ?? []}
                loading={!!conversationId && messages.isLoading && !pendingHere}
                pending={pendingHere}
                streaming={streamingHere}
                awaitingReply={!pendingHere && isAwaitingReply(messages.data)}
                feedback={feedback.data}
                onFeedback={(input) => setFeedback.mutate(input)}
              />
            )}
          </div>
        </div>

        <div className="border-t bg-background px-4 py-3">
          <div className="mx-auto max-w-3xl space-y-2">
            <p className="sr-only" aria-live="polite">
              {announcement}
            </p>
            {/* Siempre montado para que los lectores de pantalla anuncien el aviso. */}
            <div aria-live="polite">
              {noticeHere && (
                <div
                  role={noticeHere.tone === "error" ? "alert" : undefined}
                  className={
                    noticeHere.tone === "error"
                      ? "flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
                      : "flex items-start gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
                  }
                >
                  {noticeHere.tone === "error" ? (
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  ) : (
                    <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  )}
                  <p className="flex-1">{noticeHere.text}</p>
                  <button type="button" onClick={clearNotice} aria-label="Cerrar aviso" className="shrink-0 opacity-70 hover:opacity-100">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            <FetitaComposer
              key={conversationId ?? "nueva"}
              value={draft}
              onChange={setDraft}
              material={material}
              onMaterialChange={setMaterial}
              onSend={handleSend}
              onStop={stop}
              streaming={streamingHere}
              canStop={!!pendingHere?.userMessageId}
              busyReason={
                streaming && !streamingHere
                  ? "Fetita está respondiendo en otra decisión. Cuando termine, podés mandar tu mensaje."
                  : waitingPerfil
                    ? "Cargando tu autoevaluación…"
                    : null
              }
              disabledReason={blockedReason}
              remaining={status?.remaining ?? null}
              autoFocus={showEmpty}
            />
          </div>
        </div>
      </main>

      {conversationId && (
        <aside className="hidden w-[380px] shrink-0 overflow-y-auto border-l xl:block">
          <div className="border-b px-5 py-3">
            <h2 className="text-sm font-semibold">Memo de la decisión</h2>
          </div>
          {memoPanel}
        </aside>
      )}
    </div>
  );
}
