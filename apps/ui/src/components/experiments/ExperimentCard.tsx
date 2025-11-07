import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Experiment } from '@/types/experiment';
import { formatDate } from '@/lib/utils';

const statusStyles: Record<string, string> = {
  Proposed: 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200',
  Running: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200',
  Completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
  Cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200',
};

const confidenceStyles: Record<string, string> = {
  Low: 'text-rose-600 dark:text-rose-300',
  Medium: 'text-amber-600 dark:text-amber-300',
  High: 'text-emerald-600 dark:text-emerald-300',
};

interface Props {
  experiment: Experiment;
}

export function ExperimentCard({ experiment }: Props) {
  const statusClass = statusStyles[experiment.status || 'Proposed'] ?? statusStyles.Proposed;
  const confidenceClass = confidenceStyles[experiment.confidence || 'Medium'] ?? confidenceStyles.Medium;

  return (
    <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{experiment.id}</p>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{experiment.title}</h3>
          </div>
          <Badge className={statusClass}>{experiment.status ?? 'Proposed'}</Badge>
        </div>

        {experiment.hypothesis && (
          <p className="text-sm text-slate-600 dark:text-slate-300">{experiment.hypothesis}</p>
        )}

        <div className="flex flex-wrap gap-3 text-xs text-slate-500">
          {experiment.metric && (
            <span>
              Metric: <span className="text-slate-900 dark:text-slate-100">{experiment.metric}</span>
            </span>
          )}
          {experiment.goal && (
            <span>
              Goal: <span className="text-slate-900 dark:text-slate-100">{experiment.goal}</span>
            </span>
          )}
          {typeof experiment.impactScore === 'number' && (
            <span>
              Impact Score: <span className="text-slate-900 dark:text-slate-100">{experiment.impactScore}/10</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-500 dark:text-slate-400">Owner</p>
            <p className="font-medium text-slate-900 dark:text-slate-100">{experiment.owner ?? 'Unassigned'}</p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400">Confidence</p>
            <p className={`font-medium ${confidenceClass}`}>{experiment.confidence ?? 'Medium'}</p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400">Start</p>
            <p className="font-medium text-slate-900 dark:text-slate-100">{formatDate(experiment.startDate)}</p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400">End</p>
            <p className="font-medium text-slate-900 dark:text-slate-100">{experiment.endDate ? formatDate(experiment.endDate) : '—'}</p>
          </div>
        </div>

        {(experiment.ideaId || experiment.ventureId) && (
          <div className="flex flex-wrap gap-4 text-xs text-brand-600 dark:text-brand-400">
            {experiment.ideaId && (
              <Link to={`/ideas/${encodeURIComponent(experiment.ideaId)}`} className="hover:underline">
                Idea {experiment.ideaId}
              </Link>
            )}
            {experiment.ventureId && (
              <Link to={`/ventures/${encodeURIComponent(experiment.ventureId)}`} className="hover:underline">
                Venture {experiment.ventureId}
              </Link>
            )}
          </div>
        )}

        {experiment.result && (
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Outcome</p>
            <p className="text-sm text-slate-700 dark:text-slate-200">{experiment.result}</p>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            Updated{' '}
            {experiment.updatedAt
              ? formatDistanceToNow(new Date(experiment.updatedAt), { addSuffix: true })
              : 'recently'}
          </span>
          {experiment.decision && <span className="font-medium text-slate-700 dark:text-slate-200">Decision: {experiment.decision}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
