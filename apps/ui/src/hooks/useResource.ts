import { useQuery } from '@tanstack/react-query';
import { apiHelpers } from '@/lib/api';
import type { Resource } from '@/types/api';

/**
 * Fetch single resource by ID
 */
export function useResource(id: string) {
  return useQuery({
    queryKey: ['resource', id],
    queryFn: async () => {
      const response = await apiHelpers.getEntity('resource', id);
      return response as { id: string; entity: string; data: Resource };
    },
    enabled: !!id,
  });
}
