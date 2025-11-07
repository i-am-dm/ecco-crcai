import { useParams, Link } from 'react-router-dom';
import { useBudget } from '@/hooks/useBudget';
import { BudgetCard } from '@/components/budgets/BudgetCard';
import { BurnRateChart } from '@/components/budgets/BurnRateChart';
import { RunwayIndicator } from '@/components/budgets/RunwayIndicator';
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';

export function BudgetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useBudget(id!);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-brand-600" />
          <p className="text-slate-600 dark:text-slate-400">Loading budget...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-4">
          <Link
            to="/budgets"
            className="inline-flex items-center gap-2 text-sm text-brand-600 dark:text-brand-400 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Budgets
          </Link>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-300 mb-1">
                Failed to load budget
              </h3>
              <p className="text-red-800 dark:text-red-400">{error.message}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data?.data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-4">
          <Link
            to="/budgets"
            className="inline-flex items-center gap-2 text-sm text-brand-600 dark:text-brand-400 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Budgets
          </Link>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-12 text-center">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            Budget not found
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            The budget you're looking for doesn't exist
          </p>
        </div>
      </div>
    );
  }

  const budget = data.data;

  // Calculate average monthly burn if monthlyBurn is available
  const avgMonthlyBurn =
    budget.monthlyBurn && budget.monthlyBurn.length > 0
      ? budget.monthlyBurn.reduce((sum, b) => sum + b.amount, 0) / budget.monthlyBurn.length
      : undefined;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          to="/budgets"
          className="inline-flex items-center gap-2 text-sm text-brand-600 dark:text-brand-400 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Budgets
        </Link>
      </div>

      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {budget.period} Budget
            </h1>
            {budget.ventureId && (
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                <Link
                  to={`/ventures/${budget.ventureId}`}
                  className="text-brand-600 dark:text-brand-400 hover:underline"
                >
                  {budget.ventureName || budget.ventureId}
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Budget overview and burn rate */}
        <div className="lg:col-span-2 space-y-6">
          {/* Budget card */}
          <BudgetCard budget={budget} />

          {/* Burn rate chart */}
          {budget.monthlyBurn && budget.monthlyBurn.length > 0 && (
            <BurnRateChart monthlyBurn={budget.monthlyBurn} currency={budget.currency} />
          )}
        </div>

        {/* Right column - Runway indicator */}
        <div>
          <RunwayIndicator
            planned={budget.planned}
            actual={budget.actual}
            monthlyBurn={avgMonthlyBurn}
            currency={budget.currency}
          />
        </div>
      </div>

      {/* Additional context section */}
      <div className="mt-8 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Budget Management Tips
        </h3>
        <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
          <li className="flex gap-2">
            <span className="text-brand-600 dark:text-brand-400">•</span>
            <span>
              Variance over 10% indicates significant deviation from plan - review spending
              categories
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-brand-600 dark:text-brand-400">•</span>
            <span>
              Maintain at least 6 months runway for healthy financial stability
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-brand-600 dark:text-brand-400">•</span>
            <span>
              Monitor burn rate trends - increasing burn may require cost optimization or additional
              funding
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-brand-600 dark:text-brand-400">•</span>
            <span>
              Update actuals regularly to ensure accurate runway projections
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
