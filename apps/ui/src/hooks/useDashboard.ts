import { useQuery } from '@tanstack/react-query';
import { apiHelpers, rawGet } from '@/lib/api';

export function usePortfolioHeatmap() {
  return useQuery<{ points: { x: number; y: number; value: number; id: string }[] }>({
    queryKey: ['portfolio', 'heatmap'],
    queryFn: async () => {
      const data = await rawGet('/v1/portfolio/heatmap');
      return data as { points: { x: number; y: number; value: number; id: string }[] };
    },
    staleTime: 60000,
  });
}

type UtilItem = { person?: string; resourceName?: string; venture?: string; pct?: number; percentage?: number };

export function useUtilisation() {
  return useQuery<{ items: UtilItem[] }>({
    queryKey: ['ops', 'utilisation'],
    queryFn: async () => {
      const data = await rawGet('/v1/ops/utilisation');
      return data as { items: UtilItem[] };
    },
    staleTime: 60000,
  });
}

export function useRoundSnapshots() {
  return useQuery<{ id: string; ventureId?: string; targetUSD?: number; committedUSD?: number; closeDate?: string }[]>({
    queryKey: ['rounds', 'snapshots'],
    queryFn: async () => {
      const list = (await apiHelpers.listEntities('round')) as { items?: any[] };
      const items = list?.items ?? [];
      const snapshots = await Promise.all(
        items.map(async (item) => {
          const detail = await apiHelpers.getEntity('round', item.id);
          return (detail as any)?.data || detail;
        })
      );
      return snapshots as { id: string; ventureId?: string; targetUSD?: number; committedUSD?: number; closeDate?: string }[];
    },
  });
}

export function useVentureManifests() {
  return useQuery<any[]>({
    queryKey: ['ventures', 'manifests'],
    queryFn: async () => {
      const response = (await apiHelpers.listEntities('venture')) as { items?: any[] };
      return response?.items ?? [];
    },
  });
}

export function useAlerts() {
  return useQuery<any[]>({
    queryKey: ['audit', 'logs'],
    queryFn: async () => {
      const data = await rawGet('/v1/audit/logs');
      return (data?.items ?? []) as any[];
    },
    staleTime: 30000,
  });
}
