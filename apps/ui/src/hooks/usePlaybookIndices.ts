import { useQueries } from '@tanstack/react-query';
import { rawGet } from '@/lib/api';

export function usePlaybookIndexQueries(params: { envDep?: any; stage?: string; func?: string; owner?: string; tag?: string }) {
  const { stage, func, owner, tag } = params;
  const queries = useQueries({
    queries: [
      stage && stage !== 'all'
        ? {
            queryKey: ['idx', 'playbooks', 'by-stage', stage],
            queryFn: async () => {
              const data = await rawGet(`/v1/index/playbooks/by-stage/${encodeURIComponent(stage!)}`);
              return data?.items as any[];
            },
          }
        : { queryKey: ['idx', 'stage', 'noop'], queryFn: async () => [] as any[] },
      func && func !== 'all'
        ? {
            queryKey: ['idx', 'playbooks', 'by-function', func],
            queryFn: async () => {
              const data = await rawGet(`/v1/index/playbooks/by-function/${encodeURIComponent(func!)}`);
              return data?.items as any[];
            },
          }
        : { queryKey: ['idx', 'func', 'noop'], queryFn: async () => [] as any[] },
      owner && owner !== 'all'
        ? {
            queryKey: ['idx', 'playbooks', 'by-owner', owner],
            queryFn: async () => {
              const data = await rawGet(`/v1/index/playbooks/by-owner/${encodeURIComponent(owner!)}`);
              return data?.items as any[];
            },
          }
        : { queryKey: ['idx', 'owner', 'noop'], queryFn: async () => [] as any[] },
      tag && tag.trim()
        ? {
            queryKey: ['idx', 'playbooks', 'by-tag', tag],
            queryFn: async () => {
              const data = await rawGet(`/v1/index/playbooks/by-tag/${encodeURIComponent(tag!)}`);
              return data?.items as any[];
            },
          }
        : { queryKey: ['idx', 'tag', 'noop'], queryFn: async () => [] as any[] },
    ],
  });
  return queries.map((q) => q.data || []) as any[][];
}
