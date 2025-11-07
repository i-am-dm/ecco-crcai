import { useQuery } from '@tanstack/react-query';
import { apiHelpers } from '@/lib/api';
import type { ManifestItem } from '@/types/api';

/**
 * Fetch all resources
 */
export function useResources() {
  return useQuery({
    queryKey: ['resources'],
    queryFn: async () => {
      const response = await apiHelpers.listEntities('resource');
      return response as { items: ManifestItem[] };
    },
  });
}
