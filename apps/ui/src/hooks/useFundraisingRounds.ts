import { useQuery } from '@tanstack/react-query';
import { apiHelpers } from '@/lib/api';
import type {
  FundraisingRound,
  FundraisingRoundInvestor,
  FundraisingTimelineEntry,
  ManifestItem,
} from '@/types/api';

function normalizeRoundManifest(item: ManifestItem): FundraisingRound {
  return {
    id: item.id,
    ventureId: item.ventureId || item.venture_id,
    ventureName: item.venture_name || item.title,
    stage: item.stage,
    status: item.status,
    owner: item.owner,
    targetAmount: item.target_amount,
    committedAmount: item.committed_amount,
    probability: item.probability,
    leadInvestor: item.lead_investor,
    closeDate: item.close_date,
    dataRoomId: item.data_room_id,
  };
}

function normalizeRoundSnapshot(snapshot: Record<string, any>): FundraisingRound {
  const investors: FundraisingRoundInvestor[] = Array.isArray(snapshot.investors)
    ? snapshot.investors.map((investor: Record<string, any>) => ({
        investorId: investor.investor_id || investor.investorId,
        name: investor.name,
        role: investor.role,
        status: investor.status,
        commitment: investor.commitment,
      }))
    : [];

  const timeline: FundraisingTimelineEntry[] = Array.isArray(snapshot.timeline)
    ? snapshot.timeline.map((event: Record<string, any>) => ({
        date: event.date,
        event: event.event,
      }))
    : [];

  return {
    id: snapshot.id,
    ventureId: snapshot.venture_id || snapshot.ventureId,
    ventureName: snapshot.venture_name || snapshot.title,
    stage: snapshot.stage,
    status: snapshot.status,
    owner: snapshot.owner,
    targetAmount: snapshot.target_amount,
    committedAmount: snapshot.committed_amount,
    probability: snapshot.probability,
    leadInvestor: snapshot.lead_investor,
    closeDate: snapshot.close_date,
    dataRoomId: snapshot.data_room_id,
    useOfFunds: snapshot.use_of_funds,
    keyMetrics: snapshot.key_metrics,
    riskNotes: snapshot.risk_notes,
    investors,
    timeline,
  };
}

export function useFundraisingRounds() {
  return useQuery({
    queryKey: ['fundraising-rounds'],
    queryFn: async () => {
      const response = (await apiHelpers.listEntities('round')) as { items?: ManifestItem[] };
      const items = response?.items ?? [];
      return items.map(normalizeRoundManifest);
    },
  });
}

export function useFundraisingRound(id?: string) {
  return useQuery({
    queryKey: ['fundraising-round', id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) throw new Error('Round id is required');
      const response = await apiHelpers.getEntity('round', id);
      const snapshot = (response as any)?.data || response;
      return normalizeRoundSnapshot(snapshot);
    },
  });
}
