import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface PlaybookFilterState {
  stage: string;
  func: string;
  owner: string;
  tags: string;
}

interface PlaybookFiltersProps {
  className?: string;
  viewMode: 'cards' | 'table';
  setViewMode: (m: 'cards' | 'table') => void;
  state: PlaybookFilterState;
  setState: (next: Partial<PlaybookFilterState>) => void;
  owners?: string[];
}

export function PlaybookFilters({ className, viewMode, setViewMode, state, setState, owners = [] }: PlaybookFiltersProps) {
  return (
    <div className={cn('flex flex-wrap items-end gap-3', className)}>
      <div>
        <div className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Search</div>
        <Input
          placeholder="Search by name, tag, owner…"
          className="w-64"
          value={state.tags}
          onChange={(e) => setState({ tags: e.target.value })}
        />
      </div>
      <div>
        <div className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Stage</div>
        <Select value={state.stage} onValueChange={(v) => setState({ stage: v })}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Idea">Idea</SelectItem>
            <SelectItem value="Validation">Validation</SelectItem>
            <SelectItem value="Build">Build</SelectItem>
            <SelectItem value="Pilot">Pilot</SelectItem>
            <SelectItem value="Scale">Scale</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <div className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Function</div>
        <Select value={state.func} onValueChange={(v) => setState({ func: v })}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="GTM">GTM</SelectItem>
            <SelectItem value="Design">Design</SelectItem>
            <SelectItem value="Legal">Legal</SelectItem>
            <SelectItem value="Data">Data</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <div className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Owner</div>
        <Select value={state.owner} onValueChange={(v) => setState({ owner: v })}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {owners.map((o) => (
              <SelectItem key={o} value={o}>{o}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={() => setViewMode('cards')}
          className={cn(
            'px-3 py-1.5 rounded-lg border text-sm',
            viewMode === 'cards'
              ? 'bg-brand-600 text-white border-transparent'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
          )}
        >
          Cards
        </button>
        <button
          onClick={() => setViewMode('table')}
          className={cn(
            'px-3 py-1.5 rounded-lg border text-sm',
            viewMode === 'table'
              ? 'bg-brand-600 text-white border-transparent'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
          )}
        >
          Table
        </button>
      </div>
    </div>
  );
}
