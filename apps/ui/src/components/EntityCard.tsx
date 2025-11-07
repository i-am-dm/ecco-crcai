import * as React from 'react';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/StatusBadge';
import type { Status } from '@/components/StatusBadge';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface EntityCardProps {
  id: string;
  title: string;
  subtitle?: string;
  status?: Status;
  metadata?: Array<{
    label: string;
    value: string | number;
  }>;
  footer?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function EntityCard({
  id,
  title,
  subtitle,
  status,
  metadata = [],
  footer,
  href,
  onClick,
  className,
  children,
}: EntityCardProps) {
  const isInteractive = Boolean(href || onClick);
  return (
    <Card
      className={cn(
        'p-4 transition-all',
        isInteractive &&
          'cursor-pointer hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-md group',
        className
      )}
      onClick={onClick}
      {...(href ? { href } : {})}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
            {id}
          </div>
          {subtitle && (
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {subtitle}
            </div>
          )}
        </div>
        {status && (
          <div className="ml-3 flex-shrink-0">
            <StatusBadge status={status} />
          </div>
        )}
      </div>

      {/* Title */}
      <h3 className="text-base font-medium text-slate-700 dark:text-slate-300 mb-2">
        {title}
      </h3>

      {/* Metadata */}
      {metadata.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400 mb-3">
          {metadata.map((item, index) => (
            <div key={index}>
              <span className="text-slate-400 dark:text-slate-500">
                {item.label}:
              </span>{' '}
              <span className="font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Custom content */}
      {children && <div className="mb-3">{children}</div>}

      {/* Footer */}
      {(footer || isInteractive) && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            {footer ? (
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {footer}
              </div>
            ) : (
              <div />
            )}
            {isInteractive && (
              <ChevronRight className="w-4 h-4 text-brand-600 dark:text-brand-400 group-hover:translate-x-1 transition-transform" />
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
