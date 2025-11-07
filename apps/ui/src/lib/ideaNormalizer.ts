import type { Idea, IdeaScoring, IdeaStage, IdeaStatus } from '@/types/idea';

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const IDEA_STATUSES: IdeaStatus[] = ['New', 'Under Review', 'Approved', 'Rejected', 'On Hold'];
const IDEA_STAGES: IdeaStage[] = ['Idea', 'Validation', 'Build', 'Launch', 'Scale', 'Spin-Out'];

function pickString(source: Record<string, any>, keys: string[]): string {
  for (const key of keys) {
    const value = source?.[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }
  return '';
}

function formatMarket(raw: any): string {
  if (typeof raw?.market === 'string' && raw.market.trim()) {
    return raw.market;
  }
  if (typeof raw?.marketSizeUSD === 'number') {
    return `${usdFormatter.format(raw.marketSizeUSD)} TAM`;
  }
  return '';
}

function formatListField(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    const entries = value.filter((item) => typeof item === 'string' && item.trim().length > 0);
    if (entries.length > 0) {
      return entries.join(', ');
    }
  }
  return '';
}

function normalizeScore(source: any): IdeaScoring | undefined {
  const rawScore = source?.score;
  const pointerScore = source?.score_overall ?? source?.scoreOverall;

  if (typeof rawScore === 'number') {
    return { overall: rawScore };
  }

  if (rawScore && typeof rawScore === 'object') {
    const normalized: IdeaScoring = {};
    let hasValue = false;
    (['overall', 'market', 'team', 'tech', 'timing'] as const).forEach((key) => {
      const value = rawScore[key];
      if (typeof value === 'number') {
        normalized[key] = value;
        hasValue = true;
      }
    });
    if (typeof rawScore.notes === 'string' && rawScore.notes.trim()) {
      normalized.notes = rawScore.notes;
      hasValue = true;
    }
    if (hasValue) return normalized;
  }

  if (typeof pointerScore === 'number') {
    return { overall: pointerScore };
  }

  return undefined;
}

function normaliseId(source: any, fallbackId?: string): string {
  const id = source?.id || source?.ideaId || source?.idea_id || fallbackId;
  if (!id || typeof id !== 'string') {
    throw new Error('Idea record missing id');
  }
  return id;
}

function normaliseArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value.filter((entry) => typeof entry === 'string' && entry.trim().length > 0);
  return items.length ? items : undefined;
}

function normalizeStatus(value: any): IdeaStatus {
  if (typeof value === 'string' && IDEA_STATUSES.includes(value as IdeaStatus)) {
    return value as IdeaStatus;
  }
  return 'New';
}

function normalizeStage(value: any): IdeaStage {
  if (typeof value === 'string' && IDEA_STAGES.includes(value as IdeaStage)) {
    return value as IdeaStage;
  }
  return 'Idea';
}

export function normalizeIdeaRecord(raw: any, fallbackId?: string): Idea {
  const id = normaliseId(raw, fallbackId);
  const theme = pickString(raw, ['theme', 'title']) || 'Untitled Idea';
  const problem = pickString(raw, ['problem', 'problemStatement']);
  const team = formatListField(raw.team ?? raw.teamProfile);
  const tech = formatListField(raw.tech ?? raw.techStack);

  const normalized: Idea = {
    id,
    theme,
    problem,
    market: formatMarket(raw),
    team,
    tech,
    title: pickString(raw, ['title']) || undefined,
    description: typeof raw.description === 'string' ? raw.description : undefined,
    score: normalizeScore(raw),
    status: normalizeStatus(raw.status),
    stage: normalizeStage(raw.stage),
    stageOwner: pickString(raw, ['stageOwner', 'stage_owner']) || undefined,
    stageDueDate: pickString(raw, ['stageDueDate', 'stage_due_date']) || undefined,
    createdBy: pickString(raw, ['createdBy', 'created_by']) || undefined,
    createdAt: pickString(raw, ['createdAt', 'created_at']) || undefined,
    updatedAt: pickString(raw, ['updatedAt', 'updated_at']) || undefined,
    attachments: normaliseArray(raw.attachments),
    tags: normaliseArray(raw.tags),
  };

  return normalized;
}
