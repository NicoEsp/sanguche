import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { profileEmail, profileName, type FetitaAccessRow } from './shared';
import { useSetFetitaAccess } from './useAdminFetita';

const MAX_NOTE = 500;
const MAX_LIMIT = 10000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FetitaAccessDialogProps {
  open: boolean;
  /** null = habilitar a alguien nuevo por email. */
  target: FetitaAccessRow | null;
  defaultLimit: number | null;
  onClose: () => void;
}

/**
 * Alta y edición de un acceso. El RPC pisa todos los campos, así que al editar
 * se manda el estado actual (habilitado o no) tal cual: este diálogo no
 * habilita ni deshabilita, eso se hace desde la tabla.
 */
export function FetitaAccessDialog({ open, target, defaultLimit, onClose }: FetitaAccessDialogProps) {
  const mutation = useSetFetitaAccess();
  const [email, setEmail] = useState('');
  const [limit, setLimit] = useState('');
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const isEdit = !!target;

  useEffect(() => {
    if (!open) return;
    setEmail(target?.profile?.email ?? '');
    setLimit(target?.monthly_message_limit != null ? String(target.monthly_message_limit) : '');
    setNote(target?.note ?? '');
    setSubmitted(false);
  }, [open, target]);

  const trimmedEmail = email.trim();
  const trimmedLimit = limit.trim();
  const limitValue = trimmedLimit === '' ? null : Number(trimmedLimit);

  const emailError = isEdit
    ? null
    : !trimmedEmail
      ? 'Ingresá el email de la cuenta.'
      : !EMAIL_PATTERN.test(trimmedEmail)
        ? 'Ese email no parece válido.'
        : null;
  const limitError =
    limitValue !== null && (!Number.isInteger(limitValue) || limitValue < 1 || limitValue > MAX_LIMIT)
      ? 'Tiene que ser un número entero entre 1 y 10.000, o quedar vacío.'
      : null;
  const noteError = note.trim().length > MAX_NOTE ? `La nota puede tener hasta ${MAX_NOTE} caracteres.` : null;
  const hasErrors = !!emailError || !!limitError || !!noteError;

  const handleClose = () => {
    if (!mutation.isPending) onClose();
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (hasErrors) return;
    mutation.mutate(
      {
        action: isEdit ? 'update' : 'create',
        targetProfileId: target?.user_id,
        email: isEdit ? undefined : trimmedEmail,
        enabled: isEdit ? target.enabled : true,
        monthlyMessageLimit: limitValue,
        note: note.trim() || null,
        displayName: isEdit ? profileName(target.profile) : trimmedEmail,
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Editar acceso' : 'Habilitar usuario'}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? 'Cambiá el cupo mensual o la nota. Para habilitar o deshabilitar, usá el interruptor de la tabla.'
                : 'La persona tiene que tener cuenta en ProductPrepa. Si ya tenía un acceso, se vuelve a habilitar con estos datos.'}
            </DialogDescription>
          </DialogHeader>

          {isEdit ? (
            <div className="space-y-1 rounded-lg border bg-muted/40 p-3">
              <p className="text-sm font-medium">{profileName(target.profile)}</p>
              <p className="text-xs text-muted-foreground">{profileEmail(target.profile)}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="fetita-access-email">Email</Label>
              <Input
                id="fetita-access-email"
                type="email"
                autoComplete="off"
                placeholder="persona@empresa.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={submitted && !!emailError}
                disabled={mutation.isPending}
                autoFocus
              />
              {submitted && emailError && <p className="text-xs text-destructive">{emailError}</p>}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="fetita-access-limit">Límite mensual de mensajes</Label>
            <Input
              id="fetita-access-limit"
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_LIMIT}
              step={1}
              placeholder={defaultLimit != null ? `Default (${defaultLimit})` : 'Default'}
              value={limit}
              onChange={(event) => setLimit(event.target.value)}
              aria-invalid={submitted && !!limitError}
              disabled={mutation.isPending}
            />
            {submitted && limitError ? (
              <p className="text-xs text-destructive">{limitError}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Vacío usa el default de la configuración
                {defaultLimit != null ? ` (${defaultLimit} por mes)` : ''}. El cupo se renueva el primer día de cada mes.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <Label htmlFor="fetita-access-note">Nota interna</Label>
              <span className={`text-xs tabular-nums ${noteError ? 'text-destructive' : 'text-muted-foreground'}`}>
                {note.trim().length}/{MAX_NOTE}
              </span>
            </div>
            <Textarea
              id="fetita-access-note"
              rows={3}
              placeholder="Por qué la habilitaste, empresa, a quién avisar..."
              value={note}
              onChange={(event) => setNote(event.target.value)}
              aria-invalid={!!noteError}
              disabled={mutation.isPending}
            />
            {noteError ? (
              <p className="text-xs text-destructive">{noteError}</p>
            ) : (
              <p className="text-xs text-muted-foreground">Sólo la ven los admins.</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleClose} disabled={mutation.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending || (submitted && hasErrors)}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Guardar' : 'Habilitar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
