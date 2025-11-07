import { useQuery } from '@tanstack/react-query';
import { apiHelpers } from '@/lib/api';
import type { PlaybookManifestItem, PlaybookSnapshot } from '@/types/playbook';

export function usePlaybooks() {
  return useQuery({
    queryKey: ['playbooks'],
    queryFn: async () => {
      const data = (await apiHelpers.listEntities('playbook')) as { items?: PlaybookManifestItem[] };
      const items = data?.items ?? [];
      return { items };
    },
  });
}

export function usePlaybook(id: string) {
  return useQuery({
    queryKey: ['playbook', id],
    enabled: !!id,
    queryFn: async () => {
      const response = await apiHelpers.getEntity('playbook', id);
      const snapshot = (response as any)?.data || response;
      return snapshot as PlaybookSnapshot;
    },
  });
}
