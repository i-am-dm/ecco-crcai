import { TrendingUp, TrendingDown, Minus, ArrowUpRight } from 'lucide-react';
import type { VentureKPISummary } from '@/types/api';
import { getFormatter } from '@/lib/export';
import { Link } from 'react-router-dom';

interface KPITableProps {
  data?: VentureKPISummary[];
  format: 'currency' | 'number' | 'percent' | 'days';
}

export function KPITable({ data, format }: KPITableProps) {
  const formatter = getFormatter(format);

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-slate-600 dark:text-slate-400">
        No venture data available
      </div>
    );
  }

  // Sort by latest value descending
  const sortedData = [...data].sort((a, b) => b.latestValue - a.latestValue);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300">
          <tr>
            <th className="text-left font-medium px-6 py-3">Venture</th>
            <th className="text-right font-medium px-6 py-3">Current</th>
            <th className="text-right font-medium px-6 py-3">Previous</th>
            <th className="text-right font-medium px-6 py-3">Change</th>
            <th className="text-right font-medium px-6 py-3">% Change</th>
            <th className="text-left font-medium px-6 py-3">Last Updated</th>
            <th className="text-right font-medium px-6 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {sortedData.map((item) => {
            const isPositive = item.change > 0;
            const isNegative = item.change < 0;

            return (
              <tr
                key={item.ventureId}
                className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors"
              >
                <td className="px-6 py-3 font-medium">
                  <Link
                    to={`/ventures/${item.ventureId}`}
                    className="text-brand-700 dark:text-brand-400 hover:underline"
                  >
                    {item.ventureName}
                  </Link>
                </td>
                <td className="px-6 py-3 text-right tabular-nums font-medium text-slate-900 dark:text-slate-100">
                  {formatter(item.latestValue)}
                </td>
                <td className="px-6 py-3 text-right tabular-nums text-slate-600 dark:text-slate-400">
                  {formatter(item.previousValue)}
                </td>
                <td
                  className={`px-6 py-3 text-right tabular-nums font-medium ${
                    isPositive
                      ? 'text-accent-600 dark:text-accent-400'
                      : isNegative
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-slate-500 dark:text-slate-500'
                  }`}
                >
                  {isPositive ? '+' : ''}
                  {formatter(item.change)}
                </td>
                <td className="px-6 py-3 text-right">
                  <span
                    className={`inline-flex items-center gap-1 text-sm font-medium ${
                      isPositive
                        ? 'text-accent-600 dark:text-accent-400'
                        : isNegative
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-slate-500 dark:text-slate-500'
                    }`}
                  >
                    {isPositive ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : isNegative ? (
                      <TrendingDown className="w-4 h-4" />
                    ) : (
                      <Minus className="w-4 h-4" />
                    )}
                    {isPositive ? '+' : ''}
                    {item.changePercent.toFixed(1)}%
                  </span>
                </td>
                <td className="px-6 py-3 text-slate-500 dark:text-slate-400">
                  {new Date(item.lastUpdated).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </td>
                <td className="px-6 py-3 text-right">
                  <Link
                    to={`/ventures/${item.ventureId}`}
                    className="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    View
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
