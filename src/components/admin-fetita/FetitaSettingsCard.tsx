import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { QueryError } from './FetitaAdminUi';
import { formatDateTime, formatPercent, formatUsd, type FetitaOverviewMonth } from './shared';
import { useFetitaSettings, useUpdateFetitaSettings } from './useAdminFetita';

const MAX_BUDGET_USD = 100000;
const MAX_MONTHLY_MESSAGES = 10000;

function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}

function parseBudget(raw: string): { value: number; error: string | null } {
  const value = raw.trim() === '' ? NaN : Number(raw);
  if (!Number.isFinite(value)) return { value, error: 'Ingresá un monto en dólares.' };
  if (value < 0 || value > MAX_BUDGET_USD) return { value, error: 'Tiene que estar entre 0 y 100.000 USD.' };
  return { value: roundCents(value), error: null };
}

function parseMessages(raw: string): { value: number; error: string | null } {
  const value = raw.trim() === '' ? NaN : Number(raw);
  if (!Number.isInteger(value)) return { value, error: 'Ingresá un número entero.' };
  if (value < 1 || value > MAX_MONTHLY_MESSAGES) return { value, error: 'Tiene que estar entre 1 y 10.000.' };
  return { value, error: null };
}

/**
 * Interruptor general, presupuesto y cupo por defecto. El interruptor se
 * aplica al toque (es el freno de emergencia) y los números con "Guardar". El
 * RPC pide siempre los tres valores: cada acción manda los otros tal como
 * están guardados.
 */
export function FetitaSettingsCard({ month }: { month?: FetitaOverviewMonth | null }) {
  const { data: settings, isLoading, isError, error, refetch, isFetching } = useFetitaSettings();
  const toggle = useUpdateFetitaSettings();
  const save = useUpdateFetitaSettings();

  // null = sin tocar: se muestra lo guardado. Así no hay un render con el
  // campo vacío, y activar o pausar no pisa lo que el admin esté editando.
  const [budgetDraft, setBudgetDraft] = useState<string | null>(null);
  const [messagesDraft, setMessagesDraft] = useState<string | null>(null);
  const [confirmPause, setConfirmPause] = useState(false);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !settings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuración</CardTitle>
        </CardHeader>
        <CardContent>
          <QueryError
            message={
              isError
                ? error?.message || 'No pudimos cargar la configuración.'
                : 'No encontramos la fila de configuración de Fetita.'
            }
            onRetry={() => refetch()}
            retrying={isFetching}
          />
        </CardContent>
      </Card>
    );
  }

  const budget = budgetDraft ?? String(settings.monthly_budget_usd);
  const messages = messagesDraft ?? String(settings.default_monthly_messages);
  const budgetParsed = parseBudget(budget);
  const messagesParsed = parseMessages(messages);
  const hasErrors = !!budgetParsed.error || !!messagesParsed.error;
  const dirty =
    (!budgetParsed.error && budgetParsed.value !== settings.monthly_budget_usd) ||
    (!messagesParsed.error && messagesParsed.value !== settings.default_monthly_messages) ||
    hasErrors;

  const applyEnabled = (enabled: boolean) => {
    toggle.mutate(
      {
        enabled,
        monthlyBudgetUsd: settings.monthly_budget_usd,
        defaultMonthlyMessages: settings.default_monthly_messages,
        successMessage: enabled ? 'Fetita está activa de nuevo' : 'Fetita quedó en pausa',
      },
      { onSettled: () => setConfirmPause(false) },
    );
  };

  const handleSave = () => {
    if (hasErrors) return;
    save.mutate({
      enabled: settings.enabled,
      monthlyBudgetUsd: budgetParsed.value,
      defaultMonthlyMessages: messagesParsed.value,
    });
  };

  const handleReset = () => {
    setBudgetDraft(null);
    setMessagesDraft(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          Configuración
          {settings.enabled ? (
            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
              Activa
            </Badge>
          ) : (
            <Badge variant="outline" className="border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300">
              En pausa
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Aplica a todos. Cada cambio queda en el log de acciones de admin.
          {settings.updated_at && ` Última modificación: ${formatDateTime(settings.updated_at)}.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
          <div className="space-y-1">
            <Label htmlFor="fetita-enabled" className="text-sm font-medium">
              Fetita activa
            </Label>
            <p className="text-xs text-muted-foreground">
              En pausa, nadie puede chatear salvo los admins, que siguen pudiendo probarla. Las conversaciones quedan
              guardadas.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {toggle.isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            <Switch
              id="fetita-enabled"
              checked={settings.enabled}
              disabled={toggle.isPending}
              onCheckedChange={(checked) => (checked ? applyEnabled(true) : setConfirmPause(true))}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fetita-budget">Presupuesto mensual (USD)</Label>
            <Input
              id="fetita-budget"
              type="number"
              inputMode="decimal"
              min={0}
              max={MAX_BUDGET_USD}
              step="0.01"
              value={budget}
              onChange={(event) => setBudgetDraft(event.target.value)}
              aria-invalid={!!budgetParsed.error}
              aria-describedby="fetita-budget-help"
            />
            <p id="fetita-budget-help" className="text-xs text-muted-foreground">
              {budgetParsed.error ? (
                <span className="text-destructive">{budgetParsed.error}</span>
              ) : (
                'El presupuesto frena a todos, incluido vos, cuando el gasto del mes lo alcanza.'
              )}
            </p>
            {month && (
              <p className="text-xs text-muted-foreground">
                Este mes van {formatUsd(month.spent_usd)}
                {settings.monthly_budget_usd > 0
                  ? ` (${formatPercent(month.spent_usd, settings.monthly_budget_usd)} del presupuesto guardado).`
                  : '. Con presupuesto en 0, Fetita no responde a nadie.'}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fetita-messages">Mensajes por mes por defecto</Label>
            <Input
              id="fetita-messages"
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_MONTHLY_MESSAGES}
              step={1}
              value={messages}
              onChange={(event) => setMessagesDraft(event.target.value)}
              aria-invalid={!!messagesParsed.error}
              aria-describedby="fetita-messages-help"
            />
            <p id="fetita-messages-help" className="text-xs text-muted-foreground">
              {messagesParsed.error ? (
                <span className="text-destructive">{messagesParsed.error}</span>
              ) : (
                'Cupo de cada persona habilitada sin límite propio. Los admins no tienen tope.'
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={handleReset} disabled={!dirty || save.isPending}>
            Descartar cambios
          </Button>
          <Button onClick={handleSave} disabled={!dirty || hasErrors || save.isPending}>
            {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar
          </Button>
        </div>
      </CardContent>

      <AlertDialog open={confirmPause} onOpenChange={(open) => !open && !toggle.isPending && setConfirmPause(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Pausar Fetita?</AlertDialogTitle>
            <AlertDialogDescription>
              Pausar Fetita frena a todos menos a los admins. Las conversaciones quedan guardadas y la podés volver a
              activar cuando quieras.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={toggle.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                applyEnabled(false);
              }}
              disabled={toggle.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {toggle.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Pausar Fetita
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
