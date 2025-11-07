import { useState } from 'react';
import { useBudgets } from '@/hooks/useBudgets';
import { BudgetsList } from '@/components/budgets/BudgetsList';
import { DollarSign, AlertCircle, Loader2 } from 'lucide-react';
import type { Budget } from '@/types/api';

function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function BudgetsListPage() {
  const [ventureFilter, setVentureFilter] = useState('');
  const { data, isLoading, error } = useBudgets();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-brand-600" />
          <p className="text-slate-600 dark:text-slate-400">Loading budgets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-300 mb-1">
                Failed to load budgets
              </h3>
              <p className="text-red-800 dark:text-red-400">{error.message}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const budgets = (data?.items || []) as Budget[];

  // Extract unique ventures for filter
  const uniqueVentures = Array.from(
    new Set(budgets.map((b) => b.ventureName || b.ventureId))
  ).sort();

  // Filter budgets
  const filteredBudgets = budgets.filter((budget) => {
    const matchesVenture =
      !ventureFilter ||
      budget.ventureName === ventureFilter ||
      budget.ventureId === ventureFilter;
    return matchesVenture;
  });

  // Calculate summary stats
  const totalPlanned = budgets.reduce((sum, b) => sum + b.planned, 0);
  const totalActual = budgets.reduce((sum, b) => sum + b.actual, 0);
  const totalVariance = totalActual - totalPlanned;
  const variancePercent = totalPlanned > 0 ? (totalVariance / totalPlanned) * 100 : 0;
  const overBudgetCount = budgets.filter((b) => {
    const variance = b.actual - b.planned;
    const variancePercent = b.planned > 0 ? (variance / b.planned) * 100 : 0;
    return variancePercent > 10;
  }).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Budgets</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          {budgets.length} {budgets.length === 1 ? 'budget' : 'budgets'} across ventures
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-700/60 shadow-subtle p-6">
          <div className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            Total Planned
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {formatCurrency(totalPlanned)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Across all ventures</div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-700/60 shadow-subtle p-6">
          <div className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            Total Actual
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {formatCurrency(totalActual)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Current spending</div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-700/60 shadow-subtle p-6">
          <div className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            Overall Variance
          </div>
          <div
            className={`mt-2 text-2xl font-bold tabular-nums ${
              totalVariance > 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-accent-600 dark:text-accent-400'
            }`}
          >
            {totalVariance > 0 ? '+' : ''}
            {variancePercent.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {totalVariance > 0 ? 'Over budget' : 'Under budget'}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-700/60 shadow-subtle p-6">
          <div className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            Over Budget
          </div>
          <div className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">
            {overBudgetCount}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {overBudgetCount === 1 ? 'Venture' : 'Ventures'} need attention
          </div>
        </div>
      </div>

      {/* Filters */}
      {uniqueVentures.length > 1 && (
        <div className="mb-6 flex gap-3">
          <select
            value={ventureFilter}
            onChange={(e) => setVentureFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          >
            <option value="">All Ventures</option>
            {uniqueVentures.map((venture) => (
              <option key={venture} value={venture}>
                {venture}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Budgets list */}
      {filteredBudgets.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-700/60 p-12 text-center">
          <DollarSign className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            No budgets found
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            {ventureFilter
              ? 'Try adjusting your filters'
              : 'No budgets have been added yet'}
          </p>
        </div>
      ) : (
        <BudgetsList budgets={filteredBudgets} />
      )}
    </div>
  );
}
