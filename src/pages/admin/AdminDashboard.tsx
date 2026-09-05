import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminAnalytics } from '@/hooks/useAdminAnalytics';
import {
  Loader2, Users, ClipboardList, TrendingUp, Crown, Target, Calendar, DollarSign, RefreshCw,
  ShoppingBag, type LucideIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getAssessmentTypeDef, getAssessmentTypeShortLabel } from '@/utils/scoring';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const currency = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 });
const shortDate = (date: string | null) => (date ? format(new Date(date), 'dd/MM', { locale: es }) : null);

const PRICING_BADGE = {
  real: { variant: 'default', label: 'Precios reales' },
  lemonsqueezy: { variant: 'secondary', label: 'LemonSqueezy' },
  fallback: { variant: 'outline', label: 'Estimado' },
} as const;

export default function AdminDashboard() {
  const { analytics, loading, error, refreshing, refetch, lastUpdated } = useAdminAnalytics();

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p>Cargando analytics...</p>
      </div>
    );
  }

  if (error || !analytics) {
    return <p className="p-8 text-center text-destructive">{error || 'Error cargando datos'}</p>;
  }

  const a = analytics;
  const plans = a.subscriptionsByPlan;
  const paidConversion = a.totalUsers > 0 ? (a.premiumPaidUsers / a.totalUsers) * 100 : 0;
  const oneTimeSales = plans.productprepa_business.paid + plans.productastic_review.paid
    + plans.curso_estrategia.paid + plans.cursos_all.paid;
  const dailyAverage = a.daysElapsedInMonth > 0 ? Math.round(a.newUsersThisMonth / a.daysElapsedInMonth) : 0;
  const profileRows = a.assessmentsByType.filter((item) => item.key !== 'legacy' || item.count > 0);
  const maxByProfile = Math.max(...profileRows.map((item) => item.count), 1);
  const pricing = PRICING_BADGE[a.pricingSource];

  const planRows = [
    { label: 'Premium', paid: plans.premium.paid, comped: plans.premium.comped, recurring: true },
    { label: 'RePremium', paid: plans.repremium.paid, comped: plans.repremium.comped, recurring: true },
    { label: 'ProductPrepa for Business', paid: plans.productprepa_business.paid },
    { label: 'Productastic Review', paid: plans.productastic_review.paid },
    { label: 'Curso Estrategia', paid: plans.curso_estrategia.paid },
    { label: 'Cursos All', paid: plans.cursos_all.paid },
  ].filter((row) => row.recurring || row.paid > 0);

  const monthRows = [
    { label: 'Nuevos usuarios', value: a.newUsersThisMonth },
    { label: 'Promedio diario de registros', value: dailyAverage },
    { label: 'Evaluaciones', value: a.assessmentsThisMonth },
    { label: 'Puntuación promedio', value: a.averageAssessmentScore > 0 ? a.averageAssessmentScore.toFixed(1) : 'N/A' },
    { label: 'Pico de registros', value: a.peakDay.count, note: shortDate(a.peakDay.date) },
    { label: 'Pico de evaluaciones', value: a.peakAssessmentDay.count, note: shortDate(a.peakAssessmentDay.date) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Dashboard de Administración</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:mt-2">Métricas y análisis en tiempo real</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="hidden text-xs text-muted-foreground sm:block">
              Actualizado: {format(lastUpdated, 'HH:mm')}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={refetch} disabled={refreshing}>
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            <span className="ml-2 hidden sm:inline">{refreshing ? 'Actualizando...' : 'Actualizar'}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat icon={Users} label="Usuarios" value={a.totalUsers} note="Registrados" />
        <Stat icon={ClipboardList} label="Evaluaciones" value={a.totalAssessments} note={`+${a.assessmentsToday} hoy`} />
        <Stat icon={Calendar} label="Esta semana" value={a.assessmentsThisWeek} note="Evaluaciones completadas" />
        <Stat icon={Target} label="Conversión" value={`${paidConversion.toFixed(1)}%`} note="Pagos recurrentes sobre usuarios" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Evaluaciones por perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-5">
            {profileRows.map((item) => (
              <div key={item.key}>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate text-muted-foreground">{getAssessmentTypeShortLabel(item.key)}</span>
                  <span className="font-semibold">{item.count}</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-muted">
                  <div
                    className={cn('h-full rounded-full', item.key === 'legacy' && 'bg-muted-foreground/40')}
                    style={{
                      width: `${(item.count / maxByProfile) * 100}%`,
                      backgroundColor: item.key === 'legacy' ? undefined : getAssessmentTypeDef(item.key).accent.hex,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Stat icon={Crown} label="Premium pagados" value={a.premiumPaidUsers} note={`${a.premiumCompedUsers} bonificados`} />
        <Stat icon={ShoppingBag} label="Compras únicas" value={oneTimeSales} note="B2B, reviews y cursos" />
        <Stat icon={DollarSign} label="MRR" value={currency.format(a.mrr)} note="Ingresos mensuales recurrentes" />
        <Stat icon={DollarSign} label="ARPU" value={currency.format(a.arpu)} note="Por usuario pagante" />
        <Stat icon={TrendingUp} label="LTV" value={currency.format(a.ltv)} note="Ingreso histórico por cliente" />
      </div>

      <div className="grid grid-cols-1 items-start gap-4 sm:gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              Planes
              <Badge variant={pricing.variant} className="text-xs">{pricing.label}</Badge>
            </CardTitle>
            <CardDescription>Suscripciones activas y compras únicas</CardDescription>
          </CardHeader>
          <CardContent>
            <Rows>
              {planRows.map((row) => (
                <Row key={row.label} label={row.label}>
                  <span className="font-semibold">{row.paid}</span>
                  {row.comped ? <span className="ml-2 text-xs text-muted-foreground">+{row.comped} bonif.</span> : null}
                </Row>
              ))}
            </Rows>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Este mes</CardTitle>
            <CardDescription className="capitalize">{a.monthName}</CardDescription>
          </CardHeader>
          <CardContent>
            <Rows>
              {monthRows.map((row) => (
                <Row key={row.label} label={row.label}>
                  <span className="font-semibold">{row.value}</span>
                  {row.note && <span className="ml-2 text-xs text-muted-foreground">{row.note}</span>}
                </Row>
              ))}
            </Rows>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Brechas más frecuentes</CardTitle>
            <CardDescription>Dominios en brecha según las evaluaciones</CardDescription>
          </CardHeader>
          <CardContent>
            {a.topSkillGaps.length > 0 ? (
              <Rows>
                {a.topSkillGaps.map((gap, index) => (
                  <Row key={gap.skill} label={`${index + 1}. ${gap.skill}`}>
                    <span className="font-semibold">{gap.count}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{gap.percentage.toFixed(0)}%</span>
                  </Row>
                ))}
              </Rows>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">Todavía no hay datos de brechas.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, note }: { icon: LucideIcon; label: string; value: React.ReactNode; note: string }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="truncate text-base font-bold sm:text-2xl">{value}</div>
        <p className="text-xs text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  );
}

function Rows({ children }: { children: React.ReactNode }) {
  return <div className="divide-y divide-border">{children}</div>;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 text-sm first:pt-0 last:pb-0">
      <span className="truncate text-muted-foreground">{label}</span>
      <span className="shrink-0 tabular-nums">{children}</span>
    </div>
  );
}
