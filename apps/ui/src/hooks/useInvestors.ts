import { useQuery } from '@tanstack/react-query';
import { apiHelpers } from '@/lib/api';
import type {
  InvestorRecord,
  InvestorDetail,
  InvestorContact,
  InvestorPortfolioEntry,
  InvestorPipelineEntry,
  InvestorInteraction,
  ManifestItem,
} from '@/types/api';

const toArray = <T>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  return value ? [value as T] : [];
};

function normalizeInvestorManifest(item: ManifestItem): InvestorRecord {
  const focusValue = item.focus ?? item.focus_area ?? item.primary_focus;
  const focus = Array.isArray(focusValue)
    ? focusValue
    : typeof focusValue === 'string'
    ? focusValue.split(',').map((entry) => entry.trim()).filter(Boolean)
    : [];

  return {
    id: item.id,
    name: item.title || item.name || item.id,
    status: item.status,
    owner: item.owner,
    focus,
    checkRange: item.check_range || item.checkRange,
    lastInteraction: item.last_interaction || item.lastInteraction || item.updated_at,
    nextSteps: item.next_steps || item.nextSteps,
    openPipelineCount: typeof item.open_pipeline_count === 'number' ? item.open_pipeline_count : undefined,
  };
}

function normalizeInvestorDetail(snapshot: Record<string, any>): InvestorDetail {
  const focusValue = snapshot.primary_focus ?? snapshot.focus;
  const focus = Array.isArray(focusValue)
    ? (focusValue as string[])
    : typeof focusValue === 'string'
    ? focusValue.split(',').map((entry) => entry.trim()).filter(Boolean)
    : [];

  const contacts: InvestorContact[] = toArray<Record<string, any>>(snapshot.contacts).map((contact) => ({
    name: contact.name,
    title: contact.title,
    email: contact.email,
    phone: contact.phone,
    timezone: contact.timezone,
  }));

  const interactionLog: InvestorInteraction[] = toArray<Record<string, any>>(snapshot.interaction_log).map((log) => ({
    date: log.date,
    type: log.type,
    summary: log.summary,
  }));

  const portfolio: InvestorPortfolioEntry[] = toArray<Record<string, any>>(snapshot.portfolio).map((entry) => ({
    ventureId: entry.venture_id || entry.ventureId,
    ventureName: entry.venture_name || entry.ventureName,
    role: entry.role,
    ownership: typeof entry.ownership === 'number' ? entry.ownership : undefined,
    initialCheck: typeof entry.initial_check === 'number' ? entry.initial_check : undefined,
    asOf: entry.as_of || entry.asOf,
  }));

  const openPipelines: InvestorPipelineEntry[] = toArray<Record<string, any>>(snapshot.open_pipelines).map((pipeline) => ({
    roundId: pipeline.round_id || pipeline.roundId,
    ventureName: pipeline.venture_name || pipeline.ventureName,
    stage: pipeline.stage,
    targetAmount: pipeline.target_amount,
    committedAmount: pipeline.committed_amount,
    probability: pipeline.probability,
    nextAction: pipeline.next_action || pipeline.nextAction,
  }));

  return {
    id: snapshot.id,
    name: snapshot.name || snapshot.title || snapshot.id,
    type: snapshot.type,
    owner: snapshot.owner,
    status: snapshot.status,
    focus,
    checkSizeMin: snapshot.check_size_min,
    checkSizeMax: snapshot.check_size_max,
    checkRange: snapshot.check_range,
    lastInteraction: snapshot.last_interaction,
    nextSteps: snapshot.next_steps,
    notes: snapshot.notes,
    openPipelineCount: Array.isArray(snapshot.open_pipelines) ? snapshot.open_pipelines.length : snapshot.open_pipeline_count,
    contacts,
    interactionLog,
    portfolio,
    openPipelines,
  };
}

export function useInvestors() {
  return useQuery({
    queryKey: ['investors'],
    queryFn: async () => {
      const response = (await apiHelpers.listEntities('investor')) as { items?: ManifestItem[] };
      const items = response?.items ?? [];
      return items.map(normalizeInvestorManifest);
    },
  });
}

export function useInvestor(id?: string) {
  return useQuery({
    queryKey: ['investor-detail', id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) {
        throw new Error('Investor id is required');
      }
      const response = await apiHelpers.getEntity('investor', id);
      const snapshot = (response as any)?.data || response;
      return normalizeInvestorDetail(snapshot);
    },
  });
}
