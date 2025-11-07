import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 ring-1 ring-inset ring-slate-200 dark:ring-slate-700',
        primary:
          'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300 ring-1 ring-inset ring-brand-200/70 dark:ring-brand-800/60',
        secondary:
          'bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-50',
        success:
          'bg-accent-50 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300 ring-1 ring-inset ring-accent-200/70 dark:ring-accent-800/60',
        warning:
          'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 ring-1 ring-inset ring-amber-200/70',
        danger:
          'bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-300 ring-1 ring-inset ring-red-200/70',
        destructive:
          'bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-300 ring-1 ring-inset ring-red-200/70',
        outline:
          'border border-slate-200 text-slate-950 dark:border-slate-800 dark:text-slate-50',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
