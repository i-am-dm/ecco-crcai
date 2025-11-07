import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Idea } from '@/types/idea';
import { normaliseResearchDocs } from '@/lib/researchDocs';
import { normalizeIdeaRecord } from '@/lib/ideaNormalizer';

/**
 * Hook to fetch a single idea by ID
 */
export function useIdea(id: string | undefined) {
  return useQuery({
    queryKey: ['idea', id],
    queryFn: async () => {
      if (!id) {
        throw new Error('Idea ID is required');
      }

      const { data, error } = await api.GET('/v1/{entity}/{id}', {
        params: {
          path: { entity: 'idea', id },
        },
      });

      if (error) {
        throw new Error(`Failed to fetch idea: ${error}`);
      }

      // Parse snapshot response
      const snapshot = data as any;
      const ideaData = snapshot.data || snapshot;

      const researchDocs = normaliseResearchDocs(ideaData.researchDocs || ideaData.research_docs);

      const idea: Idea = {
        ...normalizeIdeaRecord(ideaData, id),
        researchDocs,
      };

      return idea;
    },
    enabled: !!id, // Only run query if ID is provided
    staleTime: 60000, // 1 minute
  });
}
