export type PlaybookStage = 'Idea' | 'Validation' | 'Build' | 'Pilot' | 'Scale';
export type PlaybookFunction = 'GTM' | 'Design' | 'Legal' | 'Data' | 'Ops' | 'Finance' | 'Product' | 'Engineering' | string;

export interface PlaybookChecklistItem {
  id: string;
  title: string;
  role?: string;
  duration_days?: number;
  depends_on?: string[];
}

export interface PlaybookAsset {
  type: 'doc' | 'deck' | 'sheet' | 'link' | string;
  name: string;
  uri: string;
}

export interface PlaybookRule {
  id: string;
  metric: string;
  op: string;
  target: number;
  window_days?: number;
}

export interface LinkedVentureRef {
  id: string;
  last_applied?: string;
  outcome_delta_30d?: {
    MRR_delta_30d?: number;
    activation_pct_delta?: number;
  };
}

export interface PlaybookSnapshot {
  // Envelope
  id: string;
  entity: 'playbook';
  env: 'dev' | 'stg' | 'prod';
  schema_version: string;
  created_at?: string;
  updated_at: string;

  // Core fields
  name?: string; // prefer this when present
  title?: string; // manifests often include title
  stage?: PlaybookStage | string;
  function?: PlaybookFunction;
  tags?: string[];
  owner?: string;
  version?: string;
  status?: 'Draft' | 'Review' | 'Published' | string;
  effectiveness_score?: number; // 0-100

  expected_impacts?: {
    MRR_delta_30d?: number;
    activation_pct_delta?: number;
    [k: string]: number | undefined;
  };

  checklist?: PlaybookChecklistItem[];
  assets?: PlaybookAsset[];
  rules?: PlaybookRule[];
  linked_ventures?: LinkedVentureRef[];

  // Free-form properties allowed
  [key: string]: any;
}

export interface PlaybookManifestItem {
  id: string;
  entity: 'playbook';
  env?: 'dev' | 'stg' | 'prod';
  ptr: string; // snapshot path
  title?: string;
  stage?: string;
  status?: string;
  updated_at?: string;
  // Some manifests may include extra props
  [key: string]: any;
}

