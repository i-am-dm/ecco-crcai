import { useMutation, useQueryClient } from '@tanstack/react-query';
import api, { apiHelpers } from '@/lib/api';
import type { Idea } from '@/types/idea';
import { useUIStore } from '@/stores/uiStore';

/**
 * Hook to update an existing idea
 */
export function useUpdateIdea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Idea> }) => {
      // Fetch current idea state
      const { data: currentData, error: fetchError } = await api.GET('/v1/{entity}/{id}', {
        params: {
          path: { entity: 'idea', id },
        },
      });

      if (fetchError) {
        throw new Error(`Failed to fetch current idea: ${fetchError}`);
      }

      const currentSnapshot = currentData as any;
      const currentIdea = currentSnapshot.data || currentSnapshot;

      // Merge updates
      const nowIso = new Date().toISOString();
      const env = currentIdea.env || useUIStore.getState().env;
      const previousStage = currentIdea.stage;
      let stageHistory = currentIdea.stage_history || currentIdea.stageHistory || [];

      if (updates.stage && updates.stage !== previousStage) {
        stageHistory = [
          ...stageHistory,
          {
            stage: updates.stage,
            changed_at: nowIso,
            changed_by: updates.stageOwner || currentIdea.stageOwner || currentIdea.stage_owner || currentIdea.createdBy,
          },
        ];
      }

      const updatedIdea = {
        ...currentIdea,
        ...updates,
        entity: 'idea',
        env,
        stage_history: stageHistory,
        updatedAt: nowIso,
        updated_at: nowIso,
      };

      const stageOwnerResolved = updatedIdea.stageOwner || updatedIdea.stage_owner;
      if (stageOwnerResolved) {
        updatedIdea.stageOwner = stageOwnerResolved;
        updatedIdea.stage_owner = stageOwnerResolved;
      }
      const stageDueResolved = updatedIdea.stageDueDate || updatedIdea.stage_due_date;
      if (stageDueResolved) {
        updatedIdea.stageDueDate = stageDueResolved;
        updatedIdea.stage_due_date = stageDueResolved;
      }

      await apiHelpers.writeHistory('idea', updatedIdea);

      return { id, data: updatedIdea };
    },
    onSuccess: (result) => {
      // Invalidate both list and detail queries
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
      queryClient.invalidateQueries({ queryKey: ['idea', result.id] });
    },
  });
}
