import { useCallback } from 'react';

export interface CSVExportOptions {
  filename: string;
  headers: string[];
  rows: (string | number)[][];
}

/**
 * Hook for CSV export functionality (FR-20: CSV export)
 * Provides a function to export data as CSV and trigger download
 */
export function useExportCSV() {
  const exportToCSV = useCallback(({ filename, headers, rows }: CSVExportOptions) => {
    try {
      // Build CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map((row) =>
          row
            .map((cell) => {
              // Handle null/undefined
              if (cell === null || cell === undefined) return '';

              // Convert to string
              const cellStr = String(cell);

              // Escape quotes and wrap in quotes if contains comma, quote, or newline
              if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                return `"${cellStr.replace(/"/g, '""')}"`;
              }

              return cellStr;
            })
            .join(',')
        ),
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up URL object
      URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error('Failed to export CSV:', error);
      return false;
    }
  }, []);

  return { exportToCSV };
}
