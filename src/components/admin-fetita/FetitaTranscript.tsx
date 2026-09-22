import { useMemo } from 'react';
import { AlertTriangle, FileText, ThumbsDown, ThumbsUp } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { FETITA_PROSE, FetitaMarkdown } from '@/components/fetita/FetitaMessageBubble';
import { FEEDBACK_REASONS, VERDICT_META } from '@/lib/fetita/types';
import {
  ADMIN_MESSAGE_STATUS_NOTE,
  formatDateTime,
  formatInteger,
  type FetitaAdminFeedback,
  type FetitaAdminMemoVersion,
  type FetitaAdminMessage,
} from './shared';

function Markdown({ children }: { children: string }) {
  return (
    <div className={FETITA_PROSE}>
      <FetitaMarkdown>{children}</FetitaMarkdown>
    </div>
  );
}

function Timestamp({ iso, align = 'left' }: { iso: string; align?: 'left' | 'right' }) {
  return (
    <p className={`text-[11px] text-muted-foreground ${align === 'right' ? 'text-right' : ''}`}>{formatDateTime(iso)}</p>
  );
}

function UserMessage({ message }: { message: FetitaAdminMessage }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] space-y-1.5">
        <div className="whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
          {message.content}
        </div>
        {message.material_chars ? (
          <div className="rounded-lg border bg-muted/40 text-xs">
            <Accordion type="single" collapsible>
              <AccordionItem value="material" className="border-0">
                <AccordionTrigger className="px-3 py-2 text-xs hover:no-underline">
                  <span className="flex items-center gap-1.5 text-left">
                    <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    Material pegado ({formatInteger(message.material_chars)} caracteres, no se guardó)
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-3">
                  {message.material_summary ? (
                    <>
                      <p className="mb-2 text-muted-foreground">
                        Lo que Fetita leyó del material. Es lo único que entró a la conversación y lo que ve el juez.
                      </p>
                      <Markdown>{message.material_summary}</Markdown>
                    </>
                  ) : (
                    <p className="text-muted-foreground">No quedó una lectura guardada de este material.</p>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        ) : null}
        <Timestamp iso={message.created_at} align="right" />
      </div>
    </div>
  );
}

function FeedbackBadge({ feedback }: { feedback: FetitaAdminFeedback }) {
  const positive = feedback.rating > 0;
  return (
    <div className="space-y-1">
      <Badge
        variant="outline"
        className={
          positive
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
            : 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300'
        }
      >
        {positive ? (
          <ThumbsUp className="mr-1 h-3 w-3" aria-hidden="true" />
        ) : (
          <ThumbsDown className="mr-1 h-3 w-3" aria-hidden="true" />
        )}
        {positive ? 'Le sirvió' : feedback.reason ? FEEDBACK_REASONS[feedback.reason] : 'No le sirvió'}
      </Badge>
      {feedback.comment && (
        <blockquote className="border-l-2 pl-2 text-xs italic text-muted-foreground">“{feedback.comment}”</blockquote>
      )}
    </div>
  );
}

function AssistantMessage({ message }: { message: FetitaAdminMessage }) {
  const note = ADMIN_MESSAGE_STATUS_NOTE[message.status];
  return (
    <div className="flex gap-3">
      <div
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
        aria-hidden="true"
      >
        F
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        {message.content.trim() ? (
          <Markdown>{message.content}</Markdown>
        ) : (
          <p className="text-sm italic text-muted-foreground">Sin texto visible.</p>
        )}
        {note && (
          <p className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {note}
          </p>
        )}
        {message.feedback.map((feedback, index) => (
          <FeedbackBadge key={index} feedback={feedback} />
        ))}
        <Timestamp iso={message.created_at} />
      </div>
    </div>
  );
}

function MemoMarker({ memo, onOpen }: { memo: FetitaAdminMemoVersion; onOpen: (memoId: string) => void }) {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <div className="h-px flex-1 bg-border" />
      <button
        type="button"
        onClick={() => onOpen(memo.id)}
        className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <FileText className="h-3.5 w-3.5" aria-hidden="true" />
        Memo v{memo.version} guardado · {VERDICT_META[memo.verdict].label}
      </button>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

interface FetitaTranscriptProps {
  messages: FetitaAdminMessage[];
  memos: FetitaAdminMemoVersion[];
  onOpenMemo: (memoId: string) => void;
}

/**
 * La conversación tal como la vio la persona, con marcas donde se guardó cada
 * versión del memo (por fecha) para cruzarla con lo que dice el juez.
 */
export function FetitaTranscript({ messages, memos, onOpenMemo }: FetitaTranscriptProps) {
  // Índice del último mensaje anterior a cada memo; -1 = antes de todos.
  const markersByIndex = useMemo(() => {
    const map = new Map<number, FetitaAdminMemoVersion[]>();
    const ascending = [...memos].sort((a, b) => a.version - b.version);
    for (const memo of ascending) {
      const memoTime = new Date(memo.created_at).getTime();
      let index = -1;
      messages.forEach((message, i) => {
        if (new Date(message.created_at).getTime() <= memoTime) index = i;
      });
      map.set(index, [...(map.get(index) ?? []), memo]);
    }
    return map;
  }, [messages, memos]);

  if (messages.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Esta conversación no tiene mensajes.</p>;
  }

  const renderMarkers = (index: number) =>
    (markersByIndex.get(index) ?? []).map((memo) => <MemoMarker key={memo.id} memo={memo} onOpen={onOpenMemo} />);

  return (
    <div className="space-y-5">
      {renderMarkers(-1)}
      {messages.map((message, index) => (
        <div key={message.id} className="space-y-5">
          {message.role === 'user' ? <UserMessage message={message} /> : <AssistantMessage message={message} />}
          {renderMarkers(index)}
        </div>
      ))}
    </div>
  );
}
