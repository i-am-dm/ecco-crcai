import { Link } from 'react-router-dom';
import type { Budget } from '@/types/api';

interface BudgetsListProps {
  budgets: Budget[];
}

function calculateVariance(budget: Budget) {
  const variance = budget.actual - budget.planned;
  const variancePercent = budget.planned > 0 ? (variance / budget.planned) * 100 : 0;
  return { variance, variancePercent };
}

function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function BudgetsList({ budgets }: BudgetsListProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-700/60 shadow-subtle overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Venture
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Period
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Planned
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Actual
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Variance
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
            {budgets.map((budget) => {
              const { variance, variancePercent } = calculateVariance(budget);
              const isOverBudget = variancePercent > 10;
              const isNearLimit = variancePercent > 0 && variancePercent <= 10;

              return (
                <tr
                  key={budget.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      to={`/budgets/${budget.id}`}
                      className="text-brand-600 dark:text-brand-400 hover:underline font-medium"
                    >
                      {budget.ventureName || budget.ventureId}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-700 dark:text-slate-300">
                    {budget.period}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-slate-900 dark:text-slate-100 tabular-nums font-medium">
                    {formatCurrency(budget.planned, budget.currency)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-slate-900 dark:text-slate-100 tabular-nums font-medium">
                    {formatCurrency(budget.actual, budget.currency)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span
                      className={`font-semibold tabular-nums ${
                        variance > 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-accent-600 dark:text-accent-400'
                      }`}
                    >
                      {variance > 0 ? '+' : ''}
                      {formatCurrency(variance, budget.currency)}
                    </span>
                    <span
                      className={`block text-xs ${
                        variance > 0
                          ? 'text-red-500 dark:text-red-400'
                          : 'text-accent-500 dark:text-accent-400'
                      }`}
                    >
                      {variancePercent > 0 ? '+' : ''}
                      {variancePercent.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {isOverBudget ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-300 ring-1 ring-inset ring-red-200/70 dark:ring-red-800/60">
                        Over Budget
                      </span>
                    ) : isNearLimit ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 ring-1 ring-inset ring-amber-200/70 dark:ring-amber-800/60">
                        Near Limit
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-accent-50 dark:bg-accent-900/40 text-accent-700 dark:text-accent-300 ring-1 ring-inset ring-accent-200/70 dark:ring-accent-800/60">
                        On Track
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
