import { useQuery } from '@tanstack/react-query';
import { rawGet } from '@/lib/api';

export function usePlaybookHistory(id: string) {
  return useQuery({
    queryKey: ['playbook', id, 'history'],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return [];
      const data = await rawGet(`/v1/history/playbook/${encodeURIComponent(id)}`);
      return (data?.items ?? []) as any[];
    },
  });
}
