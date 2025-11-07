import type { Idea, IdeaDecisionGateAlert } from '@/types/idea';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { TrendingUp, ArrowRight, AlertTriangle } from 'lucide-react';

interface IdeasListProps {
  ideas: Idea[];
  alertsByIdea?: Record<string, IdeaDecisionGateAlert[]>;
}

export function IdeasList({ ideas, alertsByIdea }: IdeasListProps) {
  if (ideas.length === 0) {
    return (
      <div className="
        text-center
        py-12
        px-4
        rounded-2xl
        border-2 border-dashed border-slate-200 dark:border-slate-700
      ">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No ideas found matching your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="
          bg-slate-50 dark:bg-slate-800/50
          text-slate-600 dark:text-slate-300
        ">
          <tr>
            <th className="text-left font-medium px-6 py-3">Title / Theme</th>
            <th className="text-left font-medium px-6 py-3">Status</th>
            <th className="text-left font-medium px-6 py-3">Stage</th>
            <th className="text-left font-medium px-6 py-3">Score</th>
            <th className="text-left font-medium px-6 py-3">Owner</th>
            <th className="text-left font-medium px-6 py-3">Created</th>
            <th className="text-right font-medium px-6 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {ideas.map((idea) => {
            const alerts = alertsByIdea?.[idea.id] ?? [];
            const statusColors = {
              'New': 'slate',
              'Under Review': 'blue',
              'Approved': 'accent',
              'Rejected': 'red',
              'On Hold': 'amber',
            };

            const stageColors = {
              'Idea': 'slate',
              'Validation': 'blue',
              'Build': 'brand',
              'Launch': 'purple',
              'Scale': 'accent',
              'Spin-Out': 'emerald',
            };

            const statusColor = statusColors[idea.status || 'New'];
            const stageColor = stageColors[idea.stage || 'Idea'];

            return (
              <tr
                key={idea.id}
                className="
                  hover:bg-slate-50/60 dark:hover:bg-slate-800/50
                  transition-colors
                "
              >
                {/* Title / Theme */}
                <td className="px-6 py-4">
                  <Link
                    to={`/ideas/${idea.id}`}
                    className="text-brand-700 dark:text-brand-400 hover:underline font-medium"
                  >
                    {idea.title || idea.theme}
                  </Link>
                  {idea.title && (
                    <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                      {idea.theme}
                    </div>
                  )}
                  {alerts.length > 0 && (
                    <div className="mt-1 inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-300">
                      <AlertTriangle className="w-3 h-3" /> Needs decision
                    </div>
                  )}
                </td>

                {/* Status */}
                <td className="px-6 py-4">
                  <span className={`
                    inline-flex items-center gap-1
                    px-2.5 py-1
                    text-xs font-medium
                    rounded-md
                    bg-${statusColor}-50 dark:bg-${statusColor}-900/40
                    text-${statusColor}-700 dark:text-${statusColor}-300
                    ring-1 ring-inset ring-${statusColor}-200/70
                  `}>
                    {idea.status || 'New'}
                  </span>
                </td>

                {/* Stage */}
                <td className="px-6 py-4">
                  {idea.stage ? (
                    <span className={`
                      inline-flex items-center gap-1
                      px-2.5 py-1
                      text-xs font-medium
                      rounded-md
                      bg-${stageColor}-50 dark:bg-${stageColor}-900/40
                      text-${stageColor}-700 dark:text-${stageColor}-300
                      ring-1 ring-inset ring-${stageColor}-200/70
                    `}>
                      {idea.stage}
                    </span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>

                {/* Score */}
                <td className="px-6 py-4">
                  {idea.score?.overall !== undefined ? (
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-medium tabular-nums">
                        {idea.score.overall.toFixed(1)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>

                {/* Owner */}
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                  {idea.stageOwner || idea.createdBy || '-'}
                </td>

                {/* Created */}
                <td className="px-6 py-4 text-slate-500">
                  {idea.createdAt
                    ? formatDistanceToNow(new Date(idea.createdAt), { addSuffix: true })
                    : '-'}
                </td>

                {/* Action */}
                <td className="px-6 py-4 text-right">
                  <Link
                    to={`/ideas/${idea.id}`}
                    className="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
                  >
                    <span className="text-xs font-medium">View</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
