import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { usePlaybooks } from '@/hooks/usePlaybooks';
import { usePlaybookIndexQueries } from '@/hooks/usePlaybookIndices';
import { PlaybookCard } from '@/components/playbooks/PlaybookCard';
import { PlaybookTable } from '@/components/playbooks/PlaybookTable';
import { PlaybookFilters, type PlaybookFilterState } from '@/components/playbooks/PlaybookFilters';
import { PlaybookStats } from '@/components/playbooks/PlaybookStats';
import { LoadingState } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import { usePlaybookRunStats } from '@/hooks/usePlaybookRuns';
import api from '@/lib/api';

export function PlaybooksListPage() {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const { data, isLoading } = usePlaybooks();
  const { data: runStats } = usePlaybookRunStats();
  const [filters, setFilters] = useState<PlaybookFilterState>({ stage: 'all', func: 'all', owner: 'all', tags: '' });

  const items = data?.items ?? [];
  const owners = useMemo(() => Array.from(new Set(items.map((i: any) => i.owner).filter(Boolean))), [items]);
  const [idxStage, idxFunc, idxOwner, idxTag] = usePlaybookIndexQueries({
    stage: filters.stage !== 'all' ? filters.stage : undefined,
    func: filters.func !== 'all' ? filters.func : undefined,
    owner: filters.owner !== 'all' ? filters.owner : undefined,
    tag: filters.tags ? filters.tags.trim() : undefined,
  });

  const hasIdxFilter = filters.stage !== 'all' || filters.func !== 'all' || filters.owner !== 'all' || !!filters.tags.trim();
  const filtered = useMemo(() => {
    if (!hasIdxFilter) return items;
    const lists = [idxStage, idxFunc, idxOwner, idxTag].filter((l) => Array.isArray(l) && l.length > 0) as any[][];
    if (lists.length === 0) return [] as any[];
    const idSets = lists.map((l) => new Set(l.map((x: any) => x.id)));
    const ids = [...idSets[0]].filter((id) => idSets.every((s) => s.has(id)));
    const byId: Record<string, any> = {};
    for (const l of lists) for (const it of l as any[]) byId[it.id] = it;
    return ids.map((id) => byId[id]);
  }, [hasIdxFilter, items, idxStage, idxFunc, idxOwner, idxTag]);

  const [page, setPage] = useState(1);
  const pageSize = 25;
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);
  const total = filtered.length;

  const content = useMemo(() => {
    if (isLoading) return <LoadingState variant={viewMode === 'table' ? 'table' : 'card'} count={8} />;
    if (total === 0) {
      return (
        <EmptyState
          title="No playbooks yet"
          description="Start with a template, import from Markdown/JSON, or create from scratch."
        >
          <div className="flex flex-wrap gap-2 justify-center">
            <Button variant="primary">Create from template</Button>
            <Button variant="secondary">Import</Button>
            <Button variant="outline">New playbook</Button>
          </div>
        </EmptyState>
      );
    }

    if (viewMode === 'cards') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paged.map((it) => (
            <PlaybookCard key={it.id} item={it} />
          ))}
        </div>
      );
    }

    return <PlaybookTable items={paged} />;
  }, [isLoading, paged, total, viewMode]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Playbooks {total ? <span className="text-slate-500 dark:text-slate-400 text-xl">{total}</span> : null}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/playbooks/new"><Button variant="primary">New Playbook</Button></Link>
          <Button variant="secondary" onClick={() => document.getElementById('pb-import')?.click()}>Import</Button>
          <input id="pb-import" type="file" accept="application/json,text/markdown" className="hidden" onChange={handleImport} />
          <Button variant="outline">Create from Template</Button>
          <Button variant="ghost">Edit Categories</Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <PlaybookFilters viewMode={viewMode} setViewMode={setViewMode} state={filters} setState={(n) => setFilters((s) => ({ ...s, ...n }))} owners={owners} />
      </Card>

      {/* Stats strip */}
      <PlaybookStats
        total={total}
        usedLast30d={runStats?.usedLast30d}
        avgEffectiveness={(() => {
          const scores = filtered.map((f: any) => f.effectiveness_score).filter((x: any) => typeof x === 'number');
          if (scores.length === 0) return undefined;
          return Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length);
        })()}
        timeToImpactDays={runStats?.timeToImpactDays}
      />

      {/* Content */}
      {content}

      {/* Paging */}
      {filtered.length > pageSize && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="secondary" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
          <div className="text-sm text-slate-600 dark:text-slate-400">Page {page} / {Math.ceil(filtered.length / pageSize)}</div>
          <Button variant="secondary" disabled={page >= Math.ceil(filtered.length / pageSize)} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    let json: any = null;
    try { json = JSON.parse(text); } catch {}
    if (!json) { alert('Only JSON import supported at the moment.'); e.target.value = ''; return; }
    const now = new Date().toISOString();
    const payload = { id: json.id || `PB-${Math.random().toString(36).slice(2,8).toUpperCase()}`, entity: 'playbook', env: 'dev', schema_version: '1.0.0', updated_at: now, created_at: now, ...json };
    await api.POST('/v1/internal/history', { body: payload });
    e.target.value = '';
  }
}
