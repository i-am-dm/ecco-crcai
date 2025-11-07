import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export function usePlaybookRunStats() {
  return useQuery({
    queryKey: ['playbook_runs', 'stats'],
    queryFn: async () => {
      const list = await api.GET('/v1/{entity}', { params: { path: { entity: 'playbook_run' } } });
      if (list.error) throw new Error('Failed to list playbook runs');
      const items = (list.data?.items ?? []) as any[];
      const snapshots: any[] = [];
      // Fetch up to 200 recent runs for stats
      const toFetch = items.slice(-200);
      for (const it of toFetch) {
        const id = it.id;
        const { data, error } = await api.GET('/v1/{entity}/{id}', { params: { path: { entity: 'playbook_run', id } } });
        if (!error && data) snapshots.push(data);
      }
      const now = Date.now();
      const last30 = snapshots.filter((r) => {
        const t = Date.parse(r?.applied_at || r?.updated_at || 0);
        return Number.isFinite(t) && now - t <= 30 * 86400 * 1000;
      }).length;
      const durations = snapshots
        .filter((r) => r?.completed_at && r?.applied_at)
        .map((r) => (Date.parse(r.completed_at) - Date.parse(r.applied_at)) / (86400 * 1000))
        .filter((d) => Number.isFinite(d) && d >= 0)
        .sort((a, b) => a - b);
      const median = durations.length ? durations[Math.floor(durations.length / 2)] : undefined;
      return { usedLast30d: last30, timeToImpactDays: median ? Math.round(median) : undefined };
    },
    staleTime: 30000,
  });
}

