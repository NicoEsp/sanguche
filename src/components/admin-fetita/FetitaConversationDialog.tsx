import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FetitaMemoPanel } from '@/components/fetita/FetitaMemoPanel';
import { FetitaVerdictBadge } from '@/components/fetita/FetitaVerdictBadge';
import { VERDICT_META } from '@/lib/fetita/types';
import { JudgeCell, QueryError, ReviewBadge } from './FetitaAdminUi';
import { FetitaJudgePanel } from './FetitaJudgePanel';
import { FetitaReviewForm } from './FetitaReviewForm';
import { FetitaTranscript } from './FetitaTranscript';
import {
  formatDateTime,
  formatInteger,
  profileEmail,
  profileName,
  protocolStepLabel,
  protocolStepName,
  type FetitaAdminConversation,
  type FetitaAdminMemoVersion,
} from './shared';
import { useFetitaConversationDetail } from './useAdminFetita';

type DialogTab = 'conversacion' | 'memo';

interface FetitaConversationDialogProps {
  /** null cierra el diálogo. */
  conversationId: string | null;
  /** Si viene de la pestaña Calidad, abre directo en esa versión del memo. */
  focusMemoId?: string | null;
  onClose: () => void;
}

function HeaderMeta({ conversation }: { conversation: FetitaAdminConversation }) {
  const stepName = protocolStepName(conversation.protocol_step);
  return (
    <>
      <DialogDescription className="text-left">
        {profileName(conversation.profile)} · {profileEmail(conversation.profile)}
      </DialogDescription>
      <p className="text-xs text-muted-foreground">
        {protocolStepLabel(conversation.protocol_step)}
        {stepName && ` (${stepName})`} · {formatInteger(conversation.user_message_count)} mensajes · creada el{' '}
        {formatDateTime(conversation.created_at)} · última actividad {formatDateTime(conversation.last_message_at)}
      </p>
      <p className="text-[11px] text-muted-foreground">
        Modelo {conversation.model || 'desconocido'} · prompt {conversation.prompt_version || 'sin versión'}
      </p>
    </>
  );
}

function InvalidMemoContent({ memo }: { memo: FetitaAdminMemoVersion }) {
  return (
    <div className="space-y-2 p-4">
      <p className="text-sm text-destructive">El contenido de esta versión no tiene el formato esperado.</p>
      <pre className="max-h-80 overflow-auto rounded-md bg-muted p-3 text-xs">
        {JSON.stringify(memo.rawContent, null, 2)}
      </pre>
    </div>
  );
}

function MemoSection({
  memos,
  selected,
  title,
  onSelect,
}: {
  memos: FetitaAdminMemoVersion[];
  selected: FetitaAdminMemoVersion | null;
  title: string;
  onSelect: (memoId: string) => void;
}) {
  if (!selected) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Esta conversación todavía no tiene memo. Fetita lo escribe al cerrar el recorrido o cuando se lo piden.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor="fetita-memo-version" className="shrink-0 text-sm">
            Versión
          </Label>
          <Select value={selected.id} onValueChange={onSelect}>
            <SelectTrigger id="fetita-memo-version" className="w-full sm:w-80">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {memos.map((memo, index) => (
                <SelectItem key={memo.id} value={memo.id}>
                  v{memo.version}
                  {index === 0 ? ' (última)' : ''} · {VERDICT_META[memo.verdict].label} · {formatDateTime(memo.created_at)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3">
          <JudgeCell check={selected.latestCheck} />
          <ReviewBadge review={selected.review} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="min-w-0 rounded-lg border">
          {selected.content ? (
            <FetitaMemoPanel
              trackCopy={false}
              memo={{
                id: selected.id,
                version: selected.version,
                verdict: selected.verdict,
                content: selected.content,
                created_at: selected.created_at,
              }}
              title={title}
            />
          ) : (
            <InvalidMemoContent memo={selected} />
          )}
        </div>
        <div className="min-w-0 space-y-4">
          <FetitaJudgePanel memo={selected} />
          <FetitaReviewForm key={`${selected.id}:${selected.review?.reviewed_at ?? 'sin-revision'}`} memo={selected} />
        </div>
      </div>
    </div>
  );
}

/** Detalle de una conversación: transcripción, versiones del memo, juez y revisión. */
export function FetitaConversationDialog({ conversationId, focusMemoId = null, onClose }: FetitaConversationDialogProps) {
  const [session, setSession] = useState<{ id: string | null; focus: string | null; open: boolean }>({
    id: null,
    focus: null,
    open: false,
  });
  const [tab, setTab] = useState<DialogTab>('conversacion');
  const [memoId, setMemoId] = useState<string | null>(null);

  // Cada apertura arranca de cero (pestaña y versión). Se ajusta durante el
  // render, no en un efecto, para no mostrar un frame con el estado anterior.
  const isOpen = conversationId !== null;
  const focus = focusMemoId ?? null;
  if (isOpen && (!session.open || session.id !== conversationId || session.focus !== focus)) {
    setSession({ id: conversationId, focus, open: true });
    setTab(focus ? 'memo' : 'conversacion');
    setMemoId(focus);
  } else if (!isOpen && session.open) {
    setSession((current) => ({ ...current, open: false }));
  }

  // Al cerrar se sigue mostrando la última conversación durante la animación.
  const activeId = conversationId ?? session.id;
  const { data, isError, error, refetch, isFetching } = useFetitaConversationDetail(activeId);
  const isLoading = !data && !isError;
  const conversation = data?.conversation ?? null;
  const memos = data?.memos ?? [];
  const selectedMemo = memos.find((memo) => memo.id === memoId) ?? memos[0] ?? null;
  const title = conversation?.title ?? 'Conversación';

  const openMemo = (id: string) => {
    setMemoId(id);
    setTab('memo');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader className="space-y-1.5 pr-6 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle className="leading-snug">{isLoading ? 'Cargando...' : title}</DialogTitle>
            {conversation?.verdict && <FetitaVerdictBadge verdict={conversation.verdict} />}
          </div>
          {conversation ? (
            <HeaderMeta conversation={conversation} />
          ) : (
            <DialogDescription className="text-left">
              {isLoading ? 'Cargando la conversación...' : 'Detalle de la conversación'}
            </DialogDescription>
          )}
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-72" />
            <Skeleton className="h-24 w-3/4" />
            <Skeleton className="ml-auto h-16 w-2/3" />
            <Skeleton className="h-24 w-3/4" />
          </div>
        ) : isError ? (
          <QueryError
            message={error?.message || 'No pudimos cargar la conversación.'}
            onRetry={() => refetch()}
            retrying={isFetching}
          />
        ) : !conversation ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Esta conversación ya no existe: la persona la borró junto con sus mensajes y memos.
          </p>
        ) : (
          <Tabs value={tab} onValueChange={(value) => setTab(value as DialogTab)} className="space-y-4">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="conversacion" className="shrink-0 text-xs sm:text-sm">
                Conversación ({formatInteger(data.messages.length)})
              </TabsTrigger>
              <TabsTrigger value="memo" className="shrink-0 text-xs sm:text-sm">
                Memo y revisión ({formatInteger(memos.length)} {memos.length === 1 ? 'versión' : 'versiones'})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="conversacion">
              <FetitaTranscript messages={data.messages} memos={memos} onOpenMemo={openMemo} />
            </TabsContent>
            <TabsContent value="memo">
              <MemoSection memos={memos} selected={selectedMemo} title={title} onSelect={setMemoId} />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
