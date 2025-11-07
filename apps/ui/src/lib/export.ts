/**
 * Export utilities for generating CSV, JSON, and other export formats
 */

export interface ExportData {
  headers: string[];
  rows: (string | number | null | undefined)[][];
}

/**
 * Convert data to CSV format
 */
export function toCSV(data: ExportData): string {
  const { headers, rows } = data;

  const escapeCsvCell = (cell: string | number | null | undefined): string => {
    if (cell === null || cell === undefined) return '';

    const cellStr = String(cell);

    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
      return `"${cellStr.replace(/"/g, '""')}"`;
    }

    return cellStr;
  };

  const csvContent = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Export data as CSV file (browser download)
 */
export function exportToCSV(filename: string, data: ExportData): void {
  const csvContent = toCSV(data);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
}

/**
 * Export data as JSON file (browser download)
 */
export function exportToJSON(filename: string, data: unknown): void {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  downloadBlob(blob, filename.endsWith('.json') ? filename : `${filename}.json`);
}

/**
 * Trigger browser download of a Blob
 */
function downloadBlob(blob: Blob, filename: string): void {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up URL object
  URL.revokeObjectURL(url);
}

/**
 * Format a number as currency (USD)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format a number with commas
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

/**
 * Format a number as percentage
 */
export function formatPercent(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

/**
 * Format days as "X days"
 */
export function formatDays(value: number): string {
  return `${Math.round(value)} days`;
}

/**
 * Get formatter function based on format type
 */
export function getFormatter(format: 'currency' | 'number' | 'percent' | 'days'): (value: number) => string {
  switch (format) {
    case 'currency':
      return formatCurrency;
    case 'number':
      return formatNumber;
    case 'percent':
      return formatPercent;
    case 'days':
      return formatDays;
    default:
      return formatNumber;
  }
}
