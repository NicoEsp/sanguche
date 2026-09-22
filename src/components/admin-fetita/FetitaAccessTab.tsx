import { useEffect, useMemo, useState } from 'react';
import { Loader2, Pencil, Search, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UsersPagination } from '@/components/admin-users/UsersPagination';
import { ITEMS_PER_PAGE } from '@/components/admin-users/shared';
import { cn } from '@/lib/utils';
import { FetitaAccessDialog } from './FetitaAccessDialog';
import { EmptyRow, QueryError, RefreshButton, SkeletonRows, UserCell } from './FetitaAdminUi';
import {
  formatCount,
  formatDate,
  formatInteger,
  matchesSearch,
  presetToRange,
  profileName,
  type FetitaAccessRow,
} from './shared';
import { useFetitaAccessList, useFetitaOverview, useFetitaSettings, useSetFetitaAccess } from './useAdminFetita';

const COLUMNS = 7;

type UsageState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; used: number };

function StatusBadge({ enabled }: { enabled: boolean }) {
  return enabled ? (
    <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
      Habilitado
    </Badge>
  ) : (
    <Badge variant="outline" className="text-muted-foreground">
      Deshabilitado
    </Badge>
  );
}

function UsageCell({ usage, limit }: { usage: UsageState; limit: number | null }) {
  if (usage.status === 'loading') return <Skeleton className="h-4 w-14" />;
  if (usage.status === 'error') return <span className="text-xs text-muted-foreground">Sin datos</span>;
  const exhausted = limit !== null && usage.used >= limit;
  return (
    <span
      className={cn('whitespace-nowrap tabular-nums', exhausted && 'font-semibold text-destructive')}
      title={exhausted ? 'Ya usó todo el cupo de este mes' : undefined}
    >
      {formatInteger(usage.used)}
      {limit !== null && ` / ${formatInteger(limit)}`}
      {exhausted && <span className="ml-1 text-xs font-normal">(sin cupo)</span>}
    </span>
  );
}

function LimitLabel({ row, defaultLimit }: { row: FetitaAccessRow; defaultLimit: number | null }) {
  if (row.monthly_message_limit !== null) return <span className="tabular-nums">{formatInteger(row.monthly_message_limit)}</span>;
  return (
    <span className="whitespace-nowrap text-muted-foreground">
      Default{defaultLimit !== null ? ` (${formatInteger(defaultLimit)})` : ''}
    </span>
  );
}

export function FetitaAccessTab() {
  const access = useFetitaAccessList();
  const settings = useFetitaSettings();
  // Mismo rango que "Este mes" del resumen: comparten la caché.
  const [monthRange] = useState(() => presetToRange('this_month', new Date()));
  const usage = useFetitaOverview(monthRange);
  const toggle = useSetFetitaAccess();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<{ open: boolean; target: FetitaAccessRow | null }>({ open: false, target: null });

  const defaultLimit = settings.data?.default_monthly_messages ?? null;

  const usedByUser = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of usage.data?.by_user ?? []) {
      if (row.user_id) map.set(row.user_id, row.chat_turns);
    }
    return map;
  }, [usage.data]);

  const rows = useMemo(() => access.data ?? [], [access.data]);
  const filtered = useMemo(
    () => rows.filter((row) => matchesSearch(search, row.profile?.name, row.profile?.email, row.note)),
    [rows, search],
  );

  useEffect(() => {
    setPage(1);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);
  const pageRows = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const usageFor = (row: FetitaAccessRow): UsageState => {
    if (usage.isLoading) return { status: 'loading' };
    if (usage.isError || !usage.data) return { status: 'error' };
    return { status: 'ready', used: usedByUser.get(row.user_id) ?? 0 };
  };

  const isToggling = (row: FetitaAccessRow) => toggle.isPending && toggle.variables?.targetProfileId === row.user_id;

  // El RPC pisa todo: se reenvían el límite y la nota actuales.
  const handleToggle = (row: FetitaAccessRow, enabled: boolean) => {
    toggle.mutate({
      action: enabled ? 'enable' : 'disable',
      targetProfileId: row.user_id,
      enabled,
      monthlyMessageLimit: row.monthly_message_limit,
      note: row.note,
      displayName: profileName(row.profile),
    });
  };

  const handleRefresh = () => {
    access.refetch();
    usage.refetch();
    settings.refetch();
  };

  const openEdit = (row: FetitaAccessRow) => setDialog({ open: true, target: row });
  const limitFor = (row: FetitaAccessRow) => row.monthly_message_limit ?? defaultLimit;

  const renderToggle = (row: FetitaAccessRow) => (
    <div className="flex items-center gap-2">
      <Switch
        checked={row.enabled}
        // Una a la vez: el spinner y el estado pendiente siguen a la última fila tocada.
        disabled={toggle.isPending}
        onCheckedChange={(checked) => handleToggle(row, checked)}
        aria-label={`${row.enabled ? 'Deshabilitar' : 'Habilitar'} a ${profileName(row.profile)}`}
      />
      {isToggling(row) && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
    </div>
  );

  const emptyMessage =
    rows.length === 0 ? 'Todavía no habilitaste a nadie.' : 'No hay accesos que coincidan con la búsqueda.';

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <CardTitle>Accesos a la beta</CardTitle>
          <CardDescription>
            Quién puede usar Fetita y con qué cupo. Los admins siempre tienen acceso y no tienen tope: no hace falta
            habilitarlos.
          </CardDescription>
        </div>
        <div className="flex shrink-0 gap-2">
          <RefreshButton onClick={handleRefresh} refreshing={access.isFetching || usage.isFetching} />
          <Button size="sm" onClick={() => setDialog({ open: true, target: null })}>
            <UserPlus className="mr-2 h-4 w-4" />
            Habilitar usuario
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Buscar accesos"
              placeholder="Buscar por nombre, email o nota..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
            />
          </div>
          {access.data && (
            <p className="text-xs text-muted-foreground">
              {formatCount(rows.filter((row) => row.enabled).length, 'habilitado', 'habilitados')} de{' '}
              {formatInteger(rows.length)}. Uso del mes en curso.
            </p>
          )}
        </div>

        {access.isError ? (
          <QueryError
            message={access.error?.message || 'No pudimos cargar los accesos.'}
            onRetry={() => access.refetch()}
            retrying={access.isFetching}
            className="rounded-md border"
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto rounded-md border md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Uso del mes</TableHead>
                    <TableHead>Límite</TableHead>
                    <TableHead>Nota</TableHead>
                    <TableHead>Alta</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {access.isLoading ? (
                    <SkeletonRows columns={COLUMNS} />
                  ) : filtered.length === 0 ? (
                    <EmptyRow columns={COLUMNS}>{emptyMessage}</EmptyRow>
                  ) : (
                    pageRows.map((row) => (
                      <TableRow key={row.user_id}>
                        <TableCell className="max-w-[240px]">
                          <UserCell profile={row.profile} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge enabled={row.enabled} />
                        </TableCell>
                        <TableCell>
                          <UsageCell usage={usageFor(row)} limit={limitFor(row)} />
                        </TableCell>
                        <TableCell>
                          <LimitLabel row={row} defaultLimit={defaultLimit} />
                        </TableCell>
                        <TableCell className="max-w-[220px]">
                          {row.note ? (
                            <p className="truncate text-sm text-muted-foreground" title={row.note}>
                              {row.note}
                            </p>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{formatDate(row.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {renderToggle(row)}
                            <Button variant="outline" size="sm" className="text-xs" onClick={() => openEdit(row)}>
                              <Pencil className="mr-1 h-3 w-3" />
                              Editar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="space-y-3 md:hidden">
              {access.isLoading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)
              ) : filtered.length === 0 ? (
                <div className="rounded-lg border-2 border-dashed py-8 text-center text-sm text-muted-foreground">
                  {emptyMessage}
                </div>
              ) : (
                pageRows.map((row) => (
                  <Card key={row.user_id} className="space-y-3 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <UserCell profile={row.profile} className="text-sm" />
                      <StatusBadge enabled={row.enabled} />
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        Uso: <UsageCell usage={usageFor(row)} limit={limitFor(row)} />
                      </span>
                      <span>
                        Límite: <LimitLabel row={row} defaultLimit={defaultLimit} />
                      </span>
                      <span>Alta: {formatDate(row.created_at)}</span>
                    </div>
                    {row.note && <p className="line-clamp-2 text-xs text-muted-foreground">{row.note}</p>}
                    <div className="flex items-center justify-between gap-2">
                      {renderToggle(row)}
                      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => openEdit(row)}>
                        <Pencil className="mr-1 h-3 w-3" />
                        Editar
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>

            <UsersPagination currentPage={page} totalPages={totalPages} totalItems={filtered.length} onChange={setPage} />
          </>
        )}
      </CardContent>

      <FetitaAccessDialog
        open={dialog.open}
        target={dialog.target}
        defaultLimit={defaultLimit}
        onClose={() => setDialog((current) => ({ ...current, open: false }))}
      />
    </Card>
  );
}
