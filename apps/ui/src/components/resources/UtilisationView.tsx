import { Link } from 'react-router-dom';
import type { UtilisationItem } from '@/types/api';

interface UtilisationViewProps {
  items: UtilisationItem[];
}

export function UtilisationView({ items }: UtilisationViewProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-700/60 shadow-subtle overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Resource
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Allocations
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
            {items.map((item) => (
              <tr
                key={item.resourceId}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link
                    to={`/resources/${item.resourceId}`}
                    className="text-brand-600 dark:text-brand-400 hover:underline font-medium"
                  >
                    {item.resourceName}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-700 dark:text-slate-300">
                  {item.role}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 max-w-[120px]">
                      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-2 rounded-full ${
                            item.totalUtilisation > 100
                              ? 'bg-red-500'
                              : item.totalUtilisation < 50
                              ? 'bg-amber-500'
                              : 'bg-accent-600'
                          }`}
                          style={{ width: `${Math.min(item.totalUtilisation, 100)}%` }}
                        />
                      </div>
                    </div>
                    <span
                      className={`text-sm font-semibold tabular-nums ${
                        item.totalUtilisation > 100
                          ? 'text-red-600 dark:text-red-400'
                          : item.totalUtilisation < 50
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {item.totalUtilisation}%
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    {item.allocations.map((allocation, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"
                      >
                        <Link
                          to={`/ventures/${allocation.ventureId}`}
                          className="text-brand-600 dark:text-brand-400 hover:underline"
                        >
                          {allocation.ventureName || allocation.ventureId}
                        </Link>
                        <span className="text-slate-500">•</span>
                        <span className="font-medium tabular-nums">{allocation.percentage}%</span>
                      </div>
                    ))}
                    {item.allocations.length === 0 && (
                      <span className="text-sm text-slate-500">No allocations</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
