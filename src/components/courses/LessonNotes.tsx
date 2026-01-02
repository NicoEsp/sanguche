import { useState, useEffect, useCallback } from 'react';
import { StickyNote, Check, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useLessonNote, useUpdateLessonNote } from '@/hooks/useLessonNotes';
import { cn } from '@/lib/utils';

interface LessonNotesProps {
  lessonId: string;
}

export function LessonNotes({ lessonId }: LessonNotesProps) {
  const { data: note, isLoading } = useLessonNote(lessonId);
  const updateNote = useUpdateLessonNote();
  
  const [content, setContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Sync content when note loads or lesson changes
  useEffect(() => {
    if (note?.content) {
      setContent(note.content);
      setIsExpanded(true);
    } else {
      setContent('');
      setIsExpanded(false);
    }
    setSaveStatus('idle');
  }, [note, lessonId]);

  // Auto-save with debounce
  const saveNote = useCallback(async (newContent: string) => {
    if (!lessonId) return;
    
    setSaveStatus('saving');
    try {
      await updateNote.mutateAsync({ lessonId, content: newContent });
      setSaveStatus('saved');
      // Reset to idle after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving note:', error);
      setSaveStatus('idle');
    }
  }, [lessonId, updateNote]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    
    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    // Set new timer for auto-save (1 second debounce)
    const timer = setTimeout(() => {
      saveNote(newContent);
    }, 1000);
    
    setDebounceTimer(timer);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

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
        onClick={() => setIsExpanded(true)}
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
