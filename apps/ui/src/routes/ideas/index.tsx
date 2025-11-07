import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useIdeas } from '@/hooks/useIdeas';
import type { IdeaDecisionGateAlert, IdeaListFilters, IdeaStage, IdeaStatus } from '@/types/idea';
import { IdeasList } from '@/components/ideas/IdeasList';
import { IdeaCard } from '@/components/ideas/IdeaCard';
import { Plus, Filter, Grid3x3, List, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIdeaDecisionGates } from '@/hooks/useIdeaDecisionGates';

type ViewMode = 'grid' | 'table';

export function IdeasListPage() {
  const [filters, setFilters] = useState<IdeaListFilters>({
    status: 'all',
    stage: 'all',
    sortBy: 'date',
    sortOrder: 'desc',
  });

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const { data: ideas = [], isLoading, error } = useIdeas(filters);
  const { data: decisionGates = [] } = useIdeaDecisionGates();

  const alertsByIdea = useMemo<Record<string, IdeaDecisionGateAlert[]>>(() => {
    const map: Record<string, IdeaDecisionGateAlert[]> = {};
    for (const alert of decisionGates) {
      if (!map[alert.id]) map[alert.id] = [];
      map[alert.id].push(alert);
    }
    return map;
  }, [decisionGates]);

  const handleFilterChange = (key: keyof IdeaListFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      stage: 'all',
      sortBy: 'date',
      sortOrder: 'desc',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Ideas
          </h1>
          <Link to="/ideas/new">
            <Button>
              <Plus className="w-4 h-4" />
              <span>Submit Idea</span>
            </Button>
          </Link>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Idea intake and screening pipeline (FR-1, FR-2, FR-3)
        </p>
      </div>

      {/* Filter bar */}
      <div className="mb-6">
        <div className="
          rounded-xl
          bg-white dark:bg-slate-900
          border border-slate-200/70 dark:border-slate-700/60
          shadow-subtle
          p-4
        ">
          <div className="flex flex-wrap gap-3 items-end">
            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="
                inline-flex items-center gap-2
                px-3 py-2
                text-sm font-medium
                text-slate-600 dark:text-slate-400
                hover:bg-slate-100 dark:hover:bg-slate-800/50
                rounded-lg
                transition-colors
              "
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>

            {showFilters && (
              <>
                {/* Status filter */}
                <div className="flex-1 min-w-[160px]">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Status
                  </label>
                  <select
                    value={filters.status || 'all'}
                    onChange={(e) => handleFilterChange('status', e.target.value === 'all' ? 'all' : e.target.value as IdeaStatus)}
                    className="
                      w-full
                      px-3 py-2
                      text-sm
                      bg-white dark:bg-slate-900
                      border border-slate-300 dark:border-slate-700
                      rounded-lg
                      focus:ring-2 focus:ring-brand-500 focus:border-transparent
                    "
                  >
                    <option value="all">All Statuses</option>
                    <option value="New">New</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>

                {/* Stage filter */}
                <div className="flex-1 min-w-[160px]">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Stage
                  </label>
                  <select
                    value={filters.stage || 'all'}
                    onChange={(e) => handleFilterChange('stage', e.target.value === 'all' ? 'all' : e.target.value as IdeaStage)}
                    className="
                      w-full
                      px-3 py-2
                      text-sm
                      bg-white dark:bg-slate-900
                      border border-slate-300 dark:border-slate-700
                      rounded-lg
                      focus:ring-2 focus:ring-brand-500 focus:border-transparent
                    "
                  >
                    <option value="all">All Stages</option>
                    <option value="Idea">Idea</option>
                    <option value="Validation">Validation</option>
                    <option value="Build">Build</option>
                    <option value="Launch">Launch</option>
                    <option value="Scale">Scale</option>
                    <option value="Spin-Out">Spin-Out</option>
                  </select>
                </div>

                {/* Min score filter */}
                <div className="flex-1 min-w-[160px]">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Min Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={filters.minScore || ''}
                    onChange={(e) => handleFilterChange('minScore', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="0.0"
                    className="
                      w-full
                      px-3 py-2
                      text-sm
                      bg-white dark:bg-slate-900
                      border border-slate-300 dark:border-slate-700
                      rounded-lg
                      focus:ring-2 focus:ring-brand-500 focus:border-transparent
                    "
                  />
                </div>

                {/* Sort by */}
                <div className="flex-1 min-w-[160px]">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Sort By
                  </label>
                  <select
                    value={filters.sortBy || 'date'}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="
                      w-full
                      px-3 py-2
                      text-sm
                      bg-white dark:bg-slate-900
                      border border-slate-300 dark:border-slate-700
                      rounded-lg
                      focus:ring-2 focus:ring-brand-500 focus:border-transparent
                    "
                  >
                    <option value="date">Date</option>
                    <option value="score">Score</option>
                    <option value="status">Status</option>
                  </select>
                </div>

                {/* Clear filters */}
                <button
                  onClick={clearFilters}
                  className="
                    px-3 py-2
                    text-sm font-medium
                    text-slate-600 dark:text-slate-400
                    hover:text-slate-900 dark:hover:text-slate-200
                    transition-colors
                  "
                >
                  Clear
                </button>
              </>
            )}

            {/* View mode toggle */}
            <div className="ml-auto flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`
                  p-2 rounded-md transition-colors
                  ${viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }
                `}
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`
                  p-2 rounded-md transition-colors
                  ${viewMode === 'table'
                    ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }
                `}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {decisionGates.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-semibold">
              {decisionGates.length} idea{decisionGates.length === 1 ? '' : 's'} need a decision gate review
            </span>
          </div>
          <p className="mt-1 text-xs text-amber-800/80 dark:text-amber-200/80">
            Triggered when screening scores fall below threshold or ideas go stale for 30+ days.
          </p>
        </div>
      )}

      {/* Results */}
      <div className="
        rounded-xl
        bg-white dark:bg-slate-900
        border border-slate-200/70 dark:border-slate-700/60
        shadow-subtle
        overflow-hidden
      ">
        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="p-8 text-center">
            <p className="text-sm text-red-600 dark:text-red-400">
              Failed to load ideas. Please try again.
            </p>
          </div>
        )}

        {/* Results */}
        {!isLoading && !error && (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {ideas.length} {ideas.length === 1 ? 'Idea' : 'Ideas'}
                </h2>
              </div>
            </div>

            {/* Content */}
            {viewMode === 'grid' ? (
              <div className="p-6">
                {ideas.length === 0 ? (
                  <div className="
                    text-center
                    py-12
                    px-4
                    rounded-2xl
                    border-2 border-dashed border-slate-200 dark:border-slate-700
                  ">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                      No ideas found matching your filters.
                    </p>
                    <Link to="/ideas/new">
                      <Button>
                        <Plus className="w-4 h-4" />
                        <span>Submit First Idea</span>
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ideas.map((idea) => (
                      <IdeaCard key={idea.id} idea={idea} alerts={alertsByIdea[idea.id]} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <IdeasList ideas={ideas} alertsByIdea={alertsByIdea} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
