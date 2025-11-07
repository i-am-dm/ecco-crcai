import type { UtilisationItem } from '@/types/api';

interface AllocationChartProps {
  items: UtilisationItem[];
}

export function AllocationChart({ items }: AllocationChartProps) {
  // Sort by utilisation descending
  const sortedItems = [...items].sort((a, b) => b.totalUtilisation - a.totalUtilisation);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-700/60 shadow-subtle p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">
        Utilisation by Resource
      </h3>

      <div className="space-y-4">
        {sortedItems.map((item) => (
          <div key={item.resourceId}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {item.resourceName}
                </p>
                <p className="text-xs text-slate-500">{item.role}</p>
              </div>
              <span
                className={`text-sm font-semibold tabular-nums ${
                  item.totalUtilisation > 100
                    ? 'text-red-600 dark:text-red-400'
                    : item.totalUtilisation < 50
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-accent-600 dark:text-accent-400'
                }`}
              >
                {item.totalUtilisation}%
              </span>
            </div>

            {/* Bar chart */}
            <div className="relative h-6 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
              {item.allocations.map((allocation, index) => {
                // Calculate position based on previous allocations
                const startPosition = item.allocations
                  .slice(0, index)
                  .reduce((sum, a) => sum + a.percentage, 0);

                // Color palette for different ventures
                const colors = [
                  'bg-brand-500',
                  'bg-cyan-500',
                  'bg-purple-500',
                  'bg-pink-500',
                  'bg-emerald-500',
                  'bg-indigo-500',
                  'bg-amber-500',
                  'bg-rose-500',
                ];
                const color = colors[index % colors.length];

                return (
                  <div
                    key={index}
                    className={`absolute top-0 bottom-0 ${color} transition-all duration-300`}
                    style={{
                      left: `${startPosition}%`,
                      width: `${allocation.percentage}%`,
                    }}
                    title={`${allocation.ventureName || allocation.ventureId}: ${allocation.percentage}%`}
                  />
                );
              })}

              {/* Over-allocation indicator */}
              {item.totalUtilisation > 100 && (
                <div
                  className="absolute top-0 bottom-0 bg-red-500/30 border-l-2 border-red-500"
                  style={{ left: '100%', width: '2px' }}
                />
              )}
            </div>

            {/* Legend for allocations */}
            <div className="mt-2 flex flex-wrap gap-3">
              {item.allocations.map((allocation, index) => {
                const colors = [
                  'bg-brand-500',
                  'bg-cyan-500',
                  'bg-purple-500',
                  'bg-pink-500',
                  'bg-emerald-500',
                  'bg-indigo-500',
                  'bg-amber-500',
                  'bg-rose-500',
                ];
                const color = colors[index % colors.length];

                return (
                  <div key={index} className="flex items-center gap-1.5">
                    <div className={`w-3 h-3 rounded-sm ${color}`} />
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      {allocation.ventureName || allocation.ventureId}{' '}
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        ({allocation.percentage}%)
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {sortedItems.length === 0 && (
          <div className="text-center py-8">
            <p className="text-slate-500">No utilisation data available</p>
          </div>
        )}
      </div>
    </div>
  );
}
