import { Link } from 'react-router-dom';
import type { Resource } from '@/types/api';

interface ResourcesListProps {
  resources: Resource[];
}

const availabilityColors = {
  Available: 'bg-accent-50 dark:bg-accent-900/40 text-accent-700 dark:text-accent-300 ring-accent-200/70 dark:ring-accent-800/60',
  Limited: 'bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 ring-amber-200/70 dark:ring-amber-800/60',
  Unavailable: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 ring-slate-200 dark:ring-slate-700',
};

export function ResourcesList({ resources }: ResourcesListProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-700/60 shadow-subtle overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Cost Rate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Utilisation
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Availability
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
            {resources.map((resource) => {
              const totalUtilisation = resource.allocations?.reduce((sum, a) => sum + a.percentage, 0) || 0;

              return (
                <tr
                  key={resource.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      to={`/resources/${resource.id}`}
                      className="text-brand-600 dark:text-brand-400 hover:underline font-medium"
                    >
                      {resource.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-700 dark:text-slate-300">
                    {resource.role}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-700 dark:text-slate-300 tabular-nums">
                    ${resource.costRate}/hr
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 max-w-[100px]">
                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-2 rounded-full ${
                              totalUtilisation > 100
                                ? 'bg-red-500'
                                : totalUtilisation < 50
                                ? 'bg-amber-500'
                                : 'bg-accent-600'
                            }`}
                            style={{ width: `${Math.min(totalUtilisation, 100)}%` }}
                          />
                        </div>
                      </div>
                      <span
                        className={`text-sm font-medium tabular-nums ${
                          totalUtilisation > 100
                            ? 'text-red-600 dark:text-red-400'
                            : totalUtilisation < 50
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {totalUtilisation}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md ring-1 ring-inset ${
                        availabilityColors[resource.availability]
                      }`}
                    >
                      {resource.availability}
                    </span>
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
