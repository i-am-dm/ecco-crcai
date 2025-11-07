import type { MonthlyBurn } from '@/types/api';

interface BurnRateChartProps {
  monthlyBurn: MonthlyBurn[];
  currency?: string;
}

function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatMonth(month: string): string {
  const [year, monthNum] = month.split('-');
  const date = new Date(parseInt(year), parseInt(monthNum) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function BurnRateChart({ monthlyBurn, currency = 'USD' }: BurnRateChartProps) {
  if (!monthlyBurn || monthlyBurn.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-700/60 shadow-subtle p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Monthly Burn Rate
        </h3>
        <div className="text-center py-8 text-slate-500">No burn rate data available</div>
      </div>
    );
  }

  const maxBurn = Math.max(...monthlyBurn.map((b) => b.amount));
  const avgBurn = monthlyBurn.reduce((sum, b) => sum + b.amount, 0) / monthlyBurn.length;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-700/60 shadow-subtle p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Monthly Burn Rate
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Average: {formatCurrency(avgBurn, currency)}/month
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">Peak</div>
          <div className="text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {formatCurrency(maxBurn, currency)}
          </div>
        </div>
      </div>

      {/* Bar chart */}
      <div className="space-y-3">
        {monthlyBurn.map((burn, index) => {
          const heightPercent = maxBurn > 0 ? (burn.amount / maxBurn) * 100 : 0;
          const isAboveAvg = burn.amount > avgBurn;

          return (
            <div key={index}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  {formatMonth(burn.month)}
                </span>
                <span className="text-slate-900 dark:text-slate-100 font-semibold tabular-nums">
                  {formatCurrency(burn.amount, currency)}
                </span>
              </div>
              <div className="relative h-8 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                <div
                  className={`absolute top-0 left-0 bottom-0 rounded-lg transition-all duration-300 ${
                    isAboveAvg
                      ? 'bg-gradient-to-r from-amber-500 to-red-500'
                      : 'bg-gradient-to-r from-brand-500 to-cyan-500'
                  }`}
                  style={{ width: `${heightPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Trend indicator */}
      {monthlyBurn.length >= 2 && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          {(() => {
            const latest = monthlyBurn[monthlyBurn.length - 1].amount;
            const previous = monthlyBurn[monthlyBurn.length - 2].amount;
            const change = latest - previous;
            const changePercent = previous > 0 ? (change / previous) * 100 : 0;

            return (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Month-over-Month Change</span>
                <span
                  className={`font-semibold tabular-nums ${
                    change > 0
                      ? 'text-red-600 dark:text-red-400'
                      : change < 0
                      ? 'text-accent-600 dark:text-accent-400'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {change > 0 ? '+' : ''}
                  {formatCurrency(change, currency)} ({changePercent > 0 ? '+' : ''}
                  {changePercent.toFixed(1)}%)
                </span>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
