import type { IdeaScoring } from '@/types/idea';
import { TrendingUp } from 'lucide-react';

interface IdeaScoringDisplayProps {
  score: IdeaScoring;
}

export function IdeaScoringDisplay({ score }: IdeaScoringDisplayProps) {
  const criteria = [
    { key: 'market', label: 'Market', value: score.market },
    { key: 'team', label: 'Team', value: score.team },
    { key: 'tech', label: 'Technology', value: score.tech },
    { key: 'timing', label: 'Timing', value: score.timing },
  ].filter((item) => item.value !== undefined);

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-accent-600 dark:text-accent-400';
    if (score >= 6) return 'text-blue-600 dark:text-blue-400';
    if (score >= 4) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getBarColor = (score: number) => {
    if (score >= 8) return 'bg-accent-600';
    if (score >= 6) return 'bg-blue-600';
    if (score >= 4) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-6 border border-slate-200/70 dark:border-slate-700/60">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-brand-600 dark:text-brand-400" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Screening Score
        </h3>
      </div>

      {/* Overall Score */}
      {score.overall !== undefined && (
        <div className="mb-6">
          <div className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
            Overall
          </div>
          <div className="flex items-end gap-4">
            <div className={`text-4xl font-bold ${getScoreColor(score.overall)} tabular-nums`}>
              {score.overall.toFixed(1)}
            </div>
            <div className="text-sm text-slate-500 pb-1">/ 10</div>
          </div>
        </div>
      )}

      {/* Criteria Breakdown */}
      {criteria.length > 0 && (
        <div className="space-y-4">
          <div className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            Breakdown
          </div>
          <div className="space-y-3">
            {criteria.map((item) => (
              <div key={item.key}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">
                    {item.label}
                  </span>
                  <span className={`font-bold tabular-nums ${getScoreColor(item.value!)}`}>
                    {item.value!.toFixed(1)}
                  </span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-2 ${getBarColor(item.value!)} rounded-full transition-all duration-300`}
                    style={{ width: `${(item.value! / 10) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {score.notes && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
            Notes
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {score.notes}
          </p>
        </div>
      )}
    </div>
  );
}
