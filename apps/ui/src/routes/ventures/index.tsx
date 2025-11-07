import { Link } from 'react-router-dom';
import { useVentures } from '@/hooks/useVentures';
import { Button } from '@/components/ui/button';
import { Plus, AlertCircle, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export function VenturesListPage() {
  const { data, isLoading, error } = useVentures();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-brand-600" />
          <p className="text-slate-600 dark:text-slate-400">Loading ventures...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-300 mb-1">
                Failed to load ventures
              </h3>
              <p className="text-red-800 dark:text-red-400">
                {error.message}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const ventures = data?.items || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Ventures
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            {ventures.length} {ventures.length === 1 ? 'venture' : 'ventures'}
          </p>
        </div>
        <Button variant="primary">
          <Plus className="w-5 h-5 mr-2" />
          New Venture
        </Button>
      </div>

      {ventures.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              No ventures yet
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Get started by creating your first venture
            </p>
            <Button variant="primary">
              <Plus className="w-5 h-5 mr-2" />
              Create Venture
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Lead
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {ventures.map((venture: any) => (
                  <tr
                    key={venture.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/ventures/${venture.id}`}
                        className="text-brand-600 dark:text-brand-400 hover:underline font-medium"
                      >
                        {venture.id}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-900 dark:text-white font-medium">
                        {venture.title || 'Untitled'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-800 dark:text-brand-300">
                        {venture.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                      {venture.lead || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-400 text-sm">
                      {formatDate(venture.updated)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
