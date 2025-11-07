import { Link } from 'react-router-dom';
import type { Idea, IdeaDecisionGateAlert } from '@/types/idea';
import { formatDistanceToNow } from 'date-fns';
import { TrendingUp, Users, Clock, AlertTriangle } from 'lucide-react';

interface IdeaCardProps {
  idea: Idea;
  alerts?: IdeaDecisionGateAlert[];
}

export function IdeaCard({ idea, alerts = [] }: IdeaCardProps) {
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
    <Link
      to={`/ideas/${idea.id}`}
      className="
        block
        rounded-xl
        bg-white dark:bg-slate-900
        border border-slate-200/70 dark:border-slate-700/60
        hover:border-brand-300 dark:hover:border-brand-700
        hover:shadow-soft
        transition-all duration-200
        p-5
        group
      "
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1 line-clamp-1">
            {idea.title || idea.theme}
          </h3>
          {idea.title && (
            <p className="text-xs text-slate-500 line-clamp-1">{idea.theme}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {alerts.length > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-300">
              <AlertTriangle className="w-3.5 h-3.5" /> Needs decision
            </span>
          )}
          <span className="text-brand-600 dark:text-brand-400 group-hover:translate-x-1 transition-transform">
            →
          </span>
        </div>
      </div>

      {/* Problem snippet */}
      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4">
        {idea.problem}
      </p>

      {/* Badges */}
      <div className="flex items-center gap-2 mb-4">
        <span className={`
          inline-flex items-center gap-1
          px-2.5 py-1
          text-xs font-medium
          rounded-md
          bg-${statusColor}-50 dark:bg-${statusColor}-900/40
          text-${statusColor}-700 dark:text-${statusColor}-300
          ring-1 ring-inset ring-${statusColor}-200/70 dark:ring-${statusColor}-800/60
        `}>
          {idea.status || 'New'}
        </span>
        {idea.stage && (
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
        )}
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        {/* Score */}
        {idea.score?.overall !== undefined && (
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="font-medium">{idea.score.overall.toFixed(1)}</span>
          </div>
        )}

        {/* Owner */}
        {idea.stageOwner && (
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>{idea.stageOwner}</span>
          </div>
        )}

        {/* Created date */}
        {idea.createdAt && (
          <div className="flex items-center gap-1.5 ml-auto">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatDistanceToNow(new Date(idea.createdAt), { addSuffix: true })}</span>
          </div>
        )}
      </div>

      {alerts.length > 0 && (
        <ul className="mt-4 space-y-1 text-xs text-amber-700 dark:text-amber-300">
          {alerts.slice(0, 2).map((alert, index) => (
            <li key={`${alert.type}-${index}`} className="inline-flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> {alert.message}
            </li>
          ))}
        </ul>
      )}
    </Link>
  );
}
