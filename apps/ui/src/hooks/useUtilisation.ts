import { useQuery } from '@tanstack/react-query';
import { rawGet } from '@/lib/api';
import type { UtilisationData } from '@/types/api';

/**
 * Fetch utilisation data
 */
export function useUtilisation() {
  return useQuery({
    queryKey: ['utilisation'],
    queryFn: async () => {
      const data = await rawGet('/v1/ops/utilisation');
      return data as UtilisationData;
    },
  });
}
