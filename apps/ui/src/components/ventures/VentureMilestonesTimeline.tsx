import type { ReactNode } from 'react';
import type { VentureMilestone } from '@/types/api';
import { format } from 'date-fns';
import { Flag, CheckCircle2, Clock3, AlertTriangle, PauseCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VentureMilestonesTimelineProps {
  milestones?: VentureMilestone[];
}

const statusIconMap: Record<string, ReactNode> = {
  Complete: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
  'In Progress': <Clock3 className="w-4 h-4 text-blue-500" />,
  Blocked: <AlertTriangle className="w-4 h-4 text-red-500" />,
  'Not Started': <Flag className="w-4 h-4 text-slate-400" />,
};

const statusBadgeClass: Record<string, string> = {
  Complete: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  'In Progress': 'bg-blue-50 text-blue-700 ring-blue-200',
  Blocked: 'bg-red-50 text-red-700 ring-red-200',
  'Not Started': 'bg-slate-100 text-slate-600 ring-slate-200',
};

export function VentureMilestonesTimeline({ milestones = [] }: VentureMilestonesTimelineProps) {
  if (!milestones.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-6 text-sm text-slate-500 dark:text-slate-400">
        No milestones yet. Add milestones to track execution against the venture roadmap.
      </div>
    );
  }

  const sorted = [...milestones].sort((a, b) => {
    const aTime = a.dueDate ? Date.parse(a.dueDate) : Infinity;
    const bTime = b.dueDate ? Date.parse(b.dueDate) : Infinity;
    return aTime - bTime;
  });

  const today = Date.now();

  return (
    <ol className="relative border-l border-slate-200 dark:border-slate-700 ml-3 space-y-6">
      {sorted.map((milestone) => {
        const status = milestone.status || 'Not Started';
        const due = milestone.dueDate ? format(new Date(milestone.dueDate), 'MMM d, yyyy') : 'TBD';
        const overdue = milestone.dueDate && status !== 'Complete' && Date.parse(milestone.dueDate) < today;

        return (
          <li key={milestone.id} className="ml-6">
            <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-white dark:bg-slate-900 ring-2 ring-slate-200 dark:ring-slate-700">
              {statusIconMap[status] ?? <PauseCircle className="w-4 h-4 text-slate-400" />}
            </span>
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h4 className="font-semibold text-slate-900 dark:text-white">{milestone.title}</h4>
                <span
                  className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-full ring-1',
                    statusBadgeClass[status] || 'bg-slate-100 text-slate-600 ring-slate-200'
                  )}
                >
                  {status}
                </span>
                {overdue && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                    <AlertTriangle className="w-3 h-3" /> Overdue
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">Due:</span> {due}
                </span>
                {milestone.owner && (
                  <span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">Owner:</span> {milestone.owner}
                  </span>
                )}
                {milestone.stage && (
                  <span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">Stage:</span> {milestone.stage}
                  </span>
                )}
              </div>
              {milestone.summary && (
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{milestone.summary}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
