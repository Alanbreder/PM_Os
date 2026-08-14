export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export type ResearchSourceType = 'interview' | 'survey' | 'feedback' | 'usability_test' | 'document';

export interface Research {
  id: string;
  workspace_id: string;
  title: string;
  source_type: ResearchSourceType;
  source_url?: string | null;
  participant_info: {
    name?: string;
    role?: string;
    company?: string;
    segment?: string;
    [key: string]: any;
  };
  raw_content: string;
  status: 'draft' | 'processing' | 'processed';
  created_at: string;
  updated_at: string;
  evidences?: Evidence[];
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
  updated_at?: string;
  research_title?: string;
  research_source_type?: ResearchSourceType;
  research_participant_name?: string;
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
  evidences?: Evidence[];
  created_at: string;
  updated_at?: string;
}

export type OpportunityStatus = 'draft' | 'active' | 'archived';

export interface Opportunity {
  id: string;
  workspace_id: string;
  title: string;
  description: string;
  status: OpportunityStatus;
  problems?: Problem[];
  created_at: string;
  updated_at: string;
}

// AI Suggestions (Human-in-the-loop)
export interface SuggestedEvidenceItem {
  id: string; // client temporary ID
  quote: string;
  context?: string;
  confidence_level: ConfidenceLevel;
  tags: string[];
  status: 'accepted' | 'rejected';
  isEditing?: boolean;
}

export interface SuggestedProblemItem {
  id: string; // client temporary ID
  title: string;
  description: string;
  impact_level: ProblemImpact;
  supporting_evidence_indices: number[];
  status: 'accepted' | 'rejected';
  isEditing?: boolean;
}

export interface AIAnalysisState {
  researchId: string;
  evidences: SuggestedEvidenceItem[];
  problems: SuggestedProblemItem[];
  isAnalyzing: boolean;
  isSaving: boolean;
  error?: string | null;
}
