import { useEffect, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import ReactMarkdown, { type Components } from 'react-markdown';
import { ArrowUp, Loader2, RotateCcw, ThumbsDown, ThumbsUp } from 'lucide-react';
import { toast } from 'sonner';
import { Seo } from '@/components/Seo';
import { FetitaIcon } from '@/components/fetita/FetitaIcon';
import { FetitaMascot } from '@/components/fetita/FetitaMascot';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import {
  fetitaMessagesKey,
  restartFetita,
  sendFetitaFeedback,
  sendToFetita,
  useFetitaAccess,
  useFetitaMessages,
  useFetitaPerfil,
} from '@/lib/fetita';

const SEO = {
  title: 'Fetita · ProductPrepa',
  description: 'Fetita, el agente de ProductPrepa que desafía tus decisiones de producto.',
  canonical: '/fetita',
  robots: 'noindex, nofollow',
};

const PROSE =
  'prose prose-sm prose-neutral dark:prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5';

// Las imágenes no se cargan: una URL armada mandaría datos de la conversación
// a un tercero apenas se muestra. Los links abren afuera.
const MARKDOWN: Components = {
  h1: 'h3',
  h2: 'h3',
  img: ({ alt }) => (alt ? <span>[{alt}]</span> : null),
  a: ({ node: _node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
};

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
        {text}
      </div>
    </div>
  );
}

function FetitaBubble({ text }: { text: string }) {
  return (
    <div className="flex gap-3">
      <FetitaIcon className="mt-0.5 h-7 w-7 shrink-0" />
      <div className={`min-w-0 flex-1 ${PROSE}`}>
        {text ? (
          <ReactMarkdown components={MARKDOWN}>{text}</ReactMarkdown>
        ) : (
          <p className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Fetita está pensando…
          </p>
        )}
      </div>
    </div>
  );
}

/** El pulgar sobre el cierre, con un comentario opcional. */
function ClosingFeedback({ messageId, onSaved }: { messageId: string; onSaved: () => void }) {
  const [rating, setRating] = useState<'up' | 'down' | null>(null);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);

  async function submit() {
    if (!rating) return;
    setSending(true);
    try {
      await sendFetitaFeedback(messageId, rating, comment);
      onSaved();
    } catch {
      toast.error('No pudimos guardar tu opinión. Probá otra vez.');
      setSending(false);
    }
  }

  return (
    <div className="ml-10 space-y-2 rounded-lg border bg-muted/30 p-3">
      <p className="text-sm font-medium">¿Te sirvió este cierre?</p>
      <div className="flex gap-2">
        {(['up', 'down'] as const).map((value) => (
          <Button
            key={value}
            size="sm"
            variant={rating === value ? 'default' : 'outline'}
            onClick={() => setRating(value)}
            aria-pressed={rating === value}
            className="gap-1.5"
          >
            {value === 'up' ? <ThumbsUp className="h-3.5 w-3.5" /> : <ThumbsDown className="h-3.5 w-3.5" />}
            {value === 'up' ? 'Sí' : 'No'}
          </Button>
        ))}
      </div>
      {rating && (
        <div className="space-y-2">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 1000))}
            rows={2}
            aria-label="Comentario sobre el cierre"
            placeholder="¿Algo para contarnos? Es opcional."
            className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button size="sm" onClick={() => void submit()} disabled={sending}>
            {sending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Enviar opinión
          </Button>
        </div>
      )}
    </div>
  );
}

/** /fetita: un hilo por persona con Fetita, que arranca sabiendo su evaluación. */
export default function Fetita() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const access = useFetitaAccess();
  const hasAccess = access.access;
  const messages = useFetitaMessages(profile?.id);
  const perfil = useFetitaPerfil(user?.id, profile?.name);
  const queryClient = useQueryClient();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  // De dónde llegó, para las métricas: ?src= en el link de invitación, la
  // navegación de la app o un link directo.
  const entryPoint = useRef(searchParams.get('src') ?? (location.key === 'default' ? 'link_directo' : 'app'));

  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState<{ question: string; reply: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const thread = messages.data ?? [];
  const isNewThread = thread.length === 0;
  // Sin el historial no se sabe si ya hay un hilo: no se muestra uno vacío.
  const threadFailed = messages.isError && messages.data === undefined;
  // useUserProfile no expone el error: si terminó sin perfil, no hay acceso ni hilo que buscar.
  const profileFailed = !!user && !profileLoading && !profile;
  // El perfil viaja con el primer mensaje: se espera a tenerlo.
  const waitingPerfil = isNewThread && perfil.isLoading;
  // Sin el perfil, Fetita arrancaría sin nombre ni evaluaciones: no se deja empezar.
  const perfilFailed = isNewThread && perfil.isError && perfil.data === undefined;
  const canSend = !pending && !waitingPerfil && !perfilFailed && hasAccess === true;

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [thread.length, pending?.reply, pending?.question]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: fetitaMessagesKey(profile?.id) });

  async function send(text: string) {
    const message = text.trim();
    if (!message || !canSend) return;
    setDraft('');
    setNotice(null);
    setPending({ question: message, reply: '' });

    const outcome: { saved: boolean; failure: string | null; dropped: boolean } = {
      saved: false,
      failure: null,
      dropped: false,
    };
    try {
      const opening = isNewThread ? { perfil: perfil.data, entry_point: entryPoint.current } : {};
      await sendToFetita({ message, ...opening }, (event) => {
        if (event.type === 'text') setPending((p) => p && { ...p, reply: p.reply + event.delta });
        else if (event.type === 'done') outcome.saved = true;
        else outcome.failure = event.message;
      });
      // Se cortó la conexión sin error: el servidor termina el turno y lo guarda igual.
      outcome.dropped = !outcome.saved && !outcome.failure;
    } catch (error) {
      outcome.failure = error instanceof Error ? error.message : 'No pudimos hablar con Fetita. Probá de nuevo.';
    }

    await refresh();
    setPending(null);
    if (outcome.dropped) {
      setNotice('Se cortó la conexión. Si Fetita llegó a responder, la respuesta aparece en unos segundos.');
      setTimeout(() => void refresh(), 15000);
    } else if (outcome.failure) {
      // No se guardó nada: el mensaje vuelve al campo.
      setNotice(outcome.failure);
      setDraft((d) => d || message);
    }
  }

  async function restart() {
    try {
      await restartFetita();
      entryPoint.current = 'empezar_de_nuevo';
      setNotice(null);
      await refresh();
    } catch {
      toast.error('No pudimos empezar de nuevo. Probá otra vez.');
    }
  }

  if (profileFailed || access.isError || threadFailed) {
    const retry = () => {
      if (profileFailed) void queryClient.invalidateQueries({ queryKey: ['user-profile', user?.id] });
      else if (access.isError) access.retry();
      else void messages.refetch();
    };
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <Seo {...SEO} />
        <div className="max-w-md space-y-3 text-center">
          <p className="text-sm text-muted-foreground">No pudimos cargar Fetita. Revisá tu conexión y probá de nuevo.</p>
          <Button variant="outline" size="sm" onClick={retry}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  // Mientras carga el perfil, el hilo todavía no se pidió (al admin el acceso le llega antes).
  if (hasAccess === undefined || (hasAccess && (profileLoading || messages.isLoading))) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Seo {...SEO} />
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <Seo {...SEO} />
        <div className="max-w-md space-y-2 text-center">
          <FetitaIcon className="mx-auto h-10 w-10" />
          <h1 className="text-lg font-semibold">Fetita está en prueba cerrada</h1>
          <p className="text-sm text-muted-foreground">
            Fetita es el agente de ProductPrepa que desafía tus decisiones de producto. Por ahora la están probando
            unas pocas personas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col">
      <Seo {...SEO} />

      <header className="flex items-center justify-between gap-2 border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <FetitaIcon className="h-6 w-6" />
          <h1 className="text-sm font-semibold">Fetita</h1>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">Beta</span>
        </div>
        {!isNewThread && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" disabled={!!pending} className="gap-1.5 text-muted-foreground">
                <RotateCcw className="h-3.5 w-3.5" />
                Empezar de nuevo
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Empezar de nuevo?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta conversación se cierra y Fetita arranca de cero, con tu evaluación actualizada.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => void restart()}>Empezar de nuevo</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
          {isNewThread && !pending ? (
            <div className="space-y-4 py-8 text-center">
              <FetitaMascot className="mx-auto h-32 w-auto" />
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Hola, soy Fetita</h2>
                <p className="mx-auto max-w-md text-sm text-muted-foreground">
                  Ya leí tu evaluación. Te voy a preguntar un poco sobre tu trabajo y hacia dónde querés ir, y después
                  te ayudo a desafiar una decisión de producto o un discovery que tengas entre manos.
                </p>
                <p className="mx-auto max-w-md text-xs text-muted-foreground">
                  Es una beta: la conversación se guarda para mejorar Fetita.
                </p>
              </div>
              {perfilFailed ? (
                <div className="space-y-2">
                  <p role="alert" className="text-sm text-destructive">
                    No pudimos cargar tu evaluación y Fetita la necesita para empezar.
                  </p>
                  <Button variant="outline" onClick={() => void perfil.refetch()}>
                    Reintentar
                  </Button>
                </div>
              ) : (
                <Button onClick={() => void send('Hola Fetita')} disabled={!canSend}>
                  {waitingPerfil ? 'Cargando tu evaluación…' : 'Empezar'}
                </Button>
              )}
            </div>
          ) : (
            <>
              {thread.map((m) =>
                m.role === 'user' ? (
                  <UserBubble key={m.id} text={m.content} />
                ) : (
                  <div key={m.id} className="space-y-3">
                    <FetitaBubble text={m.content} />
                    {m.verdict &&
                      (m.feedback ? (
                        <p className="pl-10 text-xs text-muted-foreground">Gracias por contarnos si te sirvió.</p>
                      ) : (
                        <ClosingFeedback messageId={m.id} onSaved={() => void refresh()} />
                      ))}
                  </div>
                ),
              )}
              {pending && (
                <>
                  <UserBubble text={pending.question} />
                  <FetitaBubble text={pending.reply} />
                </>
              )}
            </>
          )}
        </div>
      </div>

      <div className="border-t bg-background px-4 py-3">
        <div className="mx-auto max-w-3xl space-y-2">
          {notice && (
            <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {notice}
            </p>
          )}
          <div className="flex items-end gap-2 rounded-2xl border bg-background p-2 focus-within:ring-2 focus-within:ring-ring">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, 8000))}
              onKeyDown={(e) => {
                // En pantallas táctiles Enter hace salto de línea y se manda con el botón.
                const touch = window.matchMedia?.('(pointer: coarse)').matches;
                if (e.key === 'Enter' && !e.shiftKey && !touch && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  void send(draft);
                }
              }}
              rows={2}
              aria-label="Mensaje para Fetita"
              placeholder={pending ? 'Fetita está respondiendo…' : 'Escribile a Fetita'}
              className="max-h-48 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
            />
            <Button
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => void send(draft)}
              disabled={!canSend || !draft.trim()}
              aria-label="Enviar"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
            </Button>
          </div>
          <p className="px-1 text-[11px] text-muted-foreground">Fetita puede equivocarse: chequeá lo que afirma.</p>
        </div>
      </div>
    </div>
  );
}
