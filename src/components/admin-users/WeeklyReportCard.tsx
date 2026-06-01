import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, FileText, RefreshCw, TrendingDown, TrendingUp, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatWeekRange, getLastWeekRange, getRecordsLastWeek, getRecordsThisWeek } from '@/utils/dateHelpers';
import type { UserProfile } from './shared';

interface WeeklyReportCardProps {
  users: UserProfile[];
  assessments: { created_at: string }[];
  refreshing: boolean;
  onRefresh: () => void;
}

export function WeeklyReportCard({ users, assessments, refreshing, onRefresh }: WeeklyReportCardProps) {
  const usersLast = getRecordsLastWeek(users);
  const usersThis = getRecordsThisWeek(users);
  const assessmentsLast = getRecordsLastWeek(assessments);
  const assessmentsThis = getRecordsThisWeek(assessments);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-lg">Reporte Semana Anterior</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={refreshing}
              aria-label={refreshing ? 'Actualizando reporte semanal' : 'Actualizar reporte semanal'}
              title="Actualizar reporte semanal"
            >
              <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            </Button>
            <Badge variant="outline" className="text-xs">
              {formatWeekRange(getLastWeekRange())}
            </Badge>
          </div>
        </div>
        <CardDescription>Comparación con lo que llevamos de esta semana</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
          <WeeklyMetric
            icon={<UserPlus className="h-5 w-5 text-primary" />}
            label="Nuevos Registros"
            lastWeekValue={usersLast}
            thisWeek={usersThis}
          />
          <WeeklyMetric
            icon={<FileText className="h-5 w-5 text-primary" />}
            label="Evaluaciones Realizadas"
            lastWeekValue={assessmentsLast}
            thisWeek={assessmentsThis}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function WeeklyMetric({
  icon,
  label,
  lastWeekValue,
  thisWeek,
}: {
  icon: React.ReactNode;
  label: string;
  lastWeekValue: number;
  thisWeek: number;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">{icon}</div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{lastWeekValue}</p>
        </div>
      </div>
      <WeeklyTrend lastWeek={lastWeekValue} thisWeek={thisWeek} />
    </div>
  );
}

function WeeklyTrend({ lastWeek, thisWeek }: { lastWeek: number; thisWeek: number }) {
  if (lastWeek === 0 && thisWeek === 0) return null;

  const isUp = thisWeek >= lastWeek;
  const Icon = isUp ? TrendingUp : TrendingDown;

  return (
    <div className={cn('flex flex-col items-end gap-1 text-sm', isUp ? 'text-emerald-600' : 'text-destructive')}>
      <div className="flex items-center gap-1">
        <Icon className="h-4 w-4" />
        <span className="font-medium">{thisWeek}</span>
      </div>
      <span className="text-xs text-muted-foreground">esta semana</span>
    </div>
  );
}
