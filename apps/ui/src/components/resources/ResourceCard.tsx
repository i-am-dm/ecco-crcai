import type { Resource } from '@/types/api';

interface ResourceCardProps {
  resource: Resource;
}

const availabilityColors = {
  Available: 'bg-accent-50 dark:bg-accent-900/40 text-accent-700 dark:text-accent-300 ring-accent-200/70 dark:ring-accent-800/60',
  Limited: 'bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 ring-amber-200/70 dark:ring-amber-800/60',
  Unavailable: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 ring-slate-200 dark:ring-slate-700',
};

export function ResourceCard({ resource }: ResourceCardProps) {
  const totalUtilisation = resource.allocations?.reduce((sum, a) => sum + a.percentage, 0) || 0;

  // Generate initials for avatar
  const initials = resource.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/60 shadow-subtle p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold">
            {initials}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {resource.name}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">{resource.role}</p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md ring-1 ring-inset ${
            availabilityColors[resource.availability]
          }`}
        >
          {resource.availability}
        </span>
      </div>

      <div className="space-y-4">
        {/* Cost Rate */}
        <div className="flex items-center justify-between py-3 border-t border-slate-100 dark:border-slate-800">
          <span className="text-sm text-slate-600 dark:text-slate-400">Cost Rate</span>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
            ${resource.costRate}/hr
          </span>
        </div>

        {/* Utilisation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-400">Utilisation</span>
            <span
              className={`text-sm font-semibold tabular-nums ${
                totalUtilisation > 100
                  ? 'text-red-600 dark:text-red-400'
                  : totalUtilisation < 50
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-accent-600 dark:text-accent-400'
              }`}
            >
              {totalUtilisation}%
            </span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                totalUtilisation > 100
                  ? 'bg-red-500'
                  : totalUtilisation < 50
                  ? 'bg-amber-500'
                  : 'bg-accent-600'
              }`}
              style={{ width: `${Math.min(totalUtilisation, 100)}%` }}
            />
          </div>
          {totalUtilisation > 100 && (
            <p className="text-xs text-red-600 dark:text-red-400">
              Over-allocated by {totalUtilisation - 100}%
            </p>
          )}
          {totalUtilisation < 50 && totalUtilisation > 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Under-utilised ({100 - totalUtilisation}% available)
            </p>
          )}
        </div>

        {/* Allocations */}
        {resource.allocations && resource.allocations.length > 0 && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
              Current Allocations
            </p>
            <div className="space-y-2">
              {resource.allocations.map((allocation, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700 dark:text-slate-300">
                    {allocation.ventureName || allocation.ventureId}
                  </span>
                  <span className="font-medium text-slate-900 dark:text-slate-100 tabular-nums">
                    {allocation.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {resource.skills && resource.skills.length > 0 && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
              Skills
            </p>
            <div className="flex flex-wrap gap-2">
              {resource.skills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Email */}
        {resource.email && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
              Email
            </p>
            <a
              href={`mailto:${resource.email}`}
              className="text-sm text-brand-600 dark:text-brand-400 hover:underline"
            >
              {resource.email}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
