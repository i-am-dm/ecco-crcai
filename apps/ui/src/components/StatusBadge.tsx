import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type VentureStage =
  | 'Idea'
  | 'Validation'
  | 'Build'
  | 'Pilot'
  | 'Scale'
  | 'Spin-Out';

export type VentureHealth = 'Active' | 'At Risk' | 'Critical' | 'Paused';

export type TaskStatus = 'Complete' | 'In Progress' | 'Blocked' | 'Pending';

export type Status = VentureStage | VentureHealth | TaskStatus | string;

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const statusConfig: Record<
  string,
  {
    variant: 'default' | 'primary' | 'success' | 'warning' | 'danger';
    className?: string;
  }
> = {
  // Venture Stages
  Idea: {
    variant: 'default',
    className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  },
  Validation: {
    variant: 'primary',
    className: 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 ring-1 ring-inset ring-blue-200/70',
  },
  Build: {
    variant: 'primary',
    className: '',
  },
  Pilot: {
    variant: 'primary',
    className: 'bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 ring-1 ring-inset ring-purple-200/70',
  },
  Scale: {
    variant: 'success',
    className: '',
  },
  'Spin-Out': {
    variant: 'success',
    className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 ring-1 ring-inset ring-emerald-200/70',
  },

  // Health States
  Active: {
    variant: 'success',
    className: '',
  },
  'At Risk': {
    variant: 'warning',
    className: '',
  },
  Critical: {
    variant: 'danger',
    className: '',
  },
  Paused: {
    variant: 'default',
    className: '',
  },

  // Task States
  Complete: {
    variant: 'success',
    className: '',
  },
  'In Progress': {
    variant: 'primary',
    className: '',
  },
  Blocked: {
    variant: 'danger',
    className: '',
  },
  Pending: {
    variant: 'default',
    className: '',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { variant: 'default' as const };

  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {status}
    </Badge>
  );
}
