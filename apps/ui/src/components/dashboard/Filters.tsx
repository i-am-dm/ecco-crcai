import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

export interface DashboardFiltersState {
  stage: string;
  owner: string;
  risk: string;
  tags: string;
  time: '7d' | '14d' | '30d' | 'all';
  search: string;
}

interface FiltersProps {
  state: DashboardFiltersState;
  setState: (next: Partial<DashboardFiltersState>) => void;
  stages?: string[];
  owners?: string[];
}

export function DashboardFilters({ state, setState, stages = [], owners = [] }: FiltersProps) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <div className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Search</div>
          <Input
            placeholder="Search ventures, playbooks…"
            className="w-72"
            value={state.search}
            onChange={(e) => setState({ search: e.target.value })}
          />
        </div>
        <div>
          <div className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Stage</div>
          <Select value={state.stage} onValueChange={(v) => setState({ stage: v })}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {stages.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <div className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Owner</div>
          <Select value={state.owner} onValueChange={(v) => setState({ owner: v })}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {owners.map((o) => (<SelectItem key={o} value={o}>{o}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <div className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Risk</div>
          <Select value={state.risk} onValueChange={(v) => setState({ risk: v })}>
            <SelectTrigger className="w-32"><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="flagged">Flagged</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <div className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Time</div>
          <Select value={state.time} onValueChange={(v) => setState({ time: v as DashboardFiltersState['time'] })}>
            <SelectTrigger className="w-32"><SelectValue placeholder="14d" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7d</SelectItem>
              <SelectItem value="14d">14d</SelectItem>
              <SelectItem value="30d">30d</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

