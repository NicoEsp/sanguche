export interface CSVColumn<T> {
  key: keyof T | string;
  header: string;
  format?: (value: any, row: T) => string;
}

export function exportToCSV<T>(
  data: T[],
  columns: CSVColumn<T>[],
  filename: string
): void {
  const headers = columns.map(col => col.header).join(',');
  
  const rows = data.map(row => 
    columns.map(col => {
      const value = typeof col.key === 'string' && col.key.includes('.') 
        ? col.key.split('.').reduce((obj: any, key) => obj?.[key], row)
        : (row as any)[col.key];
      
      return col.format ? col.format(value, row) : (value || '');
    }).join(',')
  );

  const csvContent = [headers, ...rows].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
