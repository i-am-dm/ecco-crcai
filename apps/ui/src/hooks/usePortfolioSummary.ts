import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { PortfolioSummary } from '@/types/api';

/**
 * Fetch portfolio summary (FR-19: Portfolio Dashboard)
 * Returns aggregated data: active ventures, MRR, rounds in flight, runway, recent changes
 */
export function usePortfolioSummary() {
  return useQuery({
    queryKey: ['portfolio', 'summary'],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/portfolio/summary');

      if (error || !data) {
        throw new Error('Failed to fetch portfolio summary');
      }

      return data as PortfolioSummary;
    },
    // Cache for 30 seconds, refetch on window focus
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });
}
