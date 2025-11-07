import type { ResearchDoc, ResearchDocType, ResearchDocVersion } from '@/types/idea';

const DOC_TYPE_VALUES: ResearchDocType[] = [
  'market',
  'customer',
  'product',
  'financial',
  'experiment',
  'ops',
  'other',
];

const DOC_TYPE_META: Record<ResearchDocType, { label: string; badge: string }> = {
  market: { label: 'Market Research', badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200' },
  customer: { label: 'Customer Insight', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200' },
  product: { label: 'Product / Tech', badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200' },
  financial: { label: 'Financial Model', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200' },
  experiment: { label: 'Experiment', badge: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-200' },
  ops: { label: 'Ops / Process', badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200' },
  other: { label: 'Other', badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200' },
};

export const RESEARCH_DOC_TYPE_OPTIONS = DOC_TYPE_VALUES.map((value) => ({
  value,
  label: DOC_TYPE_META[value].label,
}));

function normaliseDocType(input: unknown): ResearchDocType {
  if (typeof input === 'string') {
    const normalised = input.toLowerCase() as ResearchDocType;
    if (DOC_TYPE_VALUES.includes(normalised)) {
      return normalised;
    }
  }
  return 'other';
}

function ensureArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value === undefined || value === null) return [];
  return [value as T];
}

function normaliseVersion(version: any, fallbackId: string, idx: number): ResearchDocVersion | null {
  const url = version?.url || version?.link || version?.href;
  if (!url) return null;
  const uploadedAt = version?.uploadedAt || version?.uploaded_at || version?.timestamp || new Date().toISOString();
  return {
    id: version?.id || version?.versionId || version?.version_id || `${fallbackId}-v${idx + 1}`,
    version: version?.version || version?.label || version?.name || `v${idx + 1}`,
    url,
    storagePath: version?.storagePath || version?.storage_path || version?.gcsPath,
    uploadedAt,
    uploadedBy: version?.uploadedBy || version?.uploaded_by,
    notes: version?.notes || version?.summary,
    mimeType: version?.mimeType || version?.mime_type,
    sizeBytes: version?.sizeBytes ?? version?.size_bytes,
    checksum: version?.checksum,
  };
}

export function normaliseResearchDocs(raw: unknown): ResearchDoc[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((doc: any, docIdx: number) => {
      if (!doc) return null;
      const id = String(doc.id || doc.doc_id || doc.slug || doc.title || `doc-${docIdx + 1}`);
      const versionsSource = ensureArray(doc.versions || doc.version || doc.latestVersion);
      const versions = versionsSource
        .map((version, idx) => normaliseVersion(version, id, idx))
        .filter(Boolean) as ResearchDocVersion[];

      if (!versions.length) return null;

      versions.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

      const tagsValue = doc.tags;
      const tags = Array.isArray(tagsValue)
        ? tagsValue
            .map((tag: unknown) => (typeof tag === 'string' ? tag.trim() : ''))
            .filter(Boolean)
        : typeof tagsValue === 'string'
        ? tagsValue
            .split(',')
            .map((tag: string) => tag.trim())
            .filter(Boolean)
        : undefined;

      return {
        id,
        title: doc.title || doc.name || `Document ${docIdx + 1}`,
        docType: normaliseDocType(doc.docType || doc.type),
        summary: doc.summary || doc.notes,
        tags,
        status: (doc.status || 'active') as 'active' | 'archived',
        lastUpdated: doc.lastUpdated || doc.last_updated || versions[0]?.uploadedAt,
        versions,
      } satisfies ResearchDoc;
    })
    .filter(Boolean) as ResearchDoc[];
}

export function getResearchDocTypeMeta(type?: string) {
  const docType = normaliseDocType(type);
  return {
    value: docType,
    label: DOC_TYPE_META[docType].label,
    badgeClass: DOC_TYPE_META[docType].badge,
  };
}

export function getLatestVersion(doc: ResearchDoc): ResearchDocVersion | undefined {
  return doc.versions?.[0];
}

export function deriveAttachmentLinks(existing: string[] | undefined, docs: ResearchDoc[] | undefined): string[] {
  const dedupe = new Set<string>();
  (existing ?? []).forEach((link) => {
    if (link) dedupe.add(link);
  });
  (docs ?? []).forEach((doc) => {
    doc.versions?.forEach((version) => {
      if (version.url) dedupe.add(version.url);
    });
  });
  return Array.from(dedupe);
}
