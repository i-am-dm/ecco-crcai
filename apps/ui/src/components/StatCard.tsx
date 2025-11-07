import * as React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideProps } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: {
    value: string | number;
    trend: 'up' | 'down' | 'neutral';
  };
  icon?: React.ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>>;
  description?: string;
  variant?: 'default' | 'brand' | 'success' | 'warning' | 'danger';
  className?: string;
}

const variantStyles = {
  default: {
    card: 'bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 border-slate-200 dark:border-slate-700',
    icon: 'bg-slate-100 dark:bg-slate-800',
    iconColor: 'text-slate-600 dark:text-slate-400',
  },
  brand: {
    card: 'bg-gradient-to-br from-brand-50 to-cyan-50 dark:from-brand-900/20 dark:to-cyan-900/20 border-brand-100 dark:border-brand-800/40',
    icon: 'bg-brand-100 dark:bg-brand-900/40',
    iconColor: 'text-brand-600 dark:text-brand-400',
  },
  success: {
    card: 'bg-gradient-to-br from-accent-50 to-emerald-50 dark:from-accent-900/20 dark:to-emerald-900/20 border-accent-100 dark:border-accent-800/40',
    icon: 'bg-accent-100 dark:bg-accent-900/40',
    iconColor: 'text-accent-600 dark:text-accent-400',
  },
  warning: {
    card: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-100 dark:border-amber-800/40',
    icon: 'bg-amber-100 dark:bg-amber-900/40',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  danger: {
    card: 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-100 dark:border-red-800/40',
    icon: 'bg-red-100 dark:bg-red-900/40',
    iconColor: 'text-red-600 dark:text-red-400',
  },
};

export function StatCard({
  label,
  value,
  change,
  icon: Icon,
  description,
  variant = 'default',
  className,
}: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <Card className={cn('p-5', styles.card, className)}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            {label}
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
              {value}
            </span>
            {change && (
              <span
                className={cn(
                  'text-sm font-medium',
                  change.trend === 'up' &&
                    'text-accent-600 dark:text-accent-400',
                  change.trend === 'down' && 'text-red-600 dark:text-red-400',
                  change.trend === 'neutral' &&
                    'text-slate-500 dark:text-slate-400'
                )}
              >
                {change.trend === 'up' && '+'}
                {change.value}
              </span>
            )}
          </div>
        </div>
        {Icon && (
          <div
            className={cn(
              'p-2 rounded-lg flex items-center justify-center',
              styles.icon
            )}
          >
            <Icon className={cn('w-5 h-5', styles.iconColor)} />
          </div>
        )}
      </div>

      {description && (
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {description}
        </div>
      )}
    </Card>
  );
}
