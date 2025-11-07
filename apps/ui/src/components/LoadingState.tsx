import * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  variant?:
    | 'card'
    | 'table'
    | 'list'
    | 'stat'
    | 'form'
    | 'page'
    | 'text'
    | 'custom';
  count?: number;
  className?: string;
  children?: React.ReactNode;
}

// Card skeleton
function CardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('p-6', className)}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Skeleton className="h-5 w-20 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-6 w-16 rounded-md" />
      </div>
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4" />
      <div className="mt-4 flex gap-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-24" />
      </div>
    </Card>
  );
}

// Stat card skeleton
function StatSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <Skeleton className="h-3 w-24 mb-2" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
      <Skeleton className="h-3 w-32" />
    </Card>
  );
}

// Table row skeleton
function TableRowSkeleton() {
  return (
    <tr className="border-b border-slate-200 dark:border-slate-800">
      <td className="p-4">
        <Skeleton className="h-4 w-16" />
      </td>
      <td className="p-4">
        <Skeleton className="h-4 w-32" />
      </td>
      <td className="p-4">
        <Skeleton className="h-4 w-24" />
      </td>
      <td className="p-4">
        <Skeleton className="h-4 w-20" />
      </td>
    </tr>
  );
}

// List item skeleton
function ListItemSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 border-b border-slate-200 dark:border-slate-800',
        className
      )}
    >
      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
      <div className="flex-1">
        <Skeleton className="h-4 w-48 mb-2" />
        <Skeleton className="h-3 w-64" />
      </div>
      <Skeleton className="h-6 w-16 rounded-md flex-shrink-0" />
    </div>
  );
}

// Form field skeleton
function FormFieldSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-3 w-48" />
    </div>
  );
}

// Page skeleton (full layout)
function PageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <StatSkeleton key={i} />
        ))}
      </div>

      {/* Content */}
      <Card className="p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </Card>
    </div>
  );
}

// Text skeleton
function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {[...Array(lines)].map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4', i === lines - 1 ? 'w-3/4' : 'w-full')}
        />
      ))}
    </div>
  );
}

export function LoadingState({
  variant = 'card',
  count = 1,
  className,
  children,
}: LoadingStateProps) {
  if (children) {
    return <>{children}</>;
  }

  switch (variant) {
    case 'card':
      return (
        <>
          {[...Array(count)].map((_, i) => (
            <CardSkeleton key={i} className={className} />
          ))}
        </>
      );

    case 'stat':
      return (
        <>
          {[...Array(count)].map((_, i) => (
            <StatSkeleton key={i} className={className} />
          ))}
        </>
      );

    case 'table':
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="p-4">
                  <Skeleton className="h-4 w-16" />
                </th>
                <th className="p-4">
                  <Skeleton className="h-4 w-24" />
                </th>
                <th className="p-4">
                  <Skeleton className="h-4 w-20" />
                </th>
                <th className="p-4">
                  <Skeleton className="h-4 w-16" />
                </th>
              </tr>
            </thead>
            <tbody>
              {[...Array(count)].map((_, i) => (
                <TableRowSkeleton key={i} />
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'list':
      return (
        <div className={className}>
          {[...Array(count)].map((_, i) => (
            <ListItemSkeleton key={i} />
          ))}
        </div>
      );

    case 'form':
      return (
        <div className={cn('space-y-6', className)}>
          {[...Array(count)].map((_, i) => (
            <FormFieldSkeleton key={i} />
          ))}
        </div>
      );

    case 'page':
      return <PageSkeleton />;

    case 'text':
      return <TextSkeleton lines={count} />;

    default:
      return null;
  }
}
