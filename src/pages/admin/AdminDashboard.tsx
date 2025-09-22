import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminAnalytics } from '@/hooks/useAdminAnalytics';
import { Loader2, Users, ClipboardList, TrendingUp, Crown, Target, Calendar } from 'lucide-react';

export default function AdminDashboard() {
  const { analytics, loading, error } = useAdminAnalytics();

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard de Administración</h1>
        <p className="text-muted-foreground mt-2">
          Métricas y análisis en tiempo real del sistema ProductPrepa
        </p>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <CardTitle className="text-sm font-medium">Usuarios Premium</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{analytics.premiumUsers}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.conversionRate.toFixed(1)}% conversión
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
      </div>

      {/* Charts Grid - Simplified without recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Summary */}
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
                <span className="text-lg font-semibold">
                  {Math.max(...analytics.userGrowth.map(day => day.count))}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skill Gap Distribution Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Distribución de Brechas de Habilidades
            </CardTitle>
            <CardDescription>Áreas más problemáticas identificadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.skillGapDistribution.map((skill, index) => (
                <div key={skill.skill} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">{skill.skill}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ 
                          width: `${(skill.count / Math.max(...analytics.skillGapDistribution.map(s => s.count))) * 100}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold min-w-[2rem]">{skill.count}</span>
                  </div>
                </div>
              ))}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{analytics.assessmentsToday}</div>
              <p className="text-sm text-muted-foreground">Evaluaciones hoy</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{analytics.activeUsers}</div>
              <p className="text-sm text-muted-foreground">Usuarios activos</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{analytics.conversionRate.toFixed(1)}%</div>
              <p className="text-sm text-muted-foreground">Tasa de conversión</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}