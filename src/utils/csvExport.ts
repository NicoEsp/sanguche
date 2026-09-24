export interface CSVColumn<T> {
  key: keyof T | string;
  header: string;
  format?: (value: any, row: T) => string | number;
}

// Excel ejecuta como fórmula una celda que empieza con = + - @: un nombre de
// usuario como "=HYPERLINK(...)" se convertía en una fórmula al abrir el archivo.
const FORMULA_START = /^[=+\-@\t\r]/;

function toCell(value: unknown): string {
  let text = value === null || value === undefined ? '' : String(value);
  if (typeof value === 'string' && FORMULA_START.test(text) && Number.isNaN(Number(text))) {
    text = `'${text}`;
  }
  // Comas, comillas o saltos de línea sin comillas corrían las columnas
  // (por ejemplo, un nombre "Pérez, Juan").
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function exportToCSV<T>(
  data: T[],
  columns: CSVColumn<T>[],
  filename: string
): void {
  const headers = columns.map(col => toCell(col.header)).join(',');

  const rows = data.map(row =>
    columns.map(col => {
      const value = typeof col.key === 'string' && col.key.includes('.')
        ? col.key.split('.').reduce<unknown>((obj, key) => (obj as Record<string, unknown> | null)?.[key], row)
        : (row as Record<string, unknown>)[col.key as string];

      return toCell(col.format ? col.format(value, row) : value);
    }).join(',')
  );

  // El BOM hace que Excel lea el archivo como UTF-8: sin él, los acentos y
  // las eñes salían rotos.
  const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Revocar en el mismo tick puede cancelar la descarga en algunos navegadores.
  setTimeout(() => window.URL.revokeObjectURL(url), 0);
}
