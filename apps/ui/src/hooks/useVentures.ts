import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiHelpers } from '@/lib/api';
import type { Venture, ManifestItem } from '@/types/api';

/**
 * Fetch all ventures
 */
export function useVentures() {
  return useQuery({
    queryKey: ['ventures'],
    queryFn: async () => {
      const response = await apiHelpers.listEntities('venture');
      return response as { items: ManifestItem[] };
    },
  });
}

/**
 * Fetch single venture by ID
 */
export function useVenture(id: string) {
  return useQuery({
    queryKey: ['venture', id],
    queryFn: async () => {
      const response = await apiHelpers.getEntity('venture', id);
      const snapshot = response as any;
      const ventureData = (snapshot?.data || snapshot) as Venture;
      return {
        id: ventureData.id || snapshot?.id || id,
        entity: snapshot?.entity || 'venture',
        data: ventureData,
      };
    },
    enabled: !!id,
  });
}

/**
 * Create new venture
 */
export function useCreateVenture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ventureData: Partial<Venture>) => {
      const id =
        (ventureData as any)?.id ||
        `venture_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      return await apiHelpers.writeHistory('venture', {
        id,
        ...ventureData,
      });
    },
    onSuccess: () => {
      // Invalidate ventures list to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['ventures'] });
    },
  });
}

/**
 * Update existing venture
 */
export function useUpdateVenture(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ventureData: Partial<Venture>) => {
      return await apiHelpers.writeHistory('venture', {
        id,
        ...ventureData,
      });
    },
    onSuccess: () => {
      // Invalidate both list and detail queries
      queryClient.invalidateQueries({ queryKey: ['ventures'] });
      queryClient.invalidateQueries({ queryKey: ['venture', id] });
    },
  });
}
