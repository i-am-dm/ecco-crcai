import { useParams, Link } from 'react-router-dom';
import { useResource } from '@/hooks/useResource';
import { ResourceCard } from '@/components/resources/ResourceCard';
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';

export function ResourceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useResource(id!);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-brand-600" />
          <p className="text-slate-600 dark:text-slate-400">Loading resource...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-4">
          <Link
            to="/resources"
            className="inline-flex items-center gap-2 text-sm text-brand-600 dark:text-brand-400 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Resources
          </Link>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-300 mb-1">
                Failed to load resource
              </h3>
              <p className="text-red-800 dark:text-red-400">{error.message}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data?.data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-4">
          <Link
            to="/resources"
            className="inline-flex items-center gap-2 text-sm text-brand-600 dark:text-brand-400 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Resources
          </Link>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-12 text-center">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            Resource not found
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            The resource you're looking for doesn't exist
          </p>
        </div>
      </div>
    );
  }

  const resource = data.data;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          to="/resources"
          className="inline-flex items-center gap-2 text-sm text-brand-600 dark:text-brand-400 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Resources
        </Link>
      </div>

      {/* Resource detail card */}
      <ResourceCard resource={resource} />

      {/* Allocation history timeline (placeholder for future enhancement) */}
      {resource.allocations && resource.allocations.length > 0 && (
        <div className="mt-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-700/60 shadow-subtle p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Venture Assignments
          </h2>
          <div className="space-y-4">
            {resource.allocations.map((allocation, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
              >
                <div>
                  <Link
                    to={`/ventures/${allocation.ventureId}`}
                    className="font-medium text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    {allocation.ventureName || allocation.ventureId}
                  </Link>
                  {allocation.startDate && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Started: {new Date(allocation.startDate).toLocaleDateString()}
                      {allocation.endDate &&
                        ` - ${new Date(allocation.endDate).toLocaleDateString()}`}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                    {allocation.percentage}%
                  </div>
                  <div className="text-xs text-slate-500">allocated</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
