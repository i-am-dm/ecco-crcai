/**
 * Idea type definitions matching FRD requirements (FR-1, FR-2, FR-3)
 */

export type IdeaStatus = 'New' | 'Under Review' | 'Approved' | 'Rejected' | 'On Hold';

export type IdeaStage = 'Idea' | 'Validation' | 'Build' | 'Launch' | 'Scale' | 'Spin-Out';

export interface IdeaScoring {
  overall?: number;
  market?: number;
  team?: number;
  tech?: number;
  timing?: number;
  notes?: string;
}

export type ResearchDocType =
  | 'market'
  | 'customer'
  | 'product'
  | 'financial'
  | 'experiment'
  | 'ops'
  | 'other';

export interface ResearchDocVersion {
  id?: string;
  version: string;
  url: string;
  storagePath?: string;
  uploadedAt: string;
  uploadedBy?: string;
  notes?: string;
  mimeType?: string;
  sizeBytes?: number;
  checksum?: string;
}

export interface ResearchDoc {
  id: string;
  title: string;
  docType: ResearchDocType;
  summary?: string;
  tags?: string[];
  status?: 'active' | 'archived';
  lastUpdated?: string;
  versions: ResearchDocVersion[];
}

export interface Idea {
  id: string;
  // Required fields (FR-1)
  theme: string;
  problem: string;
  market: string;
  team: string;
  tech: string;

  // Optional metadata
  title?: string;
  description?: string;

  // Screening & Scoring (FR-2)
  score?: IdeaScoring;
  status?: IdeaStatus;

  // Stage workflow (FR-3)
  stage?: IdeaStage;
  stageOwner?: string;
  stageDueDate?: string;

  // Tracking
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;

  // Additional fields
  attachments?: string[];
  tags?: string[];
  researchDocs?: ResearchDoc[];
}

export interface IdeaFormData {
  theme: string;
  problem: string;
  market: string;
  team: string;
  tech: string;
  title?: string;
  description?: string;
  tags?: string[];
  score?: IdeaScoring;
}

export interface IdeaListFilters {
  status?: IdeaStatus | 'all';
  stage?: IdeaStage | 'all';
  minScore?: number;
  sortBy?: 'score' | 'date' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface IdeaDecisionGateAlert {
  id: string;
  type: 'score_low' | 'stale';
  severity: 'warning' | 'critical';
  message: string;
  score?: number;
  updated_at?: string;
}
