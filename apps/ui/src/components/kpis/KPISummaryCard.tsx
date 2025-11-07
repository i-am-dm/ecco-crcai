import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getFormatter } from '@/lib/export';

interface KPISummaryCardProps {
  label: string;
  value: number;
  previousValue?: number;
  format: 'currency' | 'number' | 'percent' | 'days';
  color?: string;
  icon?: React.ReactNode;
}

export function KPISummaryCard({
  label,
  value,
  previousValue,
  format,
  color = 'brand',
  icon,
}: KPISummaryCardProps) {
  const formatter = getFormatter(format);

  // Calculate change
  const change = previousValue !== undefined ? value - previousValue : undefined;
  const changePercent =
    change !== undefined && previousValue !== undefined && previousValue !== 0
      ? ((change / Math.abs(previousValue)) * 100).toFixed(1)
      : undefined;

  const isPositive = change !== undefined && change > 0;
  const isNeutral = change === 0;

  // Color classes
  const colorClasses = {
    brand: {
      bg: 'bg-gradient-to-br from-brand-50 to-cyan-50 dark:from-brand-900/20 dark:to-cyan-900/20',
      border: 'border-brand-100 dark:border-brand-800/40',
      iconBg: 'bg-brand-100 dark:bg-brand-900/40',
      iconColor: 'text-brand-600 dark:text-brand-400',
    },
    accent: {
      bg: 'bg-gradient-to-br from-accent-50 to-emerald-50 dark:from-accent-900/20 dark:to-emerald-900/20',
      border: 'border-accent-100 dark:border-accent-800/40',
      iconBg: 'bg-accent-100 dark:bg-accent-900/40',
      iconColor: 'text-accent-600 dark:text-accent-400',
    },
    amber: {
      bg: 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20',
      border: 'border-amber-100 dark:border-amber-800/40',
      iconBg: 'bg-amber-100 dark:bg-amber-900/40',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    purple: {
      bg: 'bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20',
      border: 'border-purple-100 dark:border-purple-800/40',
      iconBg: 'bg-purple-100 dark:bg-purple-900/40',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    emerald: {
      bg: 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20',
      border: 'border-emerald-100 dark:border-emerald-800/40',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    red: {
      bg: 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20',
      border: 'border-red-100 dark:border-red-800/40',
      iconBg: 'bg-red-100 dark:bg-red-900/40',
      iconColor: 'text-red-600 dark:text-red-400',
    },
    blue: {
      bg: 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
      border: 'border-blue-100 dark:border-blue-800/40',
      iconBg: 'bg-blue-100 dark:bg-blue-900/40',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
  };

  const colors = colorClasses[color as keyof typeof colorClasses] || colorClasses.brand;

  return (
    <div className={`rounded-xl border p-5 ${colors.bg} ${colors.border}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            {label}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
              {formatter(value)}
            </span>
            {changePercent !== undefined && !isNeutral && (
              <span
                className={`inline-flex items-center gap-1 text-sm font-medium ${
                  isPositive
                    ? 'text-accent-600 dark:text-accent-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {changePercent}%
              </span>
            )}
            {isNeutral && (
              <span className="inline-flex items-center gap-1 text-sm font-medium text-slate-500">
                <Minus className="w-4 h-4" />
                0%
              </span>
            )}
          </div>
        </div>
        {icon && <div className={`p-2 rounded-lg ${colors.iconBg}`}>
          <div className={colors.iconColor}>{icon}</div>
        </div>}
      </div>
      {previousValue !== undefined && (
        <div className="text-xs text-slate-500 dark:text-slate-400">
          vs. previous period: {formatter(previousValue)}
        </div>
      )}
    </div>
  );
}
