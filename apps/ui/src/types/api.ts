/**
 * This file contains the API types.
 *
 * To generate types from the OpenAPI spec, run:
 * npx openapi-typescript ../../api/openapi.yaml -o src/types/api.ts
 *
 * For now, we'll use placeholder types that match the OpenAPI spec structure.
 */

export interface paths {
  '/v1/{entity}': {
    get: {
      parameters: {
        path: {
          entity: string;
        };
        query?: {
          env?: 'dev' | 'stg' | 'prod';
        };
      };
      responses: {
        200: {
          content: {
            'application/json': {
              items: any[];
            };
          };
        };
      };
    };
  };
  '/v1/ideas/{ideaId}/comments': {
    get: {
      parameters: {
        path: { ideaId: string };
        query?: { env?: 'dev' | 'stg' | 'prod' };
      };
      responses: {
        200: {
          content: {
            'application/json': CommentListResponse;
          };
        };
      };
    };
    post: {
      parameters: {
        path: { ideaId: string };
        query?: { env?: 'dev' | 'stg' | 'prod' };
      };
      requestBody: {
        content: {
          'application/json': NewCommentRequest;
        };
      };
      responses: {
        201: {
          content: {
            'application/json': {
              comment: Comment;
            };
          };
        };
      };
    };
  };
  '/v1/{entity}/{id}': {
    get: {
      parameters: {
        path: {
          entity: string;
          id: string;
        };
        query?: {
          env?: 'dev' | 'stg' | 'prod';
        };
      };
      responses: {
        200: {
          content: {
            'application/json': {
              id: string;
              entity: string;
              data: any;
            };
          };
        };
      };
    };
  };
  '/v1/portfolio/summary': {
    get: {
      parameters?: {
        query?: {
          env?: 'dev' | 'stg' | 'prod';
        };
      };
      responses: {
        200: {
          content: {
            'application/json': PortfolioSummary;
          };
        };
      };
    };
  };
  '/v1/uploads/research-docs': {
    post: {
      requestBody: {
        content: {
          'application/json': {
            env?: 'dev' | 'stg' | 'prod';
            ideaId: string;
            fileName?: string;
            contentType?: string;
            data: string;
          };
        };
      };
      responses: {
        201: {
          content: {
            'application/json': ResearchDocUploadResponse;
          };
        };
      };
    };
  };
  '/v1/kpis/{metric}/series': {
    get: {
      parameters: {
        path: {
          metric: string;
        };
        query?: {
          env?: 'dev' | 'stg' | 'prod';
          start?: string;
          end?: string;
        };
      };
      responses: {
        200: {
          content: {
            'application/json': KPISeriesResponse;
          };
        };
      };
    };
  };
  '/v1/ops/utilisation': {
    get: {
      parameters?: {
        query?: {
          env?: 'dev' | 'stg' | 'prod';
        };
      };
      responses: {
        200: {
          content: {
            'application/json': UtilisationData;
          };
        };
      };
    };
  };
  '/v1/internal/history': {
    post: {
      requestBody: {
        content: {
          'application/json': {
            entity: string;
            data: any;
          };
        };
      };
      responses: {
        202: {
          description: string;
        };
      };
    };
  };
}

// Portfolio types
export interface PortfolioSummary {
  activeVentures: number;
  totalMRR: number;
  roundsInFlight: number;
  avgRunwayDays: number;
  recentChanges: HistoryEvent[];
  statusBreakdown: {
    status: string;
    count: number;
  }[];
}

export interface HistoryEvent {
  id: string;
  entity: string;
  entityId: string;
  action: string;
  timestamp: string;
  user?: string;
  summary?: string;
  ventureTitle?: string;
}

// KPI types
export interface KPISeriesResponse {
  metric: string;
  series: KPIDataPoint[];
  byVenture: VentureKPISummary[];
}

export interface KPIDataPoint {
  date: string;
  value: number;
  ventureId?: string;
  ventureName?: string;
}

export interface VentureKPISummary {
  ventureId: string;
  ventureName: string;
  latestValue: number;
  previousValue: number;
  change: number;
  changePercent: number;
  lastUpdated: string;
}

export interface CommentAttachment {
  title?: string;
  url: string;
  type?: string;
}

export interface Comment {
  id: string;
  entity: 'comment';
  env: 'dev' | 'stg' | 'prod';
  schema_version: string;
  created_at: string;
  updated_at: string;
  idea_id: string;
  ideaId: string;
  idea_title?: string;
  message: string;
  author_id?: string;
  author_email?: string;
  author_name?: string;
  attachments?: CommentAttachment[];
  mentions?: string[];
}

export interface CommentListResponse {
  items: Comment[];
}

export interface NewCommentRequest {
  message: string;
  attachments?: CommentAttachment[];
  mentions?: string[];
  authorName?: string;
}

// Resource types (FR-13)
export interface Resource {
  id: string;
  name: string;
  role: string;
  costRate: number; // hourly rate in USD
  availability: 'Available' | 'Limited' | 'Unavailable';
  email?: string;
  skills?: string[];
  allocations?: ResourceAllocation[];
}

export interface ResourceAllocation {
  ventureId: string;
  ventureName?: string;
  percentage: number;
  startDate?: string;
  endDate?: string;
}

export interface UtilisationData {
  items: UtilisationItem[];
}

export interface UtilisationItem {
  resourceId: string;
  resourceName: string;
  role: string;
  totalUtilisation: number; // percentage 0-100+
  allocations: ResourceAllocation[];
}

export interface ResearchDocUploadResponse {
  storagePath: string;
  url: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  uploadedAt: string;
}

// Budget types (FR-15)
export interface Budget {
  id: string;
  ventureId: string;
  ventureName?: string;
  period: string; // e.g., "Q1 2025", "2025-01"
  planned: number;
  actual: number;
  currency?: string;
  monthlyBurn?: MonthlyBurn[];
  categories?: BudgetCategory[];
}

export interface MonthlyBurn {
  month: string; // YYYY-MM
  amount: number;
}

export interface BudgetCategory {
  name: string;
  planned: number;
  actual: number;
}

// Placeholder entity types
export interface Venture {
  id: string;
  title: string;
  status: 'Idea' | 'Validation' | 'Build' | 'Pilot' | 'Scale' | 'Spin-Out';
  lead: string;
  nextDue?: string;
  mrr?: number;
  description?: string;
  runway?: number;
  milestones?: VentureMilestone[];
}

export interface VentureMilestone {
  id: string;
  title: string;
  owner?: string;
  dueDate?: string;
  status?: 'Not Started' | 'In Progress' | 'Blocked' | 'Complete';
  summary?: string;
  stage?: string;
}

export interface Idea {
  id: string;
  title: string;
  status: string;
  score?: number;
  theme?: string;
  problem?: string;
  market?: string;
}

export interface ManifestItem {
  id: string;
  title?: string;
  [key: string]: any;
}

export interface Snapshot {
  id: string;
  entity: string;
  data: any;
  version?: number;
  updated?: string;
}

// Investor CRM (FR-32)
export interface InvestorRecord {
  id: string;
  name: string;
  status?: string;
  owner?: string;
  focus?: string[];
  checkRange?: string;
  checkSizeMin?: number;
  checkSizeMax?: number;
  lastInteraction?: string;
  nextSteps?: string;
  openPipelineCount?: number;
}

export interface InvestorContact {
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  timezone?: string;
}

export interface InvestorInteraction {
  date: string;
  type?: string;
  summary?: string;
}

export interface InvestorPortfolioEntry {
  ventureId: string;
  ventureName?: string;
  role?: string;
  ownership?: number;
  initialCheck?: number;
  asOf?: string;
}

export interface InvestorPipelineEntry {
  roundId: string;
  ventureName?: string;
  stage?: string;
  targetAmount?: number;
  committedAmount?: number;
  probability?: number;
  nextAction?: string;
}

export interface InvestorDetail extends InvestorRecord {
  type?: string;
  contacts?: InvestorContact[];
  interactionLog?: InvestorInteraction[];
  portfolio?: InvestorPortfolioEntry[];
  openPipelines?: InvestorPipelineEntry[];
  notes?: string;
}

// Fundraising pipeline (FR-33)
export interface FundraisingRound {
  id: string;
  ventureId?: string;
  ventureName?: string;
  stage?: string;
  status?: string;
  owner?: string;
  targetAmount?: number;
  committedAmount?: number;
  probability?: number;
  leadInvestor?: string;
  closeDate?: string;
  dataRoomId?: string;
  timeline?: FundraisingTimelineEntry[];
  investors?: FundraisingRoundInvestor[];
  useOfFunds?: string[];
  keyMetrics?: Record<string, number>;
  riskNotes?: string[];
}

export interface FundraisingRoundInvestor {
  investorId?: string;
  name?: string;
  role?: string;
  status?: string;
  commitment?: number;
}

export interface FundraisingTimelineEntry {
  date: string;
  event: string;
}

// Investor reporting (FR-35)
export interface InvestorReport {
  id: string;
  title: string;
  ventureId?: string;
  period?: string;
  audience?: string[];
  summary?: string;
  updatedAt?: string;
  kpiHighlights?: ReportKPIHighlight[];
  milestones?: string[];
  risks?: string[];
  requests?: ReportRequest[];
  attachments?: ReportAttachment[];
}

export interface ReportKPIHighlight {
  label: string;
  value: number;
  deltaPercent?: number;
}

export interface ReportRequest {
  type: string;
  details: string;
}

export interface ReportAttachment {
  title: string;
  url: string;
  type?: string;
}

// Datarooms (FR-36)
export interface DataRoom {
  id: string;
  title: string;
  ventureId?: string;
  status?: string;
  owner?: string;
  docCount?: number;
  openRequests?: number;
  lastAccessed?: string;
  documents?: DataRoomDocument[];
  permissions?: DataRoomPermission[];
  accessLogs?: DataRoomAccessLog[];
  openRequestsDetail?: DataRoomRequest[];
}

export interface DataRoomDocument {
  id: string;
  title: string;
  category?: string;
  type?: string;
  sizeMb?: number;
  updatedAt?: string;
  owner?: string;
  tags?: string[];
}

export interface DataRoomPermission {
  investorId?: string;
  name?: string;
  level?: string;
  expiresAt?: string | null;
}

export interface DataRoomAccessLog {
  timestamp: string;
  user: string;
  organization?: string;
  action: string;
  documentId?: string;
}

export interface DataRoomRequest {
  investorId?: string;
  type: string;
  description?: string;
  status?: string;
  dueDate?: string;
}
