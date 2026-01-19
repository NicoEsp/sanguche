import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminAnalytics } from '@/hooks/useAdminAnalytics';
import { Loader2, Users, ClipboardList, TrendingUp, Crown, Target, Calendar, DollarSign, RefreshCw, Gift } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { JuniorUsersCard } from '@/components/admin/JuniorUsersCard';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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

  // Use real financial metrics from analytics
  const { mrr, arr, arpu } = analytics;

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
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Totales</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{analytics.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Usuarios registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Premium Pagados</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{analytics.premiumPaidUsers}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.conversionRate.toFixed(1)}% conversión
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bonificados</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{analytics.premiumCompedUsers}</div>
            <p className="text-xs text-muted-foreground">
              Premium sin pago
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(mrr)}</div>
            <p className="text-xs text-muted-foreground">Ingresos mensuales recurrentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ARR</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(arr)}</div>
            <p className="text-xs text-muted-foreground">Ingresos anuales recurrentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Evaluaciones</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{analytics.totalAssessments}</div>
            <p className="text-xs text-muted-foreground">
              +{analytics.assessmentsToday} hoy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{analytics.assessmentsThisWeek}</div>
            <p className="text-xs text-muted-foreground">Evaluaciones completadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ARPU</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(arpu)}
            </div>
            <p className="text-xs text-muted-foreground">Ingreso promedio por usuario</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversión</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{analytics.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Free to Premium</p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Resumen Financiero</CardTitle>
            <CardDescription>Métricas clave de ingresos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Ingresos Mensuales (MRR)</span>
              <Badge variant="secondary">{formatCurrency(mrr)}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Ingresos Anuales (ARR)</span>
              <Badge variant="secondary">{formatCurrency(arr)}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">ARPU (Avg Revenue Per User)</span>
              <Badge variant="secondary">
                {formatCurrency(arpu)}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Total de Clientes Pagantes</span>
              <Badge variant="outline">{analytics.premiumPaidUsers}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Bonificados (sin pago)</span>
              <Badge variant="comped">{analytics.premiumCompedUsers}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Crecimiento de Usuarios (30 días)
            </CardTitle>
            <CardDescription>Resumen de nuevos registros</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Total nuevos usuarios (30 días)</span>
                <span className="text-2xl font-bold text-primary">
                  {analytics.userGrowth.reduce((acc, day) => acc + day.count, 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Promedio diario</span>
                <span className="text-lg font-semibold">
                  {Math.round(analytics.userGrowth.reduce((acc, day) => acc + day.count, 0) / 30)}
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
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Distribución de Brechas de Habilidades
            </CardTitle>
            <CardDescription>Áreas más problemáticas basadas en evaluaciones reales</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.skillGapDistribution.length > 0 ? (
              <div className="space-y-3">
                {analytics.skillGapDistribution.map((skill, index) => (
                  <div key={skill.skill} className="space-y-2 p-3 bg-muted/50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{skill.skill}</span>
                      <Badge variant="outline">{skill.percentage.toFixed(1)}% usuarios</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ 
                            width: `${(skill.count / Math.max(...analytics.skillGapDistribution.map(s => s.count))) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm font-bold min-w-[2rem]">{skill.count}</span>
                    </div>
                    {skill.avgCurrentLevel > 0 && skill.avgTargetLevel > 0 && (
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Nivel actual: {skill.avgCurrentLevel.toFixed(1)}</span>
                        <span>Objetivo: {skill.avgTargetLevel.toFixed(1)}</span>
                        <span className="font-medium text-primary">Gap: {(skill.avgTargetLevel - skill.avgCurrentLevel).toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No hay datos de brechas de habilidades disponibles aún.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Las brechas se mostrarán cuando los usuarios completen evaluaciones.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Métricas de Evaluación
            </CardTitle>
            <CardDescription>Calidad y engagement de evaluaciones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Distribución de Scores */}
              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <span className="text-sm font-medium block">Distribución de Scores</span>
                <div className="grid grid-cols-2 gap-2">
                  {analytics.scoreDistribution.map((range) => (
                    <div key={range.range} className="flex items-center justify-between p-2 bg-background rounded">
                      <span className="text-xs">{range.range}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {range.count}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          ({range.percentage.toFixed(0)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comparación Free vs Premium */}
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <span className="text-sm font-medium block">Promedio por Plan</span>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Free</span>
                  <span className="text-lg font-bold text-foreground">
                    {analytics.avgScoreFree > 0 ? analytics.avgScoreFree.toFixed(2) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Premium</span>
                  <span className="text-lg font-bold text-primary">
                    {analytics.avgScorePremium > 0 ? analytics.avgScorePremium.toFixed(2) : 'N/A'}
                  </span>
                </div>
                {analytics.avgScoreFree > 0 && analytics.avgScorePremium > 0 && (
                  <div className="pt-2 border-t border-border">
                    <span className="text-xs text-muted-foreground">
                      Diferencia: {(analytics.avgScorePremium - analytics.avgScoreFree).toFixed(2)} pts
                    </span>
                  </div>
                )}
              </div>

              {/* Re-evaluación */}
              <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Tasa de re-evaluación</span>
                <span className="text-lg font-semibold">
                  {analytics.reEvaluationRate.toFixed(1)}%
                </span>
              </div>

              <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Promedio de puntuación</span>
                <span className="text-2xl font-bold text-primary">
                  {analytics.averageAssessmentScore > 0 ? analytics.averageAssessmentScore.toFixed(1) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Evaluaciones por usuario activo</span>
                <span className="text-lg font-semibold">
                  {analytics.activeUsers > 0 ? (analytics.totalAssessments / analytics.activeUsers).toFixed(1) : '0'}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Tasa de finalización</span>
                <span className="text-lg font-semibold">
                  {analytics.totalUsers > 0 ? ((analytics.totalAssessments / analytics.totalUsers) * 100).toFixed(1) : '0'}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Actividad Reciente</CardTitle>
          <CardDescription>Métricas clave del sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{analytics.assessmentsToday}</div>
              <p className="text-sm text-muted-foreground">Evaluaciones hoy</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{analytics.activeUsers}</div>
              <p className="text-sm text-muted-foreground">Usuarios activos ({analytics.recentActivePeriod})</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{analytics.conversionRate.toFixed(1)}%</div>
              <p className="text-sm text-muted-foreground">Tasa de conversión</p>
            </div>
            <div className="text-center p-4 bg-purple-100 dark:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{analytics.usersWithOptionalAnswers}</div>
              <p className="text-sm text-purple-600 dark:text-purple-400">
                🟣 Opcionales ({analytics.totalUsers > 0 ? ((analytics.usersWithOptionalAnswers / analytics.totalUsers) * 100).toFixed(1) : 0}%)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Junior Users Card */}
      <JuniorUsersCard />
    </div>
  );
}