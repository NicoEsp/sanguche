import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UsersPagination } from '@/components/admin-users/UsersPagination';
import { ITEMS_PER_PAGE } from '@/components/admin-users/shared';
import { FetitaVerdictBadge } from '@/components/fetita/FetitaVerdictBadge';
import { VERDICT_META, type FetitaVerdict } from '@/lib/fetita/types';
import { FetitaConversationDialog } from './FetitaConversationDialog';
import { EmptyRow, JudgeCell, QueryError, RefreshButton, ReviewBadge, SkeletonRows, UserCell } from './FetitaAdminUi';
import {
  ADMIN_LIST_LIMIT,
  REVIEW_STATUS_META,
  REVIEW_STATUS_ORDER,
  VERDICT_ORDER,
  formatCount,
  formatDateTime,
  formatInteger,
  matchesSearch,
  protocolStepLabel,
  protocolStepName,
  type FetitaAdminMemoRow,
  type FetitaReviewFilter,
} from './shared';
import { useFetitaMemos } from './useAdminFetita';

const COLUMNS = 7;

function hasUnsupported(row: FetitaAdminMemoRow): boolean {
  return row.latestCheck?.status === 'ok' && row.latestCheck.claims_unsupported > 0;
}

/** Memos para revisar a mano, con lo que dijo el juez al lado. */
export function FetitaQualityTab() {
  const { data, isLoading, isError, error, refetch, isFetching } = useFetitaMemos();

  const [search, setSearch] = useState('');
  const [verdict, setVerdict] = useState<'all' | FetitaVerdict>('all');
  const [review, setReview] = useState<FetitaReviewFilter>('all');
  const [onlyUnsupported, setOnlyUnsupported] = useState(false);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<{ conversationId: string; memoId: string } | null>(null);

  const rows = useMemo(() => data ?? [], [data]);

  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        if (verdict !== 'all' && row.verdict !== verdict) return false;
        if (review === 'sin_revisar' && row.review) return false;
        if (review !== 'all' && review !== 'sin_revisar' && row.review?.status !== review) return false;
        if (onlyUnsupported && !hasUnsupported(row)) return false;
        return matchesSearch(search, row.profile?.name, row.profile?.email, row.conversation?.title);
      }),
    [rows, verdict, review, onlyUnsupported, search],
  );

  const counts = useMemo(
    () => ({
      unreviewed: rows.filter((row) => !row.review).length,
      unsupported: rows.filter(hasUnsupported).length,
      unchecked: rows.filter((row) => !row.latestCheck || row.latestCheck.status === 'error').length,
    }),
    [rows],
  );

  useEffect(() => {
    setPage(1);
  }, [search, verdict, review, onlyUnsupported]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);
  const pageRows = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const open = (row: FetitaAdminMemoRow) => setSelected({ conversationId: row.conversation_id, memoId: row.id });

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <CardTitle>Calidad de los memos</CardTitle>
          <CardDescription>
            Cada versión de cada memo, con el resultado del juez automático y tu revisión. El juez es otro modelo: tu
            revisión es la que confirma una alucinación.
          </CardDescription>
        </div>
        <RefreshButton onClick={() => refetch()} refreshing={isFetching} />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Buscar memos"
              placeholder="Buscar por nombre, email o decisión..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Select value={verdict} onValueChange={(value) => setVerdict(value as 'all' | FetitaVerdict)}>
              <SelectTrigger className="w-full sm:w-48" aria-label="Filtrar por veredicto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los veredictos</SelectItem>
                {VERDICT_ORDER.map((item) => (
                  <SelectItem key={item} value={item}>
                    {VERDICT_META[item].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={review} onValueChange={(value) => setReview(value as FetitaReviewFilter)}>
              <SelectTrigger className="w-full sm:w-44" aria-label="Filtrar por revisión">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las revisiones</SelectItem>
                <SelectItem value="sin_revisar">Sin revisar</SelectItem>
                {REVIEW_STATUS_ORDER.map((status) => (
                  <SelectItem key={status} value={status}>
                    {REVIEW_STATUS_META[status].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="fetita-only-unsupported"
              checked={onlyUnsupported}
              onCheckedChange={(checked) => setOnlyUnsupported(checked === true)}
            />
            <Label htmlFor="fetita-only-unsupported" className="cursor-pointer text-sm font-normal">
              Solo con afirmaciones no soportadas
            </Label>
          </div>
        </div>

        {data && (
          <p className="text-xs text-muted-foreground">
            {formatInteger(filtered.length)} de {formatCount(rows.length, 'memo', 'memos')}
            {rows.length >= ADMIN_LIST_LIMIT && ` (los ${ADMIN_LIST_LIMIT} más recientes)`} ·{' '}
            {formatInteger(counts.unreviewed)} sin revisar · {formatInteger(counts.unsupported)} con afirmaciones no
            soportadas · {formatInteger(counts.unchecked)} sin evaluar o con error del juez
          </p>
        )}

        {isError ? (
          <QueryError
            message={error?.message || 'No pudimos cargar los memos.'}
            onRetry={() => refetch()}
            retrying={isFetching}
            className="rounded-md border"
          />
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Decisión</TableHead>
                  <TableHead>Versión</TableHead>
                  <TableHead>Veredicto</TableHead>
                  <TableHead>Juez</TableHead>
                  <TableHead>Revisión</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <SkeletonRows columns={COLUMNS} />
                ) : filtered.length === 0 ? (
                  <EmptyRow columns={COLUMNS}>
                    {rows.length === 0
                      ? 'Todavía no hay memos. Fetita escribe uno al cerrar el recorrido de una decisión.'
                      : 'No hay memos que coincidan con los filtros.'}
                  </EmptyRow>
                ) : (
                  pageRows.map((row) => {
                    const title = row.conversation?.title ?? 'Conversación borrada';
                    return (
                      <TableRow
                        key={row.id}
                        className="cursor-pointer hover:bg-muted/50"
                        tabIndex={0}
                        aria-label={`Abrir el memo versión ${row.version} de ${title}`}
                        onClick={() => open(row)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            open(row);
                          }
                        }}
                      >
                        <TableCell className="max-w-[200px]">
                          <UserCell profile={row.profile} />
                        </TableCell>
                        <TableCell className="max-w-[280px]">
                          <div className="truncate font-medium" title={title}>
                            {title}
                          </div>
                          {row.conversation && (
                            <div
                              className="text-xs text-muted-foreground"
                              title={protocolStepName(row.conversation.protocol_step)}
                            >
                              {protocolStepLabel(row.conversation.protocol_step)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="tabular-nums">v{row.version}</TableCell>
                        <TableCell>
                          <FetitaVerdictBadge verdict={row.verdict} short />
                        </TableCell>
                        <TableCell>
                          <JudgeCell check={row.latestCheck} />
                        </TableCell>
                        <TableCell>
                          <ReviewBadge review={row.review} />
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{formatDateTime(row.created_at)}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <UsersPagination currentPage={page} totalPages={totalPages} totalItems={filtered.length} onChange={setPage} />
      </CardContent>

      <FetitaConversationDialog
        conversationId={selected?.conversationId ?? null}
        focusMemoId={selected?.memoId ?? null}
        onClose={() => setSelected(null)}
      />
    </Card>
  );
}
