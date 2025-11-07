import type { Budget } from '@/types/api';

interface BudgetCardProps {
  budget: Budget;
}

function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function BudgetCard({ budget }: BudgetCardProps) {
  const variance = budget.actual - budget.planned;
  const variancePercent = budget.planned > 0 ? (variance / budget.planned) * 100 : 0;
  const percentSpent = budget.planned > 0 ? (budget.actual / budget.planned) * 100 : 0;
  const remaining = budget.planned - budget.actual;

  const isOverBudget = variancePercent > 10;
  const isNearLimit = variancePercent > 0 && variancePercent <= 10;

  return (
    <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/60 shadow-subtle p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {budget.period}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {budget.ventureName || budget.ventureId}
          </p>
        </div>
        {isOverBudget ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-300 ring-1 ring-inset ring-red-200/70 dark:ring-red-800/60">
            Over Budget
          </span>
        ) : isNearLimit ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 ring-1 ring-inset ring-amber-200/70 dark:ring-amber-800/60">
            {percentSpent.toFixed(0)}% Spent
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-accent-50 dark:bg-accent-900/40 text-accent-700 dark:text-accent-300 ring-1 ring-inset ring-accent-200/70 dark:ring-accent-800/60">
            On Track
          </span>
        )}
      </div>

      {/* Planned vs Actual */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-xs text-slate-500 mb-1">Planned</div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {formatCurrency(budget.planned, budget.currency)}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500 mb-1">Actual</div>
          <div
            className={`text-xl font-bold tabular-nums ${
              isOverBudget
                ? 'text-red-600 dark:text-red-400'
                : isNearLimit
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-slate-900 dark:text-slate-100'
            }`}
          >
            {formatCurrency(budget.actual, budget.currency)}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2 mb-4">
        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              isOverBudget
                ? 'bg-red-500'
                : isNearLimit
                ? 'bg-amber-500'
                : 'bg-accent-600'
            }`}
            style={{ width: `${Math.min(percentSpent, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">
            {remaining >= 0 ? (
              <>Remaining: {formatCurrency(remaining, budget.currency)}</>
            ) : (
              <>Over by: {formatCurrency(Math.abs(remaining), budget.currency)}</>
            )}
          </span>
          <span
            className={`font-medium ${
              variance > 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-accent-600 dark:text-accent-400'
            }`}
          >
            Variance: {variancePercent > 0 ? '+' : ''}
            {variancePercent.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Categories breakdown */}
      {budget.categories && budget.categories.length > 0 && (
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">
            Budget Breakdown
          </p>
          <div className="space-y-2">
            {budget.categories.map((category, index) => {
              const categoryPercent =
                category.planned > 0 ? (category.actual / category.planned) * 100 : 0;

              return (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700 dark:text-slate-300">{category.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 tabular-nums">
                      {formatCurrency(category.actual, budget.currency)} /{' '}
                      {formatCurrency(category.planned, budget.currency)}
                    </span>
                    <span
                      className={`font-medium tabular-nums w-12 text-right ${
                        categoryPercent > 100
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {categoryPercent.toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
