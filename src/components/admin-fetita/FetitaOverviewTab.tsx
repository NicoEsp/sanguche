import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  DollarSign,
  FileWarning,
  MessageSquare,
  ShieldAlert,
  ThumbsDown,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { FEEDBACK_REASONS } from '@/lib/fetita/types';
import { QueryError, RefreshButton, Stat, StatGridSkeleton } from './FetitaAdminUi';
import { BreakdownCard, DailyCostCard, QualityDetailCard, TechnicalCard } from './FetitaCostCards';
import { FetitaSettingsCard } from './FetitaSettingsCard';
import { FetitaUsageByUserCard } from './FetitaUsageByUserCard';
import {
  RANGE_PRESETS,
  buildDailySeries,
  formatCount,
  formatDecimal,
  formatInteger,
  formatPercent,
  formatUsd,
  presetToRange,
  runKindLabel,
  safeRatio,
  type FetitaOverview,
  type FetitaOverviewMonth,
  type FetitaRangePreset,
} from './shared';
import { useFetitaOverview, useFetitaSettings } from './useAdminFetita';

type MeterLevel = 'ok' | 'warning' | 'critical';

/** Medidor del presupuesto: la severidad va en el color y también en el texto. */
function BudgetMeter({ month }: { month: FetitaOverviewMonth }) {
  const ratio = safeRatio(month.spent_usd, month.monthly_budget_usd);
  // Con presupuesto 0 el RPC de estado frena a todos: se muestra como tope alcanzado.
  const pct = ratio === null ? 100 : Math.min(ratio * 100, 100);
  const level: MeterLevel = ratio === null || ratio >= 1 ? 'critical' : ratio >= 0.8 ? 'warning' : 'ok';
  return (
    <div className="mt-2 space-y-1">
      <div
        className={cn(
          'h-2 overflow-hidden rounded-full',
          level === 'ok' && 'bg-primary/15',
          level === 'warning' && 'bg-amber-500/20',
          level === 'critical' && 'bg-destructive/20',
        )}
        role="progressbar"
        aria-label="Presupuesto del mes usado"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all',
            level === 'ok' && 'bg-primary',
            level === 'warning' && 'bg-amber-500',
            level === 'critical' && 'bg-destructive',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {level !== 'ok' && (
        <p
          className={cn(
            'flex items-center gap-1 text-xs font-medium',
            level === 'warning' ? 'text-amber-700 dark:text-amber-400' : 'text-destructive',
          )}
        >
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {level === 'warning' ? 'Cerca del tope' : 'Tope alcanzado: Fetita no responde a nadie'}
        </p>
      )}
    </div>
  );
}

function ConsumptionRow({ data }: { data: FetitaOverview }) {
  const { totals, month } = data;
  const turnsPerUser = safeRatio(totals.chat_turns, totals.active_users);
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <Stat
        icon={DollarSign}
        label="Gasto del período"
        value={formatUsd(totals.cost_usd)}
        note={`${formatCount(totals.requests, 'llamada', 'llamadas')} a la API`}
        definition="Chat, lectura de material y juez, en el rango elegido."
      />
      <Stat
        icon={Wallet}
        label="Presupuesto del mes"
        value={month ? formatUsd(month.spent_usd) : 'Sin datos'}
        note={
          !month
            ? undefined
            : month.monthly_budget_usd > 0
              ? `de ${formatUsd(month.monthly_budget_usd)} (${formatPercent(month.spent_usd, month.monthly_budget_usd)})`
              : 'Presupuesto en 0'
        }
        definition="Mes en curso en hora de Argentina, sin importar el rango elegido."
      >
        {month && <BudgetMeter month={month} />}
      </Stat>
      <Stat
        icon={MessageSquare}
        label="Turnos de chat"
        value={formatInteger(totals.chat_turns)}
        note={
          turnsPerUser === null ? 'Sin usuarios activos' : `${formatDecimal(turnsPerUser)} por usuario activo`
        }
        definition="Mensajes de personas que llegaron a la API. Es lo que descuenta del cupo."
      />
      <Stat
        icon={Users}
        label="Usuarios activos"
        value={formatInteger(totals.active_users)}
        note="Con al menos un turno de chat"
        definition="Cuentas distintas que chatearon en el período."
      />
    </div>
  );
}

/** Juez automático y revisión humana van separados: el juez también es un modelo. */
function QualityRow({ data }: { data: FetitaOverview }) {
  const { checks, reviews, feedback } = data.quality;
  const reviewsTotal = (reviews.correcto ?? 0) + (reviews.alucinacion ?? 0) + (reviews.desafio_flojo ?? 0);
  const votes = feedback.up + feedback.down;
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <Stat
        icon={ShieldAlert}
        label="Tasa de alucinación (juez automático)"
        value={formatPercent(checks.claims_unsupported, checks.claims_total)}
        note={
          checks.claims_total > 0
            ? `${formatInteger(checks.claims_unsupported)} de ${formatCount(checks.claims_total, 'afirmación', 'afirmaciones')}, ${formatCount(checks.claims_partial, 'parcial', 'parciales')}`
            : 'Ningún memo evaluado en el período'
        }
        definition="Afirmaciones no soportadas sobre afirmaciones evaluadas. Las marca el juez (otro modelo) con la última evaluación exitosa de cada memo."
      />
      <Stat
        icon={FileWarning}
        label="Memos con afirmaciones no soportadas"
        value={formatPercent(checks.memos_with_unsupported, checks.memos_checked)}
        note={`${formatInteger(checks.memos_with_unsupported)} de ${formatCount(checks.memos_checked, 'memo evaluado', 'memos evaluados')} (${formatCount(data.quality.memos_total, 'escrito', 'escritos')})`}
        definition="Memos del período con al menos una afirmación no soportada, según el juez."
      />
      <Stat
        icon={UserCheck}
        label="Alucinación confirmada (tu revisión)"
        value={formatPercent(reviews.alucinacion ?? 0, reviewsTotal)}
        note={`${formatInteger(reviews.alucinacion ?? 0)} de ${formatCount(reviewsTotal, 'memo revisado', 'memos revisados')}`}
        definition="Memos del período que marcaste como Alucinación en la pestaña Calidad. No se mezcla con el juez."
      />
      <Stat
        icon={ThumbsDown}
        label="Feedback negativo"
        value={formatPercent(feedback.down, votes)}
        note={`${formatInteger(feedback.down)} de ${formatCount(votes, 'voto', 'votos')} · ${formatInteger(feedback.invento_algo)} por "Inventó algo"`}
        definition={`Pulgares abajo sobre votos a respuestas de Fetita. "${FEEDBACK_REASONS.invento_algo}" es el motivo que apunta a alucinaciones.`}
      />
    </div>
  );
}

export function FetitaOverviewTab() {
  const [preset, setPreset] = useState<FetitaRangePreset>('this_month');
  // El rango se calcula una vez por preset (y al tocar Actualizar), nunca en
  // cada render: si no, la queryKey cambiaría todo el tiempo.
  const [anchor, setAnchor] = useState(() => Date.now());
  const range = useMemo(() => presetToRange(preset, new Date(anchor)), [preset, anchor]);

  const overview = useFetitaOverview(range);
  const settings = useFetitaSettings();
  const { data, isLoading, isError, error, isFetching, isPlaceholderData, dataUpdatedAt } = overview;

  // Con placeholderData, data puede ser del rango anterior: la serie usa el
  // rango que devolvió el RPC para no mezclar días.
  const series = useMemo(() => {
    if (!data) return [];
    const dataRange = data.range.from && data.range.to ? data.range : range;
    return buildDailySeries(data.by_day, dataRange, new Date(dataUpdatedAt || Date.now()));
  }, [data, range, dataUpdatedAt]);

  const handleRefresh = () => {
    const next = presetToRange(preset, new Date());
    if (next.from === range.from && next.to === range.to) overview.refetch();
    else setAnchor(Date.now());
    settings.refetch();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Select
            value={preset}
            onValueChange={(value) => {
              setPreset(value as FetitaRangePreset);
              setAnchor(Date.now());
            }}
          >
            <SelectTrigger className="w-full sm:w-52" aria-label="Rango de fechas">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RANGE_PRESETS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <RefreshButton onClick={handleRefresh} refreshing={isFetching} />
        </div>
        <p className="text-xs text-muted-foreground">Fechas en hora de Argentina, igual que el cupo y el presupuesto.</p>
      </div>

      {isLoading ? (
        <>
          <StatGridSkeleton />
          <StatGridSkeleton />
        </>
      ) : isError || !data ? (
        <QueryError
          message={error?.message || 'No pudimos cargar el resumen de Fetita.'}
          onRetry={() => overview.refetch()}
          retrying={isFetching}
          className="rounded-lg border"
        />
      ) : (
        <div className={cn('space-y-4 transition-opacity sm:space-y-6', isPlaceholderData && 'opacity-60')}>
          <section className="space-y-3" aria-labelledby="fetita-consumo">
            <h2 id="fetita-consumo" className="text-sm font-semibold text-muted-foreground">
              Consumo
            </h2>
            <ConsumptionRow data={data} />
          </section>

          <section className="space-y-3" aria-labelledby="fetita-calidad">
            <h2 id="fetita-calidad" className="text-sm font-semibold text-muted-foreground">
              Calidad
            </h2>
            <QualityRow data={data} />
          </section>

          <DailyCostCard points={series} total={data.totals.cost_usd} />

          <div className="grid grid-cols-1 items-start gap-4 sm:gap-6 lg:grid-cols-2">
            <BreakdownCard
              title="Costo por modelo"
              description="Modelo que respondió (o el pedido, si la llamada falló)"
              total={data.totals.cost_usd}
              items={data.by_model.map((row) => ({
                key: row.model,
                label: row.model,
                cost: row.cost_usd,
                requests: row.requests,
              }))}
            />
            <BreakdownCard
              title="Costo por tipo de llamada"
              description="Para qué se usó la API"
              total={data.totals.cost_usd}
              items={data.by_kind.map((row) => ({
                key: row.kind,
                label: runKindLabel(row.kind),
                cost: row.cost_usd,
                requests: row.requests,
              }))}
            />
            <TechnicalCard totals={data.totals} />
            <QualityDetailCard quality={data.quality} />
          </div>

          <FetitaUsageByUserCard rows={data.by_user} totalCost={data.totals.cost_usd} fileTag={preset} />
        </div>
      )}

      <FetitaSettingsCard month={data?.month ?? null} />
    </div>
  );
}
