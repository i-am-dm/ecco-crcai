interface RunwayIndicatorProps {
  planned: number;
  actual: number;
  monthlyBurn?: number;
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

export function RunwayIndicator({
  planned,
  actual,
  monthlyBurn,
  currency = 'USD',
}: RunwayIndicatorProps) {
  const remaining = planned - actual;

  // Calculate runway months
  let runwayMonths = 0;
  if (monthlyBurn && monthlyBurn > 0 && remaining > 0) {
    runwayMonths = remaining / monthlyBurn;
  }

  // Determine status
  const isHealthy = runwayMonths >= 6;
  const isWarning = runwayMonths >= 3 && runwayMonths < 6;
  const isCritical = runwayMonths > 0 && runwayMonths < 3;
  const isDepleted = remaining <= 0;

  return (
    <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 border border-slate-200/70 dark:border-slate-700/60 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            Budget Runway
          </h3>
          {monthlyBurn && monthlyBurn > 0 ? (
            <p className="text-xs text-slate-500 mt-1">
              Based on avg. burn of {formatCurrency(monthlyBurn, currency)}/month
            </p>
          ) : (
            <p className="text-xs text-slate-500 mt-1">Monthly burn rate not available</p>
          )}
        </div>
        {isDepleted ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-300 ring-1 ring-inset ring-red-200/70 dark:ring-red-800/60">
            Depleted
          </span>
        ) : isCritical ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-300 ring-1 ring-inset ring-red-200/70 dark:ring-red-800/60">
            Critical
          </span>
        ) : isWarning ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 ring-1 ring-inset ring-amber-200/70 dark:ring-amber-800/60">
            Warning
          </span>
        ) : isHealthy ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-accent-50 dark:bg-accent-900/40 text-accent-700 dark:text-accent-300 ring-1 ring-inset ring-accent-200/70 dark:ring-accent-800/60">
            Healthy
          </span>
        ) : null}
      </div>

      {/* Runway display */}
      <div className="mb-6">
        {monthlyBurn && monthlyBurn > 0 && remaining > 0 ? (
          <div className="flex items-baseline gap-2">
            <span
              className={`text-5xl font-bold tabular-nums ${
                isDepleted
                  ? 'text-red-600 dark:text-red-400'
                  : isCritical
                  ? 'text-red-600 dark:text-red-400'
                  : isWarning
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-accent-600 dark:text-accent-400'
              }`}
            >
              {runwayMonths.toFixed(1)}
            </span>
            <span className="text-lg text-slate-600 dark:text-slate-400">months</span>
          </div>
        ) : (
          <div className="text-3xl font-bold text-slate-400">—</div>
        )}
      </div>

      {/* Gauge visualization */}
      <div className="relative">
        {/* Background arc */}
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          {monthlyBurn && monthlyBurn > 0 && runwayMonths > 0 && (
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                isDepleted
                  ? 'bg-red-500'
                  : isCritical
                  ? 'bg-red-500'
                  : isWarning
                  ? 'bg-amber-500'
                  : 'bg-accent-600'
              }`}
              style={{
                width: `${Math.min((runwayMonths / 12) * 100, 100)}%`,
              }}
            />
          )}
        </div>

        {/* Scale markers */}
        <div className="flex justify-between mt-2 text-xs text-slate-500">
          <span>0</span>
          <span>3 mos</span>
          <span>6 mos</span>
          <span>12+ mos</span>
        </div>
      </div>

      {/* Remaining budget */}
      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600 dark:text-slate-400">Remaining Budget</span>
          <span className="text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {formatCurrency(remaining, currency)}
          </span>
        </div>
      </div>

      {/* Warning messages */}
      {isDepleted && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-xs text-red-700 dark:text-red-300">
            Budget has been exceeded. Immediate action required.
          </p>
        </div>
      )}
      {isCritical && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-xs text-red-700 dark:text-red-300">
            Less than 3 months of runway remaining. Consider cost reduction or additional funding.
          </p>
        </div>
      )}
      {isWarning && (
        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-xs text-amber-700 dark:text-amber-300">
            3-6 months of runway remaining. Monitor spending closely.
          </p>
        </div>
      )}
    </div>
  );
}
