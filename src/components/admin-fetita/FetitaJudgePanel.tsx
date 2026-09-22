import { useMemo } from 'react';
import { AlertTriangle, Loader2, RotateCcw } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  JUDGE_VERDICT_META,
  JUDGE_VERDICT_ORDER,
  formatDateTime,
  formatCount,
  formatUsd,
  type FetitaAdminMemoVersion,
  type FetitaJudgeClaim,
  type FetitaMemoCheckDetail,
} from './shared';
import { useReevaluateFetitaMemo } from './useAdminFetita';

function ClaimItem({ claim }: { claim: FetitaJudgeClaim }) {
  const meta = JUDGE_VERDICT_META[claim.veredicto];
  return (
    <li className={cn('space-y-1.5 rounded-md border border-l-4 p-3', meta.accentClass)}>
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="outline" className={meta.className}>
          {meta.label}
        </Badge>
        {claim.campo && <span className="text-xs text-muted-foreground">{claim.campo}</span>}
      </div>
      <p className="text-sm">{claim.afirmacion}</p>
      {claim.evidencia ? (
        <blockquote className="border-l-2 pl-2 text-xs italic text-muted-foreground">“{claim.evidencia}”</blockquote>
      ) : (
        <p className="text-xs text-muted-foreground">Sin evidencia en la conversación.</p>
      )}
      {claim.comentario && <p className="text-xs text-muted-foreground">{claim.comentario}</p>}
    </li>
  );
}

function CheckResult({ check }: { check: FetitaMemoCheckDetail }) {
  const { flagged, supported } = useMemo(() => {
    const claims = check.result?.afirmaciones ?? [];
    const order = (claim: FetitaJudgeClaim) => JUDGE_VERDICT_ORDER.indexOf(claim.veredicto);
    const sorted = [...claims].sort((a, b) => order(a) - order(b));
    return {
      flagged: sorted.filter((claim) => claim.veredicto !== 'soportada'),
      supported: sorted.filter((claim) => claim.veredicto === 'soportada'),
    };
  }, [check.result]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <Badge variant="outline" className={JUDGE_VERDICT_META.no_soportada.className}>
          {formatCount(check.claims_unsupported, 'no soportada', 'no soportadas')}
        </Badge>
        <Badge variant="outline" className={JUDGE_VERDICT_META.parcial.className}>
          {formatCount(check.claims_partial, 'parcial', 'parciales')}
        </Badge>
        <Badge variant="outline" className={JUDGE_VERDICT_META.soportada.className}>
          {formatCount(check.claims_supported, 'soportada', 'soportadas')}
        </Badge>
        <span className="text-muted-foreground">de {formatCount(check.claims_total, 'afirmación', 'afirmaciones')}</span>
      </div>
      <p className="text-[11px] text-muted-foreground">
        {check.model || 'Modelo desconocido'} · {formatDateTime(check.created_at)} · {formatUsd(check.cost_usd)}
      </p>

      {!check.result ? (
        <p className="text-sm text-muted-foreground">El detalle de esta evaluación no quedó guardado.</p>
      ) : (
        <>
          {check.result.resumen && (
            <div className="rounded-md bg-muted/50 p-3 text-sm">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resumen del juez</p>
              {check.result.resumen}
            </div>
          )}
          {check.result.afirmaciones.length === 0 ? (
            <p className="text-sm text-muted-foreground">El juez no encontró afirmaciones de hecho en este memo.</p>
          ) : (
            <>
              {flagged.length > 0 ? (
                <ul className="space-y-2">
                  {flagged.map((claim, index) => (
                    <ClaimItem key={`flagged-${index}`} claim={claim} />
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-emerald-700 dark:text-emerald-400">
                  Todas las afirmaciones tienen respaldo en la conversación.
                </p>
              )}
              {supported.length > 0 && (
                <Accordion type="single" collapsible>
                  <AccordionItem value="soportadas" className="border-0">
                    <AccordionTrigger className="py-2 text-sm">
                      {formatCount(supported.length, 'afirmación soportada', 'afirmaciones soportadas')}
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-2">
                        {supported.map((claim, index) => (
                          <ClaimItem key={`supported-${index}`} claim={claim} />
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

/** Lo que dijo el juez automático sobre una versión del memo, con opción de reevaluar. */
export function FetitaJudgePanel({ memo }: { memo: FetitaAdminMemoVersion }) {
  const reevaluate = useReevaluateFetitaMemo();
  const evaluatingThis = reevaluate.isPending && reevaluate.variables === memo.id;
  const { latestCheck, latestOkCheck } = memo;
  const lastFailed = latestCheck?.status === 'error';
  const shownCheck = latestCheck?.status === 'ok' ? latestCheck : latestOkCheck;

  return (
    <section className="space-y-3 rounded-lg border p-4" aria-labelledby={`judge-${memo.id}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <h3 id={`judge-${memo.id}`} className="text-sm font-semibold">
            Juez de alucinaciones
          </h3>
          <p className="text-xs text-muted-foreground">
            Otro modelo compara cada afirmación del memo con la conversación hasta ese momento.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => reevaluate.mutate(memo.id)}
          disabled={reevaluate.isPending}
          title="Corre el juez de nuevo sobre esta versión. Consume API."
        >
          {evaluatingThis ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RotateCcw className="mr-2 h-4 w-4" />
          )}
          Reevaluar
        </Button>
      </div>

      {evaluatingThis && (
        <p className="text-xs text-muted-foreground">El juez está evaluando. Puede tardar hasta un par de minutos.</p>
      )}

      {!latestCheck && !evaluatingThis && (
        <p className="text-sm text-muted-foreground">
          Esta versión todavía no se evaluó. El juez corre solo al guardar el memo; si no hay resultado, reevaluala.
        </p>
      )}

      {lastFailed && (
        <div className="flex gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div className="min-w-0 space-y-0.5">
            <p className="font-medium">La última evaluación falló ({formatDateTime(latestCheck.created_at)})</p>
            <p className="break-words text-xs">{latestCheck.error || 'Sin detalle del error.'}</p>
          </div>
        </div>
      )}

      {shownCheck && (
        <>
          {lastFailed && (
            <p className="text-xs text-muted-foreground">Resultado de la última evaluación exitosa:</p>
          )}
          <CheckResult check={shownCheck} />
        </>
      )}

      {memo.checksCount > 1 && (
        <p className="text-[11px] text-muted-foreground">Esta versión se evaluó {memo.checksCount} veces.</p>
      )}
    </section>
  );
}
