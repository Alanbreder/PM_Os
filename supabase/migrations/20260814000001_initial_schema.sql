-- ==============================================================================
-- Product OS - Stage 1 Initial Schema & Security Migration
-- Relational Model with Explicit Foreign Keys, Indexes and Row Level Security (RLS)
-- Compatible with Supabase Cloud and Supabase Local (Proxmox)
-- ==============================================================================

-- 1. EXTENSIONS & UTILITIES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Trigger function to automatically maintain updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. CORE WORKSPACE & MEMBERSHIP TABLES
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_workspaces_updated_at
BEFORE UPDATE ON workspaces
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- references auth.users(id)
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (workspace_id, user_id)
);

-- 3. DISCOVERY LAYER: RESEARCHES & EVIDENCES
CREATE TABLE IF NOT EXISTS researches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    source_type TEXT NOT NULL DEFAULT 'interview' CHECK (source_type IN ('interview', 'survey', 'feedback', 'usability_test', 'document')),
    source_url TEXT,
    participant_info JSONB NOT NULL DEFAULT '{}'::jsonb,
    raw_content TEXT NOT NULL,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_researches_updated_at
BEFORE UPDATE ON researches
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS evidences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    research_id UUID NOT NULL REFERENCES researches(id) ON DELETE CASCADE,
    quote TEXT NOT NULL,
    context TEXT,
    confidence_level TEXT NOT NULL DEFAULT 'medium' CHECK (confidence_level IN ('high', 'medium', 'low')),
    tags TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_evidences_updated_at
BEFORE UPDATE ON evidences
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. SYNTHESIS LAYER: PROBLEMS
CREATE TABLE IF NOT EXISTS problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    impact_level TEXT NOT NULL DEFAULT 'medium' CHECK (impact_level IN ('critical', 'high', 'medium', 'low')),
    status TEXT NOT NULL DEFAULT 'identified' CHECK (status IN ('identified', 'exploring', 'validated', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_problems_updated_at
BEFORE UPDATE ON problems
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Explicit N:N Junction between Problems and Evidences
CREATE TABLE IF NOT EXISTS problem_evidences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    evidence_id UUID NOT NULL REFERENCES evidences(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (problem_id, evidence_id)
);

-- 5. STRATEGY LAYER: OPPORTUNITIES & HYPOTHESES
CREATE TABLE IF NOT EXISTS opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    strategic_value TEXT NOT NULL DEFAULT 'medium' CHECK (strategic_value IN ('high', 'medium', 'low')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'prioritized', 'in_progress', 'solved', 'discarded')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_opportunities_updated_at
BEFORE UPDATE ON opportunities
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Explicit N:N Junction between Opportunities and Problems
CREATE TABLE IF NOT EXISTS opportunity_problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (opportunity_id, problem_id)
);

CREATE TABLE IF NOT EXISTS hypotheses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    statement TEXT NOT NULL,
    metric_target TEXT NOT NULL,
    confidence_score INT NOT NULL DEFAULT 3 CHECK (confidence_score BETWEEN 1 AND 5),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'testing', 'validated', 'invalidated')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_hypotheses_updated_at
BEFORE UPDATE ON hypotheses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. PERFORMANCE & TRACEABILITY INDEXES
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_ws ON workspace_members(workspace_id);

CREATE INDEX IF NOT EXISTS idx_researches_ws_created ON researches(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_evidences_ws_research ON evidences(workspace_id, research_id);
CREATE INDEX IF NOT EXISTS idx_problems_ws_created ON problems(workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_problem_evidences_problem ON problem_evidences(problem_id);
CREATE INDEX IF NOT EXISTS idx_problem_evidences_evidence ON problem_evidences(evidence_id);
CREATE INDEX IF NOT EXISTS idx_problem_evidences_ws ON problem_evidences(workspace_id);

CREATE INDEX IF NOT EXISTS idx_opportunities_ws_created ON opportunities(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_opportunity_problems_opp ON opportunity_problems(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_problems_prob ON opportunity_problems(problem_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_problems_ws ON opportunity_problems(workspace_id);

CREATE INDEX IF NOT EXISTS idx_hypotheses_ws_opp ON hypotheses(workspace_id, opportunity_id);

-- Full-Text Search Indexes for Simple Text Queries
CREATE INDEX IF NOT EXISTS idx_researches_text ON researches USING gin(to_tsvector('simple', title || ' ' || raw_content));
CREATE INDEX IF NOT EXISTS idx_evidences_text ON evidences USING gin(to_tsvector('simple', quote || ' ' || COALESCE(context, '')));
CREATE INDEX IF NOT EXISTS idx_problems_text ON problems USING gin(to_tsvector('simple', title || ' ' || description));
CREATE INDEX IF NOT EXISTS idx_opportunities_text ON opportunities USING gin(to_tsvector('simple', title || ' ' || description));

-- 7. SECURITY: ROW LEVEL SECURITY (RLS) POLICIES

-- Helper function to check if the authenticated user belongs to a workspace
CREATE OR REPLACE FUNCTION is_workspace_member(target_workspace_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM workspace_members
        WHERE workspace_id = target_workspace_id
          AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE researches ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidences ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_evidences ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE hypotheses ENABLE ROW LEVEL SECURITY;

-- Workspaces Policies: Users can view workspaces they belong to
CREATE POLICY rls_workspaces_select ON workspaces
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id = workspaces.id
              AND workspace_members.user_id = auth.uid()
        )
    );

CREATE POLICY rls_workspaces_update ON workspaces
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id = workspaces.id
              AND workspace_members.user_id = auth.uid()
              AND workspace_members.role IN ('owner', 'admin')
        )
    );

-- Workspace Members Policies
CREATE POLICY rls_workspace_members_select ON workspace_members
    FOR SELECT
    USING (
        is_workspace_member(workspace_id)
    );

CREATE POLICY rls_workspace_members_manage ON workspace_members
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM workspace_members AS wm
            WHERE wm.workspace_id = workspace_members.workspace_id
              AND wm.user_id = auth.uid()
              AND wm.role IN ('owner', 'admin')
        )
    );

-- Researches Policies
CREATE POLICY rls_researches_all ON researches
    FOR ALL
    USING (is_workspace_member(workspace_id))
    WITH CHECK (is_workspace_member(workspace_id));

-- Evidences Policies
CREATE POLICY rls_evidences_all ON evidences
    FOR ALL
    USING (is_workspace_member(workspace_id))
    WITH CHECK (is_workspace_member(workspace_id));

-- Problems Policies
CREATE POLICY rls_problems_all ON problems
    FOR ALL
    USING (is_workspace_member(workspace_id))
    WITH CHECK (is_workspace_member(workspace_id));

-- Problem Evidences Junction Policies
CREATE POLICY rls_problem_evidences_all ON problem_evidences
    FOR ALL
    USING (is_workspace_member(workspace_id))
    WITH CHECK (is_workspace_member(workspace_id));

-- Opportunities Policies
CREATE POLICY rls_opportunities_all ON opportunities
    FOR ALL
    USING (is_workspace_member(workspace_id))
    WITH CHECK (is_workspace_member(workspace_id));

-- Opportunity Problems Junction Policies
CREATE POLICY rls_opportunity_problems_all ON opportunity_problems
    FOR ALL
    USING (is_workspace_member(workspace_id))
    WITH CHECK (is_workspace_member(workspace_id));

-- Hypotheses Policies
CREATE POLICY rls_hypotheses_all ON hypotheses
    FOR ALL
    USING (is_workspace_member(workspace_id))
    WITH CHECK (is_workspace_member(workspace_id));
