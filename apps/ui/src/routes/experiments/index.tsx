import { useMemo, useState } from 'react';
import { AlertTriangle, FlaskConical, Search } from 'lucide-react';
import { useExperiments } from '@/hooks/useExperiments';
import { ExperimentCard } from '@/components/experiments/ExperimentCard';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const STATUS_FILTERS = ['all', 'Proposed', 'Running', 'Completed', 'Cancelled'] as const;

export function ExperimentsPage() {
  const { data, isLoading, error } = useExperiments();
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>('Running');
  const [search, setSearch] = useState('');

  const experiments = data ?? [];

  const filtered = useMemo(() => {
    return experiments.filter((experiment) => {
      if (statusFilter !== 'all' && experiment.status !== statusFilter) return false;
      if (!search.trim()) return true;
      const term = search.toLowerCase();
      return (
        experiment.title.toLowerCase().includes(term) ||
        experiment.hypothesis?.toLowerCase().includes(term) ||
        experiment.ideaId?.toLowerCase().includes(term) ||
        experiment.ventureId?.toLowerCase().includes(term)
      );
    });
  }, [experiments, statusFilter, search]);

  const stats = useMemo(() => {
    const running = experiments.filter((exp) => exp.status === 'Running').length;
    const completed = experiments.filter((exp) => exp.status === 'Completed').length;
    const won = experiments.filter((exp) => exp.status === 'Completed' && /ship|adopt|go/i.test(exp.decision ?? '')).length;
    const successRate = completed > 0 ? Math.round((won / completed) * 100) : 0;
    return { running, completed, successRate };
  }, [experiments]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <header className="space-y-3">
        <div className="flex items-center gap-3">
          <FlaskConical className="w-6 h-6 text-brand-600" />
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">FR-8</p>
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Experiments</h1>
          </div>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
          Track validation runs, monitor active experiments, and capture outcomes that inform go/no-go decisions across the studio.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Running</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.running}</p>
          <p className="text-xs text-slate-500">Experiments in progress</p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Completed (90d)</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.completed}</p>
          <p className="text-xs text-slate-500">Recently decided runs</p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Success rate</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.successRate}%</p>
          <p className="text-xs text-slate-500">Ship/adopt decisions</p>
        </div>
      </section>

      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            <Select value={statusFilter} onValueChange={(value: (typeof STATUS_FILTERS)[number]) => setStatusFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status === 'all' ? 'All statuses' : status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                className="pl-9 w-64"
                placeholder="Search by title, idea, or venture"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Export CSV
            </Button>
            <Button variant="secondary" size="sm">
              Log new experiment
            </Button>
          </div>
        </div>

        <div className="p-6">
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="rounded-xl border border-slate-200 dark:border-slate-800 p-6 animate-pulse space-y-4">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                  <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
              ))}
            </div>
          )}

          {error && !isLoading && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-900/20 p-6 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-200">Unable to load experiments</p>
                <p className="text-sm text-amber-800 dark:text-amber-300">{error instanceof Error ? error.message : 'Please retry in a moment.'}</p>
              </div>
            </div>
          )}

          {!isLoading && !error && filtered.length === 0 && (
            <EmptyState
              title="No experiments match your filters"
              description="Adjust the status filter or search for another keyword to continue exploring experiment runs."
            />
          )}

          {!isLoading && !error && filtered.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((experiment) => (
                <ExperimentCard key={experiment.id} experiment={experiment} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
