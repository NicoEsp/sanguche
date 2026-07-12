import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminAnalytics } from '@/hooks/useAdminAnalytics';
import { Loader2, Users, ClipboardList, TrendingUp, Crown, Target, Calendar, DollarSign, RefreshCw, Gift } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AssessmentTypeKey, getAssessmentTypeDef } from '@/utils/scoring';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function assessmentTypeLabel(key: AssessmentTypeKey | 'legacy'): string {
  return key === 'legacy' ? 'Legacy' : getAssessmentTypeDef(key).shortLabel;
}

export default function AdminDashboard() {
  const { analytics, loading, error, refreshing, refetch, lastUpdated } = useAdminAnalytics();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Cargando analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="text-center p-8">
        <p className="text-destructive">{error || 'Error cargando datos'}</p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const { mrr, ltv, arpu } = analytics;
  const maxAssessmentsByType = Math.max(...analytics.assessmentsByType.map((item) => item.count), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Dashboard de Administración</h1>
          <p className="text-sm text-muted-foreground mt-1 sm:mt-2">
            Métricas y análisis en tiempo real
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground hidden sm:block">
              Actualizado: {lastUpdated.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            <span className="hidden sm:inline ml-2">{refreshing ? 'Actualizando...' : 'Actualizar'}</span>
          </Button>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card className="h-full overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Totales</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-base sm:text-2xl font-bold text-foreground truncate">{analytics.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Usuarios registrados</p>
          </CardContent>
        </Card>

        <Card className="h-full overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Evaluaciones</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-base sm:text-2xl font-bold text-foreground truncate">{analytics.totalAssessments}</div>
            <p className="text-xs text-muted-foreground">
              +{analytics.assessmentsToday} hoy
            </p>
          </CardContent>
        </Card>

        <Card className="h-full overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-base sm:text-2xl font-bold text-foreground truncate">{analytics.assessmentsThisWeek}</div>
            <p className="text-xs text-muted-foreground">Evaluaciones completadas</p>
          </CardContent>
        </Card>

        <Card className="h-full overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversión</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-base sm:text-2xl font-bold text-foreground truncate">{analytics.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Free to Premium</p>
          </CardContent>
        </Card>

        <Card className="h-full overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Evaluaciones por perfil</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent className="space-y-2">
            {analytics.assessmentsByType
              .filter((item) => item.key !== 'legacy' || item.count > 0)
              .map((item) => (
                <div key={item.key}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground truncate">{assessmentTypeLabel(item.key)}</span>
                    <span className="text-xs font-semibold text-foreground">{item.count}</span>
                  </div>
                  <div
                    className={cn('h-1.5 rounded-full mt-1', item.key === 'legacy' && 'bg-muted-foreground/40')}
                    style={{
                      width: `${(item.count / maxAssessmentsByType) * 100}%`,
                      backgroundColor: item.key === 'legacy' ? undefined : getAssessmentTypeDef(item.key).accent.hex
                    }}
                  />
                </div>
              ))}
          </CardContent>
        </Card>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Card className="h-full overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Premium Pagados</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-base sm:text-2xl font-bold text-foreground truncate">{analytics.premiumPaidUsers}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.conversionRate.toFixed(1)}% conversión
            </p>
          </CardContent>
        </Card>

        <Card className="h-full overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bonificados</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-base sm:text-2xl font-bold text-foreground truncate">{analytics.premiumCompedUsers}</div>
            <p className="text-xs text-muted-foreground">
              Premium sin pago
            </p>
          </CardContent>
        </Card>

        <Card className="h-full overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-base sm:text-2xl font-bold text-foreground truncate">{formatCurrency(mrr)}</div>
            <p className="text-xs text-muted-foreground">Ingresos mensuales recurrentes</p>
          </CardContent>
        </Card>

        <Card className="h-full overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ARPU</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-base sm:text-2xl font-bold text-foreground truncate">
              {formatCurrency(arpu)}
            </div>
            <p className="text-xs text-muted-foreground">Ingreso promedio por usuario</p>
          </CardContent>
        </Card>

        <Card className="h-full overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">LTV</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-base sm:text-2xl font-bold text-foreground truncate">{formatCurrency(ltv)}</div>
            <p className="text-xs text-muted-foreground">Ingreso promedio por cliente</p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary + User Growth */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 items-start">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Resumen Financiero
              <Badge variant={analytics.pricingSource === 'real' ? 'default' : analytics.pricingSource === 'lemonsqueezy' ? 'secondary' : 'outline'} className="text-xs whitespace-nowrap shrink-0">
                {analytics.pricingSource === 'real' ? 'Precios Reales' : analytics.pricingSource === 'lemonsqueezy' ? 'LemonSqueezy' : 'Fallback'}
              </Badge>
            </CardTitle>
            <CardDescription>Métricas clave de ingresos (solo suscripciones recurrentes)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center gap-2">
              <span className="text-sm">Ingresos Mensuales (MRR)</span>
              <Badge variant="secondary" className="whitespace-nowrap shrink-0">{formatCurrency(mrr)}</Badge>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-sm">Lifetime Value (LTV)</span>
              <Badge variant="secondary" className="whitespace-nowrap shrink-0">{formatCurrency(ltv)}</Badge>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-sm">ARPU (por usuario pagante)</span>
              <Badge variant="secondary" className="whitespace-nowrap shrink-0">
                {formatCurrency(arpu)}
              </Badge>
            </div>

            {/* Breakdown by plan */}
            <div className="pt-2 border-t border-border space-y-2">
              <span className="text-xs text-muted-foreground font-medium">Desglose por plan:</span>
              <div className="flex justify-between items-center text-sm">
                <span>Premium</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{analytics.subscriptionsByPlan.premium.paid} pagados</Badge>
                  {analytics.subscriptionsByPlan.premium.comped > 0 && (
                    <Badge variant="comped">{analytics.subscriptionsByPlan.premium.comped} bonif.</Badge>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>RePremium</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{analytics.subscriptionsByPlan.repremium.paid} pagados</Badge>
                  {analytics.subscriptionsByPlan.repremium.comped > 0 && (
                    <Badge variant="comped">{analytics.subscriptionsByPlan.repremium.comped} bonif.</Badge>
                  )}
                </div>
              </div>
              <span className="text-xs text-muted-foreground font-medium pt-1 block">Compras únicas (no MRR):</span>
              <div className="flex justify-between items-center text-sm">
                <span>ProductPrepa for Business</span>
                <Badge variant="outline">{analytics.subscriptionsByPlan.productprepa_business.paid} vendidos</Badge>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Productastic Review</span>
                <Badge variant="outline">{analytics.subscriptionsByPlan.productastic_review.paid} vendidos</Badge>
              </div>
              {analytics.subscriptionsByPlan.curso_estrategia.paid > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span>Curso Estrategia</span>
                  <Badge variant="outline">{analytics.subscriptionsByPlan.curso_estrategia.paid} vendidos</Badge>
                </div>
              )}
              {analytics.subscriptionsByPlan.cursos_all.paid > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span>Cursos All</span>
                  <Badge variant="outline">{analytics.subscriptionsByPlan.cursos_all.paid} vendidos</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Crecimiento de Usuarios ({analytics.monthName})
            </CardTitle>
            <CardDescription>Resumen de nuevos registros del mes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Total nuevos usuarios</span>
                <span className="text-2xl font-bold text-primary">
                  {analytics.newUsersThisMonth}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Promedio diario</span>
                <span className="text-lg font-semibold">
                  {analytics.daysElapsedInMonth > 0
                    ? Math.round(analytics.newUsersThisMonth / analytics.daysElapsedInMonth)
                    : 0}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Día con más registros</span>
                <div className="text-right">
                  <span className="text-lg font-semibold block">
                    {analytics.peakDay.count}
                  </span>
                  {analytics.peakDay.date && (
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(analytics.peakDay.date), 'dd/MM', { locale: es })}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Día con más evaluaciones</span>
                <div className="text-right">
                  <span className="text-lg font-semibold block">
                    {analytics.peakAssessmentDay.count}
                  </span>
                  {analytics.peakAssessmentDay.date && (
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(analytics.peakAssessmentDay.date), 'dd/MM', { locale: es })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assessments + Top Skill Gaps */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 items-start">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Evaluaciones
            </CardTitle>
            <CardDescription>Volumen y puntuación promedio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{analytics.assessmentsToday}</div>
                  <p className="text-sm text-muted-foreground">Hoy</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{analytics.assessmentsThisWeek}</div>
                  <p className="text-sm text-muted-foreground">Esta semana</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{analytics.assessmentsThisMonth}</div>
                  <p className="text-sm text-muted-foreground">Este mes</p>
                </div>
              </div>
              <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Promedio de puntuación</span>
                <span className="text-2xl font-bold text-primary">
                  {analytics.averageAssessmentScore > 0 ? analytics.averageAssessmentScore.toFixed(1) : 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Top 3 Brechas de Habilidades
            </CardTitle>
            <CardDescription>Áreas más problemáticas según evaluaciones</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.topSkillGaps.length > 0 ? (
              <div className="space-y-3">
                {analytics.topSkillGaps.map((skill, index) => (
                  <div key={skill.skill} className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-primary">#{index + 1}</span>
                      <span className="text-sm font-medium">{skill.skill}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-semibold block">{skill.count}</span>
                      <span className="text-xs text-muted-foreground">{skill.percentage.toFixed(1)}% usuarios</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No hay datos de brechas de habilidades disponibles aún.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
