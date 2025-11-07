import { useQuery } from '@tanstack/react-query';
import { rawGet } from '@/lib/api';
import type { IdeaDecisionGateAlert } from '@/types/idea';

export function useIdeaDecisionGates() {
  return useQuery<IdeaDecisionGateAlert[]>({
    queryKey: ['ideas', 'decision-gates'],
    queryFn: async () => {
      const data = await rawGet('/v1/ideas/decision-gates');
      return ((data as any)?.items ?? []) as IdeaDecisionGateAlert[];
    },
    staleTime: 60000,
  });
}
