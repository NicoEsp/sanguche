import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UsersPagination } from '@/components/admin-users/UsersPagination';
import { ITEMS_PER_PAGE } from '@/components/admin-users/shared';
import { FetitaVerdictBadge } from '@/components/fetita/FetitaVerdictBadge';
import { VERDICT_META } from '@/lib/fetita/types';
import { cn } from '@/lib/utils';
import { FetitaConversationDialog } from './FetitaConversationDialog';
import { EmptyRow, QueryError, RefreshButton, SkeletonRows, UserCell } from './FetitaAdminUi';
import {
  ADMIN_LIST_LIMIT,
  VERDICT_ORDER,
  formatCount,
  formatDateTime,
  formatInteger,
  matchesSearch,
  protocolStepLabel,
  protocolStepName,
  type FetitaAdminConversation,
  type FetitaConversationVerdictFilter,
} from './shared';
import { useFetitaConversations } from './useAdminFetita';

const COLUMNS = 5;

/** Todas las conversaciones de todos los usuarios, de la más reciente a la más vieja. */
export function FetitaConversationsTab() {
  const [verdict, setVerdict] = useState<FetitaConversationVerdictFilter>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch, isFetching, isPlaceholderData } = useFetitaConversations({
    verdict,
  });

  const rows = useMemo(() => data ?? [], [data]);
  const filtered = useMemo(
    () =>
      rows.filter((row) => matchesSearch(search, row.profile?.name, row.profile?.email, row.title)),
    [rows, search],
  );

  useEffect(() => {
    setPage(1);
  }, [search, verdict]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);
  const pageRows = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const open = (row: FetitaAdminConversation) => setSelectedId(row.id);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <CardTitle>Conversaciones</CardTitle>
          <CardDescription>
            Una decisión por conversación. Abrí una para ver la transcripción, los memos y la evaluación del juez.
          </CardDescription>
        </div>
        <RefreshButton onClick={() => refetch()} refreshing={isFetching} />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Buscar conversaciones"
              placeholder="Buscar por nombre, email o título..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={verdict} onValueChange={(value) => setVerdict(value as FetitaConversationVerdictFilter)}>
            <SelectTrigger className="w-full sm:w-52" aria-label="Filtrar por veredicto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los veredictos</SelectItem>
              {VERDICT_ORDER.map((item) => (
                <SelectItem key={item} value={item}>
                  {VERDICT_META[item].label}
                </SelectItem>
              ))}
              <SelectItem value="sin_memo">Sin memo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {data && (
          <p className="text-xs text-muted-foreground">
            {formatCount(filtered.length, 'conversación', 'conversaciones')}
            {rows.length >= ADMIN_LIST_LIMIT && ` (se cargan las ${ADMIN_LIST_LIMIT} más recientes)`}
          </p>
        )}

        {isError ? (
          <QueryError
            message={error?.message || 'No pudimos cargar las conversaciones.'}
            onRetry={() => refetch()}
            retrying={isFetching}
            className="rounded-md border"
          />
        ) : (
          <div className={cn('overflow-x-auto rounded-md border transition-opacity', isPlaceholderData && 'opacity-60')}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Decisión</TableHead>
                  <TableHead className="text-right">Mensajes</TableHead>
                  <TableHead>Veredicto</TableHead>
                  <TableHead>Última actividad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <SkeletonRows columns={COLUMNS} />
                ) : filtered.length === 0 ? (
                  <EmptyRow columns={COLUMNS}>
                    {rows.length === 0 && verdict === 'all'
                      ? 'Todavía nadie empezó una conversación con Fetita.'
                      : 'No hay conversaciones que coincidan con los filtros.'}
                  </EmptyRow>
                ) : (
                  pageRows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="cursor-pointer hover:bg-muted/50"
                      tabIndex={0}
                      aria-label={`Abrir la conversación ${row.title}`}
                      onClick={() => open(row)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          open(row);
                        }
                      }}
                    >
                      <TableCell className="max-w-[220px]">
                        <UserCell profile={row.profile} />
                      </TableCell>
                      <TableCell className="max-w-[320px]">
                        <div className="truncate font-medium" title={row.title}>
                          {row.title}
                        </div>
                        <div className="text-xs text-muted-foreground" title={protocolStepName(row.protocol_step)}>
                          {protocolStepLabel(row.protocol_step)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatInteger(row.user_message_count)}</TableCell>
                      <TableCell>
                        {row.verdict ? (
                          <FetitaVerdictBadge verdict={row.verdict} short />
                        ) : (
                          <span className="text-xs text-muted-foreground">Sin memo</span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{formatDateTime(row.last_message_at)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <UsersPagination currentPage={page} totalPages={totalPages} totalItems={filtered.length} onChange={setPage} />
      </CardContent>

      <FetitaConversationDialog conversationId={selectedId} onClose={() => setSelectedId(null)} />
    </Card>
  );
}
