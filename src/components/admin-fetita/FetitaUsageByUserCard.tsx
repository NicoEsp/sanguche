import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UsersPagination } from '@/components/admin-users/UsersPagination';
import { ITEMS_PER_PAGE } from '@/components/admin-users/shared';
import { exportToCSV } from '@/utils/csvExport';
import { EmptyRow, UserCell } from './FetitaAdminUi';
import {
  csvCell,
  formatDateTime,
  formatInteger,
  formatPercent,
  formatUsd,
  profileEmail,
  profileName,
  toNumber,
  type FetitaOverviewUser,
} from './shared';

function exportUsage(rows: FetitaOverviewUser[], fileTag: string) {
  const stamp = new Date().toISOString().split('T')[0];
  exportToCSV(
    rows,
    [
      {
        key: 'name',
        header: 'Nombre',
        format: (_value, row) => csvCell(row.user_id ? profileName(row) : 'Cuenta borrada'),
      },
      { key: 'email', header: 'Email', format: (_value, row) => csvCell(row.user_id ? profileEmail(row) : '') },
      { key: 'user_id', header: 'Perfil', format: (_value, row) => csvCell(row.user_id ?? '') },
      { key: 'chat_turns', header: 'Turnos de chat', format: (_value, row) => String(toNumber(row.chat_turns)) },
      { key: 'conversations', header: 'Conversaciones', format: (_value, row) => String(toNumber(row.conversations)) },
      // Punto decimal y sin símbolo para que la planilla lo lea como número.
      { key: 'cost_usd', header: 'Costo USD', format: (_value, row) => toNumber(row.cost_usd).toFixed(6) },
      { key: 'last_active', header: 'Última actividad', format: (_value, row) => csvCell(formatDateTime(row.last_active)) },
    ],
    `fetita_consumo_${fileTag}_${stamp}.csv`,
  );
}

export function FetitaUsageByUserCard({
  rows,
  totalCost,
  fileTag,
}: {
  rows: FetitaOverviewUser[];
  totalCost: number;
  /** Va en el nombre del archivo, por ejemplo el preset del rango. */
  fileTag: string;
}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / ITEMS_PER_PAGE));

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const pageRows = rows.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 space-y-0 pb-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <CardTitle className="text-base">Consumo por usuario</CardTitle>
          <CardDescription>
            Incluye las llamadas del juez y de lectura de material. Las cuentas borradas conservan su costo.
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportUsage(rows, fileTag)}
          disabled={rows.length === 0}
          className="self-start"
        >
          <Download className="h-4 w-4" />
          <span className="ml-2">Exportar CSV</span>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead className="text-right">Turnos de chat</TableHead>
                <TableHead className="text-right">Conversaciones</TableHead>
                <TableHead className="text-right">Costo</TableHead>
                <TableHead>Última actividad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <EmptyRow columns={5}>Nadie usó Fetita en este período.</EmptyRow>
              ) : (
                pageRows.map((row, index) => (
                  <TableRow key={row.user_id ?? `sin-cuenta-${index}`}>
                    <TableCell className="max-w-[260px]">
                      {row.user_id ? (
                        <UserCell profile={row} />
                      ) : (
                        <span className="text-sm italic text-muted-foreground">Cuenta borrada</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatInteger(row.chat_turns)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatInteger(row.conversations)}</TableCell>
                    <TableCell className="whitespace-nowrap text-right tabular-nums">
                      <div className="font-medium">{formatUsd(row.cost_usd)}</div>
                      <div className="text-xs text-muted-foreground">{formatPercent(row.cost_usd, totalCost)}</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">{formatDateTime(row.last_active)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <UsersPagination currentPage={page} totalPages={totalPages} totalItems={rows.length} onChange={setPage} />
      </CardContent>
    </Card>
  );
}
