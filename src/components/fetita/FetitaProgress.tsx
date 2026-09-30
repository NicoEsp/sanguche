import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FETITA_MAX_MESSAGES, FETITA_STEPS, type FetitaStep } from '@/lib/fetita';

interface Props {
  step: FetitaStep;
  /** Mensajes que mandó la persona, contando el que está esperando respuesta. */
  sent: number;
  closed: boolean;
}

/** Dónde está la conversación: el paso, cuántos mensajes van y qué se busca en este momento. */
export function FetitaProgress({ step, sent, closed }: Props) {
  const current = closed ? FETITA_STEPS.length : FETITA_STEPS.findIndex((s) => s.key === step);
  const left = Math.max(FETITA_MAX_MESSAGES - sent, 0);

  return (
    <div className="border-b bg-muted/20 px-4 py-2.5">
      <div className="mx-auto max-w-3xl space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <ol className="flex items-center gap-1.5 text-xs" aria-label="Pasos de la conversación">
            {FETITA_STEPS.map((s, i) => {
              const done = i < current;
              const active = i === current;
              return (
                <li key={s.key} aria-current={active ? 'step' : undefined} className="flex items-center gap-1.5">
                  {i > 0 && <span className={cn('h-px w-3 sm:w-6', done || active ? 'bg-primary' : 'bg-border')} />}
                  <span
                    className={cn(
                      'flex items-center gap-1 rounded-full px-2 py-0.5 font-medium',
                      active && 'bg-primary text-primary-foreground',
                      done && 'text-primary',
                      !active && !done && 'text-muted-foreground',
                    )}
                  >
                    {done ? (
                      <Check className="h-3 w-3" aria-hidden="true" />
                    ) : (
                      <span aria-hidden="true">{i + 1}</span>
                    )}
                    {s.label}
                  </span>
                </li>
              );
            })}
          </ol>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {closed ? 'Cerrada' : `Mensaje ${Math.min(sent, FETITA_MAX_MESSAGES)} de ${FETITA_MAX_MESSAGES}`}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {closed
            ? 'Fetita cerró la conversación. Si quedaste con ganas de más, empezá de nuevo.'
            : left <= 2 && step !== 'closing'
              ? `Quedan ${left === 0 ? 'ningún mensaje' : left === 1 ? '1 mensaje' : `${left} mensajes`}: Fetita va a cerrar con un veredicto.`
              : `Ahora: ${FETITA_STEPS[current]?.goal ?? ''}`}
        </p>
      </div>
    </div>
  );
}
