export type ExperimentStatus = 'Proposed' | 'Running' | 'Completed' | 'Cancelled';

export type ExperimentConfidence = 'Low' | 'Medium' | 'High';

export interface Experiment {
  id: string;
  title: string;
  status?: ExperimentStatus;
  hypothesis?: string;
  metric?: string;
  goal?: string;
  owner?: string;
  ideaId?: string;
  ventureId?: string;
  startDate?: string;
  endDate?: string;
  decision?: string;
  result?: string;
  confidence?: ExperimentConfidence;
  impactScore?: number;
  tags?: string[];
  updatedAt?: string;
}
