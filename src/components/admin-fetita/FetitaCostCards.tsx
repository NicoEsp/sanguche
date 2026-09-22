import { useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { FEEDBACK_REASONS, VERDICT_META, type FetitaFeedbackReason } from '@/lib/fetita/types';
import { Row, Rows } from './FetitaAdminUi';
import {
  VERDICT_ORDER,
  formatCount,
  formatDayKey,
  formatInteger,
  formatLatency,
  formatPercent,
  formatTokens,
  formatUsd,
  safeRatio,
  type FetitaDayPoint,
  type FetitaOverviewQuality,
  type FetitaOverviewTotals,
} from './shared';

/**
 * Costo por día en columnas de divs (admin no usa librería de gráficos). Una
 * sola serie, así que no lleva leyenda: el título dice qué se grafica. Al pasar
 * el mouse, la línea de arriba muestra el día; si no, muestra el pico.
 */
export function DailyCostCard({ points, total }: { points: FetitaDayPoint[]; total: number }) {
  const [active, setActive] = useState<number | null>(null);

  const { max, peakIndex } = useMemo(() => {
    let maxValue = 0;
    let peak = -1;
    points.forEach((point, index) => {
      if (point.cost_usd > maxValue) {
        maxValue = point.cost_usd;
        peak = index;
      }
    });
    return { max: maxValue, peakIndex: peak };
  }, [points]);

  const shownIndex = active ?? (peakIndex >= 0 ? peakIndex : null);
  const shown = shownIndex !== null ? points[shownIndex] : null;
  const hasData = max > 0;
  const middle = points.length > 2 ? points[Math.floor((points.length - 1) / 2)] : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Costo por día</CardTitle>
        <CardDescription>
          {formatUsd(total)} en el período. Días en hora de Argentina.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No hubo consumo en este período.</p>
        ) : (
          <>
            <div className="mb-1 flex items-end justify-between gap-3">
              <p className="min-h-5 text-xs text-muted-foreground" aria-live="polite">
                {shown && (
                  <>
                    <span className="font-medium text-foreground">
                      {active === null ? 'Pico: ' : ''}
                      {formatDayKey(shown.day, true)}
                    </span>
                    {' · '}
                    {formatUsd(shown.cost_usd)} · {formatCount(shown.chat_turns, 'turno de chat', 'turnos de chat')} ·{' '}
                    {formatCount(shown.requests, 'llamada', 'llamadas')}
                  </>
                )}
              </p>
              {/* La línea de arriba del gráfico marca el máximo. */}
              <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">máx. {formatUsd(max)}</span>
            </div>
            <div>
              <div
                className="flex h-40 items-end gap-0.5 border-b border-t border-border/60"
                role="img"
                aria-label={`Costo por día. Total ${formatUsd(total)}. Pico de ${formatUsd(max)}${
                  peakIndex >= 0 ? ` el ${formatDayKey(points[peakIndex].day, true)}` : ''
                }.`}
                onMouseLeave={() => setActive(null)}
              >
                {points.map((point, index) => {
                  const pct = (point.cost_usd / max) * 100;
                  return (
                    <div
                      key={point.day}
                      className="flex h-full min-w-0 flex-1 items-end justify-center"
                      onMouseEnter={() => setActive(index)}
                      title={`${formatDayKey(point.day, true)}: ${formatUsd(point.cost_usd)}`}
                    >
                      {point.cost_usd > 0 && (
                        <div
                          className={cn(
                            'w-full max-w-6 rounded-t bg-primary/70 transition-colors',
                            index === shownIndex && 'bg-primary',
                          )}
                          style={{ height: `${Math.max(pct, 1.5)}%` }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-1.5 flex justify-between text-[10px] tabular-nums text-muted-foreground">
              <span>{formatDayKey(points[0].day)}</span>
              {middle && <span>{formatDayKey(middle.day)}</span>}
              <span>{formatDayKey(points[points.length - 1].day)}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export interface BreakdownItem {
  key: string;
  label: string;
  cost: number;
  requests: number;
}

/** Barras horizontales finas, como "Evaluaciones por perfil" en AdminDashboard. */
export function BreakdownCard({
  title,
  description,
  items,
  total,
}: {
  title: string;
  description: string;
  items: BreakdownItem[];
  total: number;
}) {
  const max = Math.max(...items.map((item) => item.cost), 0);
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Sin llamadas en el período.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.key}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate" title={item.label}>
                    {item.label}
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums">{formatUsd(item.cost)}</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${max > 0 ? (item.cost / max) * 100 : 0}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatCount(item.requests, 'llamada', 'llamadas')} · {formatPercent(item.cost, total)} del gasto
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function TechnicalCard({ totals }: { totals: FetitaOverviewTotals }) {
  const cacheBase = totals.input_tokens + totals.cache_read_tokens + totals.cache_write_tokens;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Detalle técnico</CardTitle>
        <CardDescription>Tokens, caché, latencia y fallas de la API en el período</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {totals.unpriced > 0 && (
          <Badge
            variant="outline"
            className="h-auto whitespace-normal border-amber-500/40 bg-amber-500/10 py-1 text-amber-800 dark:text-amber-300"
          >
            <AlertTriangle className="mr-1.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {formatCount(totals.unpriced, 'llamada usó', 'llamadas usaron')} un modelo sin precio cargado y se cobró
            como Opus 5
          </Badge>
        )}
        <Rows>
          <Row label="Llamadas a la API">{formatInteger(totals.requests)}</Row>
          <Row label="Tokens de entrada">{formatTokens(totals.input_tokens)}</Row>
          <Row label="Tokens de salida">{formatTokens(totals.output_tokens)}</Row>
          <Row label="Lectura de caché">{formatTokens(totals.cache_read_tokens)}</Row>
          <Row label="Escritura de caché">{formatTokens(totals.cache_write_tokens)}</Row>
          <Row label="Aciertos de caché">
            <span title="Lectura de caché sobre el total de tokens de entrada (normales, leídos y escritos en caché)">
              {formatPercent(totals.cache_read_tokens, cacheBase)}
            </span>
          </Row>
          <Row label="Latencia promedio (chat)">{formatLatency(totals.avg_latency_ms)}</Row>
          <Row label="Latencia p95 (chat)">{formatLatency(totals.p95_latency_ms)}</Row>
          <Row label="Errores">
            <span className={cn(totals.errors > 0 && 'font-semibold text-destructive')}>
              {formatInteger(totals.errors)}
            </span>
          </Row>
          <Row label="Rechazos del modelo (refusal)">{formatInteger(totals.refusals)}</Row>
          <Row label="Respuestas con modelo de respaldo">{formatInteger(totals.fallbacks)}</Row>
        </Rows>
      </CardContent>
    </Card>
  );
}

const REASON_KEYS = Object.keys(FEEDBACK_REASONS) as FetitaFeedbackReason[];

/** Veredictos de los memos y motivos del feedback, en crudo. */
export function QualityDetailCard({ quality }: { quality: FetitaOverviewQuality }) {
  const votes = quality.feedback.up + quality.feedback.down;
  const votedShare = safeRatio(votes, quality.assistant_messages);
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Memos y feedback</CardTitle>
        <CardDescription>Veredictos de los memos y votos de las personas en el período</CardDescription>
      </CardHeader>
      <CardContent>
        <Rows>
          <Row label="Memos escritos">{formatInteger(quality.memos_total)}</Row>
          {VERDICT_ORDER.map((verdict) => (
            <Row key={verdict} label={VERDICT_META[verdict].label}>
              {formatInteger(quality.verdicts[verdict] ?? 0)}
            </Row>
          ))}
          <Row label="Respuestas de Fetita">{formatInteger(quality.assistant_messages)}</Row>
          <Row label="Respuestas con voto">
            {formatInteger(votes)}
            {votedShare !== null && (
              <span className="ml-2 text-xs text-muted-foreground">{formatPercent(votes, quality.assistant_messages)}</span>
            )}
          </Row>
          <Row label="Pulgar arriba">{formatInteger(quality.feedback.up)}</Row>
          <Row label="Pulgar abajo">{formatInteger(quality.feedback.down)}</Row>
          {REASON_KEYS.map((reason) => (
            <Row key={reason} label={<span className="pl-3">{FEEDBACK_REASONS[reason]}</span>}>
              {formatInteger(quality.feedback[reason])}
            </Row>
          ))}
        </Rows>
      </CardContent>
    </Card>
  );
}
