import * as React from 'react';
import type { LucideProps } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>>;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  children?: React.ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700',
        className
      )}
    >
      {Icon && (
        <div className="mb-4 p-3 rounded-full bg-slate-100 dark:bg-slate-800">
          <Icon className="w-8 h-8 text-slate-400 dark:text-slate-500" />
        </div>
      )}

      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">
        {title}
      </h3>

      {description && (
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm mb-6">
          {description}
        </p>
      )}

      {children && <div className="mb-6">{children}</div>}

      {(action || secondaryAction) && (
        <div className="flex items-center gap-3">
          {action && (
            <Button onClick={action.onClick} variant="primary">
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button onClick={secondaryAction.onClick} variant="outline">
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
