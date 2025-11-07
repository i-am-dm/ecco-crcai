import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiHelpers } from '@/lib/api';
import type { IdeaFormInput } from '@/lib/schemas/idea';
import type { IdeaScoring } from '@/types/idea';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';

type NumericScoreKey = Exclude<keyof IdeaScoring, 'notes'>;
const numericKeys: NumericScoreKey[] = ['overall', 'market', 'team', 'tech', 'timing'];

/**
 * Hook to create a new idea (FR-1: Idea Intake)
 */
function sanitizeScore(score?: IdeaScoring): IdeaScoring | undefined {
  if (!score) return undefined;
  const sanitized: IdeaScoring = {};
  let hasNumeric = false;
  for (const key of numericKeys) {
    const value = score[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      sanitized[key] = Number(value.toFixed(1));
      hasNumeric = true;
    }
  }
  if (sanitized.overall === undefined) {
    const contributors = numericKeys
      .filter((key) => key !== 'overall')
      .map((key) => sanitized[key])
      .filter((value): value is number => typeof value === 'number');
    if (contributors.length > 0) {
      const avg = contributors.reduce((sum, value) => sum + value, 0) / contributors.length;
      sanitized.overall = Number(avg.toFixed(1));
    }
  }
  if (typeof score.notes === 'string' && score.notes.trim().length > 0) {
    sanitized.notes = score.notes.trim();
  }
  if (!hasNumeric && !sanitized.notes) {
    return undefined;
  }
  return sanitized;
}

export function useCreateIdea() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const env = useUIStore((state) => state.env);

  return useMutation({
    mutationFn: async (formData: IdeaFormInput) => {
      // Generate ID based on timestamp
      const id = `idea_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Build idea payload
      const nowIso = new Date().toISOString();
      const owner = user?.email || 'anonymous';
      const stageDueDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString();
      const ideaData: Record<string, any> = {
        id,
        entity: 'idea' as const,
        env,
        ...formData,
        title: formData.title || formData.theme,
        status: 'New' as const,
        stage: 'Idea' as const,
        createdBy: owner,
        created_by: owner,
        createdAt: nowIso,
        created_at: nowIso,
        updatedAt: nowIso,
        updated_at: nowIso,
        schema_version: 'v1.0.0',
        stageOwner: owner,
        stage_owner: owner,
        stageDueDate: stageDueDate,
        stage_due_date: stageDueDate,
        stage_history: [
          {
            stage: 'Idea',
            changed_at: nowIso,
            changed_by: owner,
            notes: 'Initial submission',
          },
        ],
      };

      const normalizedScore = sanitizeScore(formData.score);
      if (normalizedScore) {
        ideaData.score = normalizedScore;
      } else {
        delete ideaData.score;
      }

      await apiHelpers.writeHistory('idea', ideaData);

      return { id, data: ideaData };
    },
    onSuccess: () => {
      // Invalidate ideas list to refetch
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
    },
  });
}
