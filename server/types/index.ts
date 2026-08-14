export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  created_at: string;
}

export type ResearchSourceType = 'interview' | 'survey' | 'feedback' | 'usability_test' | 'document';

export interface Research {
  id: string;
  workspace_id: string;
  title: string;
  source_type: ResearchSourceType;
  source_url?: string | null;
  participant_info: Record<string, any>;
  raw_content: string;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface Evidence {
  id: string;
  workspace_id: string;
  research_id: string;
  quote: string;
  context?: string | null;
  confidence_level: ConfidenceLevel;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export type ProblemImpact = 'critical' | 'high' | 'medium' | 'low';
export type ProblemStatus = 'identified' | 'exploring' | 'validated' | 'archived';

export interface Problem {
  id: string;
  workspace_id: string;
  title: string;
  description: string;
  impact_level: ProblemImpact;
  status: ProblemStatus;
  created_at: string;
  updated_at: string;
  evidences?: Evidence[];
}

export interface ProblemEvidence {
  id: string;
  workspace_id: string;
  problem_id: string;
  evidence_id: string;
  created_at: string;
}

export type OpportunityStatus = 'draft' | 'active' | 'archived';

export interface Opportunity {
  id: string;
  workspace_id: string;
  title: string;
  description: string;
  status: OpportunityStatus;
  created_at: string;
  updated_at: string;
  problems?: Problem[];
  hypotheses?: Hypothesis[];
}

export interface OpportunityProblem {
  id: string;
  workspace_id: string;
  opportunity_id: string;
  problem_id: string;
  created_at: string;
}

export type HypothesisStatus = 'draft' | 'testing' | 'validated' | 'invalidated';

export interface Hypothesis {
  id: string;
  workspace_id: string;
  opportunity_id: string;
  statement: string;
  metric_target: string;
  confidence_score: number;
  status: HypothesisStatus;
  created_at: string;
  updated_at: string;
  opportunity_title?: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  workspace?: {
    id: string;
    role: WorkspaceRole;
    name: string;
  };
}

export interface SuggestedEvidence {
  id?: string;
  quote: string;
  context?: string | null;
  confidence_level: ConfidenceLevel;
  tags?: string[];
  status?: 'accepted' | 'rejected' | 'pending';
}

export interface SuggestedProblem {
  id?: string;
  title: string;
  description: string;
  impact_level: ProblemImpact;
  supporting_evidence_indices: number[];
  status?: 'accepted' | 'rejected' | 'pending';
}

export interface ResearchAnalysisOutput {
  evidences: SuggestedEvidence[];
  problems: SuggestedProblem[];
}
