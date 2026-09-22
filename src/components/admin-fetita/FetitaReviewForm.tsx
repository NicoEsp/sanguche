import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  REVIEW_STATUS_META,
  REVIEW_STATUS_ORDER,
  formatDateTime,
  type FetitaAdminMemoVersion,
  type FetitaReviewStatus,
} from './shared';
import { useReviewFetitaMemo } from './useAdminFetita';

const MAX_NOTE = 2000;
const NO_REVIEW = 'none';

type StatusValue = FetitaReviewStatus | typeof NO_REVIEW;

/**
 * La revisión manual del admin sobre una versión del memo. Es privada y es la
 * que cuenta para "Alucinación confirmada" en el resumen. Se monta con key por
 * memo y fecha de revisión, así que el estado inicial siempre es el guardado.
 */
export function FetitaReviewForm({ memo }: { memo: FetitaAdminMemoVersion }) {
  const mutation = useReviewFetitaMemo();
  const initialStatus: StatusValue = memo.review?.status ?? NO_REVIEW;
  const initialNote = memo.review?.note ?? '';
  const [status, setStatus] = useState<StatusValue>(initialStatus);
  const [note, setNote] = useState(initialNote);

  const trimmedNote = note.trim();
  const noteTooLong = trimmedNote.length > MAX_NOTE;
  const dirty =
    status !== initialStatus || (status !== NO_REVIEW && trimmedNote !== initialNote.trim());
  const clearing = status === NO_REVIEW && !!memo.review;

  const handleSave = () => {
    if (!dirty || noteTooLong) return;
    mutation.mutate({
      memoId: memo.id,
      status: status === NO_REVIEW ? null : status,
      note: status === NO_REVIEW ? null : trimmedNote || null,
    });
  };

  const fieldId = `fetita-review-${memo.id}`;

  return (
    <section className="space-y-3 rounded-lg border p-4" aria-labelledby={`${fieldId}-title`}>
      <div className="space-y-0.5">
        <h3 id={`${fieldId}-title`} className="text-sm font-semibold">
          Tu revisión
        </h3>
        <p className="text-xs text-muted-foreground">
          Privada: la persona no la ve. Marcá Alucinación sólo si el memo afirma algo que no se dijo.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${fieldId}-status`}>Estado</Label>
        <Select value={status} onValueChange={(value) => setStatus(value as StatusValue)} disabled={mutation.isPending}>
          <SelectTrigger id={`${fieldId}-status`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_REVIEW}>Sin revisión</SelectItem>
            {REVIEW_STATUS_ORDER.map((item) => (
              <SelectItem key={item} value={item}>
                {REVIEW_STATUS_META[item].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {status === NO_REVIEW
            ? clearing
              ? 'Al guardar se borra la revisión actual.'
              : 'Elegí un estado para revisar esta versión.'
            : REVIEW_STATUS_META[status].description}
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <Label htmlFor={`${fieldId}-note`}>Nota</Label>
          <span className={`text-xs tabular-nums ${noteTooLong ? 'text-destructive' : 'text-muted-foreground'}`}>
            {trimmedNote.length}/{MAX_NOTE}
          </span>
        </div>
        <Textarea
          id={`${fieldId}-note`}
          rows={3}
          placeholder={status === NO_REVIEW ? 'Elegí un estado para dejar una nota' : 'Qué afirmación inventó, qué faltó desafiar...'}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          disabled={status === NO_REVIEW || mutation.isPending}
          aria-invalid={noteTooLong}
        />
        {noteTooLong && <p className="text-xs text-destructive">La nota puede tener hasta {MAX_NOTE} caracteres.</p>}
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] text-muted-foreground">
          {memo.review ? `Revisado el ${formatDateTime(memo.review.reviewed_at)}` : 'Todavía sin revisar'}
        </p>
        <Button size="sm" onClick={handleSave} disabled={!dirty || noteTooLong || mutation.isPending}>
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar
        </Button>
      </div>
    </section>
  );
}
