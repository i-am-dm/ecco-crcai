import { useQuery } from '@tanstack/react-query';
import { apiHelpers } from '@/lib/api';
import type { Experiment, ExperimentStatus, ExperimentConfidence } from '@/types/experiment';

function normaliseExperiment(record: any): Experiment {
  const source = record ?? {};
  const tagsValue = source.tags || source.tag_list;
  const tags = Array.isArray(tagsValue)
    ? tagsValue
    : typeof tagsValue === 'string'
    ? tagsValue.split(',').map((tag: string) => tag.trim()).filter(Boolean)
    : undefined;

  return {
    id: source.id,
    title: source.title || source.name || 'Untitled experiment',
    status: (source.status || source.state || 'Proposed') as ExperimentStatus,
    hypothesis: source.hypothesis,
    metric: source.metric || source.primary_metric,
    goal: source.goal || source.success_criteria,
    owner: source.owner || source.owner_email,
    ideaId: source.ideaId || source.idea_id,
    ventureId: source.ventureId || source.venture_id,
    startDate: source.startDate || source.start_date,
    endDate: source.endDate || source.end_date,
    decision: source.decision,
    result: source.result || source.outcome,
    confidence: (source.confidence || 'Medium') as ExperimentConfidence,
    impactScore: source.impactScore ?? source.impact_score,
    tags,
    updatedAt: source.updatedAt || source.updated_at,
  };
}

export function useExperiments() {
  return useQuery<Experiment[]>({
    queryKey: ['experiments'],
    queryFn: async () => {
      const response = (await apiHelpers.listEntities('experiment')) as { items?: any[] };
      const items = response?.items ?? [];
      return items.map((item) => normaliseExperiment(item));
    },
    staleTime: 30000,
  });
}
