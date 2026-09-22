import type React from 'react';
import { RefreshCw, type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  REVIEW_STATUS_META,
  describeJudge,
  profileEmail,
  profileName,
  type FetitaMemoCheck,
  type FetitaMemoReview,
  type FetitaProfileRef,
} from './shared';

/** Tarjeta de KPI, en el estilo del Stat de AdminDashboard, con una definición opcional. */
export function Stat({
  icon: Icon,
  label,
  value,
  note,
  definition,
  children,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  note?: React.ReactNode;
  definition?: string;
  children?: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium leading-snug">{label}</CardTitle>
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <div className="truncate text-base font-bold sm:text-2xl">{value}</div>
        {note && <p className="text-xs text-muted-foreground">{note}</p>}
        {children}
        {definition && (
          // mt-auto alinea las definiciones al pie aunque las notas tengan distinto largo.
          <div className="mt-auto pt-3">
            <p className="border-t pt-2 text-[11px] leading-snug text-muted-foreground">{definition}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function StatGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function Rows({ children }: { children: React.ReactNode }) {
  return <div className="divide-y divide-border">{children}</div>;
}

export function Row({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 text-sm first:pt-0 last:pb-0">
      <span className="min-w-0 truncate text-muted-foreground">{label}</span>
      <span className="shrink-0 tabular-nums">{children}</span>
    </div>
  );
}

/** Error de carga con reintento, en el estilo de AdminDashboard. */
export function QueryError({
  message,
  onRetry,
  retrying,
  className,
}: {
  message: string;
  onRetry: () => void;
  retrying?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center gap-3 p-8 text-center', className)}>
      <p className="text-sm text-destructive">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry} disabled={retrying}>
        <RefreshCw className={cn('mr-2 h-4 w-4', retrying && 'animate-spin')} />
        Reintentar
      </Button>
    </div>
  );
}

export function RefreshButton({ onClick, refreshing }: { onClick: () => void; refreshing: boolean }) {
  return (
    <Button variant="outline" size="sm" onClick={onClick} disabled={refreshing}>
      <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
      <span className="ml-2 hidden sm:inline">{refreshing ? 'Actualizando...' : 'Actualizar'}</span>
    </Button>
  );
}

export function UserCell({ profile, className }: { profile: FetitaProfileRef | null; className?: string }) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className="truncate font-medium">{profileName(profile)}</div>
      <div className="truncate text-xs text-muted-foreground">{profileEmail(profile)}</div>
    </div>
  );
}

export function ReviewBadge({ review }: { review: FetitaMemoReview | null }) {
  if (!review) return <span className="text-xs text-muted-foreground">Sin revisar</span>;
  const meta = REVIEW_STATUS_META[review.status];
  return (
    <Badge variant="outline" className={meta.className} title={review.note ?? undefined}>
      {meta.label}
    </Badge>
  );
}

export function JudgeCell({ check }: { check: FetitaMemoCheck | null }) {
  const { label, tone } = describeJudge(check);
  return (
    <span
      className={cn(
        'whitespace-nowrap text-xs tabular-nums',
        tone === 'unsupported' && 'font-semibold text-red-700 dark:text-red-400',
        tone === 'error' && 'font-medium text-amber-700 dark:text-amber-400',
        (tone === 'none' || tone === 'clean') && 'text-muted-foreground',
      )}
      title={tone === 'error' ? check?.error ?? 'La última evaluación falló' : undefined}
    >
      {label}
    </span>
  );
}

export function SkeletonRows({ columns, rows = 5 }: { columns: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: columns }).map((_, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export function EmptyRow({ columns, children }: { columns: number; children: React.ReactNode }) {
  return (
    <TableRow>
      <TableCell colSpan={columns} className="py-8 text-center text-sm text-muted-foreground">
        {children}
      </TableCell>
    </TableRow>
  );
}
