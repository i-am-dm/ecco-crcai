import { useQuery } from '@tanstack/react-query';
import { apiHelpers } from '@/lib/api';
import type { InvestorReport, ManifestItem, ReportKPIHighlight, ReportRequest, ReportAttachment } from '@/types/api';

function normalizeReportSnapshot(snapshot: Record<string, any>): InvestorReport {
  const kpiHighlights: ReportKPIHighlight[] = Array.isArray(snapshot.kpi_highlights)
    ? snapshot.kpi_highlights.map((kpi: Record<string, any>) => ({
        label: kpi.label,
        value: kpi.value,
        deltaPercent: kpi.delta_percent,
      }))
    : [];

  const requests: ReportRequest[] = Array.isArray(snapshot.requests)
    ? snapshot.requests.map((req: Record<string, any>) => ({
        type: req.type,
        details: req.details || req.description,
      }))
    : [];

  const attachments: ReportAttachment[] = Array.isArray(snapshot.attachments)
    ? snapshot.attachments.map((attachment: Record<string, any>) => ({
        title: attachment.title,
        url: attachment.url,
        type: attachment.type,
      }))
    : [];

  return {
    id: snapshot.id,
    title: snapshot.title || snapshot.name || snapshot.id,
    ventureId: snapshot.venture_id || snapshot.ventureId,
    period: snapshot.period,
    audience: snapshot.audience,
    summary: snapshot.summary,
    updatedAt: snapshot.updated_at,
    kpiHighlights,
    milestones: snapshot.milestones,
    risks: snapshot.risks,
    requests,
    attachments,
  };
}

export function useInvestorReports() {
  return useQuery({
    queryKey: ['investor-reports'],
    queryFn: async () => {
      const response = (await apiHelpers.listEntities('report')) as { items?: ManifestItem[] };
      const items = response?.items ?? [];

      const reports = await Promise.all(
        items.map(async (item) => {
          const snapshotResponse = await apiHelpers.getEntity('report', item.id);
          const snapshot = (snapshotResponse as any)?.data || snapshotResponse;
          return normalizeReportSnapshot(snapshot);
        })
      );

      return reports.sort((a, b) => {
        const aDate = a.updatedAt ? Date.parse(a.updatedAt) : 0;
        const bDate = b.updatedAt ? Date.parse(b.updatedAt) : 0;
        return bDate - aDate;
      });
    },
  });
}

export function useInvestorReport(id?: string) {
  return useQuery({
    queryKey: ['investor-report', id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) throw new Error('Report id is required');
      const response = await apiHelpers.getEntity('report', id);
      const snapshot = (response as any)?.data || response;
      return normalizeReportSnapshot(snapshot);
    },
  });
}
