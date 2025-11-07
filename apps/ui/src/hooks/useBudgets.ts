import { useQuery } from '@tanstack/react-query';
import { apiHelpers } from '@/lib/api';
import type { ManifestItem } from '@/types/api';

/**
 * Fetch all budgets
 */
export function useBudgets() {
  return useQuery({
    queryKey: ['budgets'],
    queryFn: async () => {
      const response = await apiHelpers.listEntities('budget');
      return response as { items: ManifestItem[] };
    },
  });
}
