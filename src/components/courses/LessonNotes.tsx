import { useState, useEffect, useCallback, useRef } from 'react';
import { StickyNote, Check, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useLessonNote, useUpdateLessonNote } from '@/hooks/useLessonNotes';
import { cn } from '@/lib/utils';

interface LessonNotesProps {
  lessonId: string;
}

const SAVE_DELAY_MS = 1000;

/** Va montado con key por lección: cada lección arranca con su propio estado. */
export function LessonNotes({ lessonId }: LessonNotesProps) {
  const { data: note, isLoading } = useLessonNote(lessonId);
  const { mutateAsync: saveNote } = useUpdateLessonNote();

  // Lo escrito manda sobre la nota guardada. Antes cada guardado volvía a
  // copiar la nota al textarea: se perdía lo tipeado mientras viajaba el
  // request, y borrar todo el texto cerraba el editor.
  const [draft, setDraft] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const content = draft ?? note?.content ?? '';
  const isExpanded = expanded || draft !== null || !!note?.content;

  const pendingRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const idleTimerRef = useRef<ReturnType<typeof setTimeout>>();
  // Los guardados van en fila: dos upserts en vuelo podían llegar al revés
  // y dejar guardada la versión vieja.
  const queueRef = useRef<Promise<unknown>>(Promise.resolve());
  const saveNoteRef = useRef(saveNote);
  saveNoteRef.current = saveNote;

  const flush = useCallback(() => {
    clearTimeout(timerRef.current);
    const pending = pendingRef.current;
    if (pending === null) return;
    pendingRef.current = null;

    setSaveStatus('saving');
    clearTimeout(idleTimerRef.current);
    queueRef.current = queueRef.current
      .then(() => saveNoteRef.current({ lessonId, content: pending }))
      .then(
        () => {
          if (pendingRef.current !== null) return;
          setSaveStatus('saved');
          idleTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
        },
        (error) => {
          if (import.meta.env.DEV) console.error('Error saving note:', error);
          setSaveStatus('idle');
        }
      );
  }, [lessonId]);

  const handleContentChange = (newContent: string) => {
    setDraft(newContent);
    pendingRef.current = newContent;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, SAVE_DELAY_MS);
  };

  // Al cambiar de lección o salir de la página, lo pendiente se guarda en el
  // momento: antes el cleanup cancelaba el timer y se perdía el último segundo.
  useEffect(
    () => () => {
      flush();
      clearTimeout(idleTimerRef.current);
    },
    [flush]
  );

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando notas...
      </div>
    );
  }

  if (!isExpanded) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setExpanded(true)}
        className="text-muted-foreground hover:text-foreground"
      >
        <StickyNote className="h-4 w-4 mr-2" />
        Agregar nota
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <StickyNote className="h-4 w-4" />
          Mis notas
        </div>
        <div className={cn(
          "text-xs transition-opacity duration-200",
          saveStatus === 'idle' && "opacity-0",
          saveStatus === 'saving' && "text-muted-foreground",
          saveStatus === 'saved' && "text-green-600 dark:text-green-400"
        )}>
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Guardando...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1">
              <Check className="h-3 w-3" />
              Guardado
            </span>
          )}
        </div>
      </div>
      <Textarea
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        placeholder="Escribe tus notas aquí..."
        className="min-h-[100px] resize-y bg-muted/30 border-border/50 focus:border-primary/50"
      />
    </div>
  );
}
