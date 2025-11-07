import { useQuery } from '@tanstack/react-query';
import { apiHelpers } from '@/lib/api';
import type { Budget } from '@/types/api';

/**
 * Fetch single budget by ID
 */
export function useBudget(id: string) {
  return useQuery({
    queryKey: ['budget', id],
    queryFn: async () => {
      const response = await apiHelpers.getEntity('budget', id);
      return response as { id: string; entity: string; data: Budget };
    },
    enabled: !!id,
  });
}
