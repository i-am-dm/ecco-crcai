import { useState } from 'react';
import { useResources } from '@/hooks/useResources';
import { useUtilisation } from '@/hooks/useUtilisation';
import { ResourcesList } from '@/components/resources/ResourcesList';
import { UtilisationView } from '@/components/resources/UtilisationView';
import { AllocationChart } from '@/components/resources/AllocationChart';
import { Users, AlertCircle, Loader2, BarChart3 } from 'lucide-react';
import type { Resource } from '@/types/api';

type ViewMode = 'directory' | 'utilisation';

export function ResourcesListPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');

  const { data: resourcesData, isLoading: resourcesLoading, error: resourcesError } = useResources();
  const { data: utilisationData, isLoading: utilisationLoading, error: utilisationError } = useUtilisation();

  const isLoading = resourcesLoading || utilisationLoading;
  const error = resourcesError || utilisationError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-brand-600" />
          <p className="text-slate-600 dark:text-slate-400">Loading resources...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-300 mb-1">
                Failed to load resources
              </h3>
              <p className="text-red-800 dark:text-red-400">{error.message}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const resources = (resourcesData?.items || []) as Resource[];
  const utilisationItems = utilisationData?.items || [];

  // Extract unique roles for filter
  const uniqueRoles = Array.from(new Set(resources.map((r) => r.role).filter((role): role is string => Boolean(role)))).sort();

  // Filter resources
  const filteredResources = resources.filter((resource) => {
    const matchesSearch =
      !searchQuery ||
      resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.role.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = !roleFilter || resource.role === roleFilter;
    const matchesAvailability = !availabilityFilter || resource.availability === availabilityFilter;

    return matchesSearch && matchesRole && matchesAvailability;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Resources</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          {resources.length} team {resources.length === 1 ? 'member' : 'members'}
        </p>
      </div>

      {/* View toggle and filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* View mode toggle */}
        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            onClick={() => setViewMode('directory')}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewMode === 'directory'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            Directory
          </button>
          <button
            onClick={() => setViewMode('utilisation')}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewMode === 'utilisation'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Utilisation
          </button>
        </div>

        {/* Filters (only show in directory mode) */}
        {viewMode === 'directory' && (
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              <option value="">All Roles</option>
              {uniqueRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              <option value="">All Availability</option>
              <option value="Available">Available</option>
              <option value="Limited">Limited</option>
              <option value="Unavailable">Unavailable</option>
            </select>
          </div>
        )}
      </div>

      {/* Content based on view mode */}
      {viewMode === 'directory' ? (
        <>
          {filteredResources.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-700/60 p-12 text-center">
              <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                No resources found
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {searchQuery || roleFilter || availabilityFilter
                  ? 'Try adjusting your filters'
                  : 'No resources have been added yet'}
              </p>
            </div>
          ) : (
            <ResourcesList resources={filteredResources} />
          )}
        </>
      ) : (
        <div className="space-y-6">
          {utilisationItems.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-700/60 p-12 text-center">
              <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                No utilisation data
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Utilisation data will appear here once resources are allocated to ventures
              </p>
            </div>
          ) : (
            <>
              {/* Allocation Chart */}
              <AllocationChart items={utilisationItems} />

              {/* Utilisation Table */}
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  Detailed Breakdown
                </h2>
                <UtilisationView items={utilisationItems} />
              </div>

              {/* Summary stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-700/60 p-6">
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Over-Allocated
                  </div>
                  <div className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">
                    {utilisationItems.filter((i) => i.totalUtilisation > 100).length}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Resources need rebalancing</div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-700/60 p-6">
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Under-Utilised
                  </div>
                  <div className="mt-2 text-3xl font-bold text-amber-600 dark:text-amber-400">
                    {utilisationItems.filter((i) => i.totalUtilisation < 50 && i.totalUtilisation > 0).length}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Available capacity</div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-700/60 p-6">
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Avg. Utilisation
                  </div>
                  <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">
                    {utilisationItems.length > 0
                      ? Math.round(
                          utilisationItems.reduce((sum, i) => sum + i.totalUtilisation, 0) /
                            utilisationItems.length
                        )
                      : 0}
                    %
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Across all resources</div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
