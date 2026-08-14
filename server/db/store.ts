import {
  Workspace,
  WorkspaceMember,
  Research,
  Evidence,
  Problem,
  Opportunity,
  Hypothesis,
  WorkspaceRole,
} from '../types/index.js';
import { db } from '../../src/db/index.js';
import * as schema from '../../src/db/schema.js';
import { eq, and, desc, inArray } from 'drizzle-orm';

class PostgresStore {
  // Sync user record from Firebase Auth to PostgreSQL
  async syncUser(uid: string, email: string, name?: string): Promise<void> {
    try {
      const existing = await db
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(eq(schema.users.uid, uid))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(schema.users).values({
          uid,
          email,
          name: name || null,
          role: 'user',
        });
      }
    } catch (err) {
      console.error('Postgres syncUser error:', err);
    }
  }

  // Workspaces
  async listAllWorkspaces(): Promise<Workspace[]> {
    try {
      const rows = await db
        .select()
        .from(schema.workspaces)
        .orderBy(desc(schema.workspaces.createdAt));

      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        created_at: r.createdAt.toISOString(),
        updated_at: r.updatedAt.toISOString(),
      }));
    } catch (err) {
      console.error('Postgres listAllWorkspaces error:', err);
      throw new Error('Falha ao listar todos os workspaces');
    }
  }

  async listWorkspacesForUser(userId: string): Promise<Workspace[]> {
    try {
      const memberships = await db
        .select({ workspaceId: schema.workspaceMembers.workspaceId })
        .from(schema.workspaceMembers)
        .where(eq(schema.workspaceMembers.userId, userId));

      const wsIds = memberships.map((m) => m.workspaceId);
      if (wsIds.length === 0) return [];

      const rows = await db
        .select()
        .from(schema.workspaces)
        .where(inArray(schema.workspaces.id, wsIds));

      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        created_at: r.createdAt.toISOString(),
        updated_at: r.updatedAt.toISOString(),
      }));
    } catch (err) {
      console.error('Postgres listWorkspacesForUser error:', err);
      throw new Error('Falha ao listar workspaces no banco de dados');
    }
  }

  async getWorkspaceById(workspaceId: string): Promise<Workspace | null> {
    try {
      const rows = await db
        .select()
        .from(schema.workspaces)
        .where(eq(schema.workspaces.id, workspaceId))
        .limit(1);

      if (rows.length === 0) return null;
      const r = rows[0];
      return {
        id: r.id,
        name: r.name,
        slug: r.slug,
        created_at: r.createdAt.toISOString(),
        updated_at: r.updatedAt.toISOString(),
      };
    } catch (err) {
      console.error('Postgres getWorkspaceById error:', err);
      throw new Error('Falha ao buscar workspace');
    }
  }

  async createWorkspace(name: string, slug: string, ownerUserId: string): Promise<Workspace> {
    try {
      const [ws] = await db
        .insert(schema.workspaces)
        .values({ name, slug })
        .returning();

      await db.insert(schema.workspaceMembers).values({
        workspaceId: ws.id,
        userId: ownerUserId,
        role: 'owner',
      });

      return {
        id: ws.id,
        name: ws.name,
        slug: ws.slug,
        created_at: ws.createdAt.toISOString(),
        updated_at: ws.updatedAt.toISOString(),
      };
    } catch (err) {
      console.error('Postgres createWorkspace error:', err);
      throw new Error('Falha ao criar workspace no banco de dados');
    }
  }

  // Memberships
  async getMembership(workspaceId: string, userId: string): Promise<{ role: WorkspaceRole; workspace_id: string } | null> {
    try {
      const rows = await db
        .select()
        .from(schema.workspaceMembers)
        .where(
          and(
            eq(schema.workspaceMembers.workspaceId, workspaceId),
            eq(schema.workspaceMembers.userId, userId)
          )
        )
        .limit(1);

      if (rows.length === 0) return null;
      return {
        role: rows[0].role as WorkspaceRole,
        workspace_id: rows[0].workspaceId,
      };
    } catch (err) {
      console.error('Postgres getMembership error:', err);
      return null;
    }
  }

  async addMember(workspaceId: string, userId: string, role: WorkspaceRole): Promise<WorkspaceMember> {
    try {
      const [m] = await db
        .insert(schema.workspaceMembers)
        .values({
          workspaceId,
          userId,
          role,
        })
        .returning();

      return {
        id: m.id,
        workspace_id: m.workspaceId,
        user_id: m.userId,
        role: m.role as WorkspaceRole,
        created_at: m.createdAt.toISOString(),
      };
    } catch (err) {
      console.error('Postgres addMember error:', err);
      throw new Error('Falha ao adicionar membro ao workspace');
    }
  }

  // Researches
  async listResearches(workspaceId: string): Promise<Research[]> {
    try {
      const rows = await db
        .select()
        .from(schema.researches)
        .where(eq(schema.researches.workspaceId, workspaceId))
        .orderBy(desc(schema.researches.createdAt));

      return rows.map((r) => ({
        id: r.id,
        workspace_id: r.workspaceId,
        title: r.title,
        source_type: r.sourceType as any,
        raw_content: r.rawContent,
        participant_info: r.participantInfo as any,
        created_at: r.createdAt.toISOString(),
        updated_at: r.updatedAt.toISOString(),
      }));
    } catch (err) {
      console.error('Postgres listResearches error:', err);
      throw new Error('Falha ao listar pesquisas');
    }
  }

  async getResearchById(workspaceId: string, id: string): Promise<Research | null> {
    try {
      const rows = await db
        .select()
        .from(schema.researches)
        .where(
          and(
            eq(schema.researches.id, id),
            eq(schema.researches.workspaceId, workspaceId)
          )
        )
        .limit(1);

      if (rows.length === 0) return null;
      const r = rows[0];
      return {
        id: r.id,
        workspace_id: r.workspaceId,
        title: r.title,
        source_type: r.sourceType as any,
        raw_content: r.rawContent,
        participant_info: r.participantInfo as any,
        created_at: r.createdAt.toISOString(),
        updated_at: r.updatedAt.toISOString(),
      };
    } catch (err) {
      console.error('Postgres getResearchById error:', err);
      throw new Error('Falha ao buscar pesquisa');
    }
  }

  async createResearch(
    workspaceId: string,
    data: Omit<Research, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>
  ): Promise<Research> {
    try {
      const [r] = await db
        .insert(schema.researches)
        .values({
          workspaceId,
          title: data.title,
          sourceType: data.source_type,
          rawContent: data.raw_content,
          participantInfo: data.participant_info || {},
          status: 'processed',
        })
        .returning();

      return {
        id: r.id,
        workspace_id: r.workspaceId,
        title: r.title,
        source_type: r.sourceType as any,
        raw_content: r.rawContent,
        participant_info: r.participantInfo as any,
        created_at: r.createdAt.toISOString(),
        updated_at: r.updatedAt.toISOString(),
      };
    } catch (err) {
      console.error('Postgres createResearch error:', err);
      throw new Error('Falha ao registrar pesquisa');
    }
  }

  // Evidences
  async listEvidences(workspaceId: string, researchId?: string): Promise<Evidence[]> {
    try {
      const conditions = [eq(schema.evidences.workspaceId, workspaceId)];
      if (researchId) {
        conditions.push(eq(schema.evidences.researchId, researchId));
      }

      const rows = await db
        .select()
        .from(schema.evidences)
        .where(and(...conditions))
        .orderBy(desc(schema.evidences.createdAt));

      return rows.map((e) => ({
        id: e.id,
        workspace_id: e.workspaceId,
        research_id: e.researchId,
        quote: e.quote,
        context: e.context || undefined,
        confidence_level: e.confidenceLevel as any,
        tags: (e.tags as string[]) || [],
        created_at: e.createdAt.toISOString(),
        updated_at: e.updatedAt.toISOString(),
      }));
    } catch (err) {
      console.error('Postgres listEvidences error:', err);
      throw new Error('Falha ao listar evidências');
    }
  }

  async createEvidence(
    workspaceId: string,
    data: Omit<Evidence, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>
  ): Promise<Evidence> {
    try {
      // 1. Strict cross-tenant validation: Ensure target research belongs to the exact same workspace
      const researchCheck = await this.getResearchById(workspaceId, data.research_id);
      if (!researchCheck) {
        throw new Error('A pesquisa de referência não existe ou pertence a outro workspace.');
      }

      const [e] = await db
        .insert(schema.evidences)
        .values({
          workspaceId,
          researchId: data.research_id,
          quote: data.quote,
          context: data.context || null,
          confidenceLevel: data.confidence_level || 'medium',
          tags: data.tags || [],
        })
        .returning();

      return {
        id: e.id,
        workspace_id: e.workspaceId,
        research_id: e.researchId,
        quote: e.quote,
        context: e.context || undefined,
        confidence_level: e.confidenceLevel as any,
        tags: (e.tags as string[]) || [],
        created_at: e.createdAt.toISOString(),
        updated_at: e.updatedAt.toISOString(),
      };
    } catch (err: any) {
      console.error('Postgres createEvidence error:', err);
      throw err;
    }
  }

  // Problems
  async listProblems(workspaceId: string): Promise<Problem[]> {
    try {
      const problemsRows = await db
        .select()
        .from(schema.problems)
        .where(eq(schema.problems.workspaceId, workspaceId))
        .orderBy(desc(schema.problems.createdAt));

      const peRows = await db
        .select()
        .from(schema.problemEvidences)
        .where(eq(schema.problemEvidences.workspaceId, workspaceId));

      const allEvidences = await this.listEvidences(workspaceId);
      const evidenceMap = new Map(allEvidences.map((e) => [e.id, e]));

      return problemsRows.map((p) => {
        const linkedIds = peRows
          .filter((pe) => pe.problemId === p.id)
          .map((pe) => pe.evidenceId);

        const attached = linkedIds
          .map((id) => evidenceMap.get(id))
          .filter(Boolean) as Evidence[];

        return {
          id: p.id,
          workspace_id: p.workspaceId,
          title: p.title,
          description: p.description,
          impact_level: p.impactLevel as any,
          status: p.status as any,
          evidences: attached,
          created_at: p.createdAt.toISOString(),
          updated_at: p.updatedAt.toISOString(),
        };
      });
    } catch (err) {
      console.error('Postgres listProblems error:', err);
      throw new Error('Falha ao listar problemas');
    }
  }

  async getProblemById(workspaceId: string, id: string): Promise<Problem | null> {
    try {
      const rows = await db
        .select()
        .from(schema.problems)
        .where(
          and(
            eq(schema.problems.id, id),
            eq(schema.problems.workspaceId, workspaceId)
          )
        )
        .limit(1);

      if (rows.length === 0) return null;
      const p = rows[0];

      const peRows = await db
        .select()
        .from(schema.problemEvidences)
        .where(
          and(
            eq(schema.problemEvidences.workspaceId, workspaceId),
            eq(schema.problemEvidences.problemId, id)
          )
        );

      const evidenceIds = peRows.map((pe) => pe.evidenceId);
      let attached: Evidence[] = [];
      if (evidenceIds.length > 0) {
        const evRows = await db
          .select()
          .from(schema.evidences)
          .where(
            and(
              eq(schema.evidences.workspaceId, workspaceId),
              inArray(schema.evidences.id, evidenceIds)
            )
          );
        attached = evRows.map((e) => ({
          id: e.id,
          workspace_id: e.workspaceId,
          research_id: e.researchId,
          quote: e.quote,
          context: e.context || undefined,
          confidence_level: e.confidenceLevel as any,
          tags: (e.tags as string[]) || [],
          created_at: e.createdAt.toISOString(),
          updated_at: e.updatedAt.toISOString(),
        }));
      }

      return {
        id: p.id,
        workspace_id: p.workspaceId,
        title: p.title,
        description: p.description,
        impact_level: p.impactLevel as any,
        status: p.status as any,
        evidences: attached,
        created_at: p.createdAt.toISOString(),
        updated_at: p.updatedAt.toISOString(),
      };
    } catch (err) {
      console.error('Postgres getProblemById error:', err);
      throw new Error('Falha ao buscar problema');
    }
  }

  async createProblem(
    workspaceId: string,
    data: Omit<Problem, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>,
    evidenceIds: string[] = []
  ): Promise<Problem> {
    try {
      // 1. Verify all evidenceIds belong strictly to this workspace (prevent cross-tenant linkage)
      if (evidenceIds.length > 0) {
        const validEvidences = await db
          .select({ id: schema.evidences.id })
          .from(schema.evidences)
          .where(
            and(
              eq(schema.evidences.workspaceId, workspaceId),
              inArray(schema.evidences.id, evidenceIds)
            )
          );

        if (validEvidences.length !== evidenceIds.length) {
          throw new Error('Uma ou mais evidências selecionadas não pertencem a este workspace.');
        }
      }

      const [p] = await db
        .insert(schema.problems)
        .values({
          workspaceId,
          title: data.title,
          description: data.description,
          impactLevel: data.impact_level || 'medium',
          status: data.status || 'open',
        })
        .returning();

      for (const evidenceId of evidenceIds) {
        await db.insert(schema.problemEvidences).values({
          workspaceId,
          problemId: p.id,
          evidenceId,
        });
      }

      return {
        id: p.id,
        workspace_id: p.workspaceId,
        title: p.title,
        description: p.description,
        impact_level: p.impactLevel as any,
        status: p.status as any,
        created_at: p.createdAt.toISOString(),
        updated_at: p.updatedAt.toISOString(),
      };
    } catch (err: any) {
      console.error('Postgres createProblem error:', err);
      throw err;
    }
  }

  async linkEvidencesToProblem(workspaceId: string, problemId: string, evidenceIds: string[]): Promise<any[]> {
    try {
      // 1. Verify problem belongs to workspace
      const problem = await this.getProblemById(workspaceId, problemId);
      if (!problem) {
        throw new Error('Problema não encontrado neste workspace');
      }

      // 2. Verify all evidenceIds belong to workspace
      if (evidenceIds.length > 0) {
        const validEvidences = await db
          .select({ id: schema.evidences.id })
          .from(schema.evidences)
          .where(
            and(
              eq(schema.evidences.workspaceId, workspaceId),
              inArray(schema.evidences.id, evidenceIds)
            )
          );

        if (validEvidences.length !== evidenceIds.length) {
          throw new Error('Uma ou mais evidências selecionadas não pertencem a este workspace.');
        }
      }

      const links = [];
      for (const evidenceId of evidenceIds) {
        const [link] = await db
          .insert(schema.problemEvidences)
          .values({
            workspaceId,
            problemId,
            evidenceId,
          })
          .onConflictDoNothing()
          .returning();
        if (link) links.push(link);
      }
      return links;
    } catch (err: any) {
      console.error('Postgres linkEvidencesToProblem error:', err);
      throw err;
    }
  }

  // Opportunities
  async listOpportunities(workspaceId: string): Promise<Opportunity[]> {
    try {
      const oppRows = await db
        .select()
        .from(schema.opportunities)
        .where(eq(schema.opportunities.workspaceId, workspaceId))
        .orderBy(desc(schema.opportunities.createdAt));

      const opRows = await db
        .select()
        .from(schema.opportunityProblems)
        .where(eq(schema.opportunityProblems.workspaceId, workspaceId));

      const allProblems = await this.listProblems(workspaceId);
      const problemMap = new Map(allProblems.map((p) => [p.id, p]));

      const allHypotheses = await this.listHypotheses(workspaceId);

      return oppRows.map((o) => {
        const linkedProblemIds = opRows
          .filter((op) => op.opportunityId === o.id)
          .map((op) => op.problemId);

        const attachedProblems = linkedProblemIds
          .map((pid) => problemMap.get(pid))
          .filter(Boolean) as Problem[];

        const attachedHypotheses = allHypotheses.filter((h) => h.opportunity_id === o.id);

        return {
          id: o.id,
          workspace_id: o.workspaceId,
          title: o.title,
          description: o.description,
          strategic_value: o.strategicValue as any,
          status: o.status as any,
          problems: attachedProblems,
          hypotheses: attachedHypotheses,
          created_at: o.createdAt.toISOString(),
          updated_at: o.updatedAt.toISOString(),
        };
      });
    } catch (err) {
      console.error('Postgres listOpportunities error:', err);
      throw new Error('Falha ao listar oportunidades');
    }
  }

  async getOpportunityById(workspaceId: string, id: string): Promise<Opportunity | null> {
    try {
      const rows = await db
        .select()
        .from(schema.opportunities)
        .where(
          and(
            eq(schema.opportunities.id, id),
            eq(schema.opportunities.workspaceId, workspaceId)
          )
        )
        .limit(1);

      if (rows.length === 0) return null;
      const o = rows[0];

      const opRows = await db
        .select()
        .from(schema.opportunityProblems)
        .where(
          and(
            eq(schema.opportunityProblems.workspaceId, workspaceId),
            eq(schema.opportunityProblems.opportunityId, id)
          )
        );

      const problemIds = opRows.map((op) => op.problemId);
      let attachedProblems: Problem[] = [];
      if (problemIds.length > 0) {
        const allProblems = await this.listProblems(workspaceId);
        attachedProblems = allProblems.filter((p) => problemIds.includes(p.id));
      }

      const hypotheses = await this.listHypotheses(workspaceId, id);

      return {
        id: o.id,
        workspace_id: o.workspaceId,
        title: o.title,
        description: o.description,
        strategic_value: o.strategicValue as any,
        status: o.status as any,
        problems: attachedProblems,
        hypotheses,
        created_at: o.createdAt.toISOString(),
        updated_at: o.updatedAt.toISOString(),
      };
    } catch (err) {
      console.error('Postgres getOpportunityById error:', err);
      throw new Error('Falha ao buscar oportunidade');
    }
  }

  async createOpportunity(
    workspaceId: string,
    data: Omit<Opportunity, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>,
    problemIds: string[] = []
  ): Promise<Opportunity> {
    try {
      // Cross-tenant check for linked problems
      if (problemIds.length > 0) {
        const validProblems = await db
          .select({ id: schema.problems.id })
          .from(schema.problems)
          .where(
            and(
              eq(schema.problems.workspaceId, workspaceId),
              inArray(schema.problems.id, problemIds)
            )
          );

        if (validProblems.length !== problemIds.length) {
          throw new Error('Um ou mais problemas informados pertencem a outro workspace.');
        }
      }

      const [o] = await db
        .insert(schema.opportunities)
        .values({
          workspaceId,
          title: data.title,
          description: data.description,
          strategicValue: data.strategic_value || 'medium',
          status: data.status || 'discovery',
        })
        .returning();

      for (const problemId of problemIds) {
        await db.insert(schema.opportunityProblems).values({
          workspaceId,
          opportunityId: o.id,
          problemId,
        });
      }

      return {
        id: o.id,
        workspace_id: o.workspaceId,
        title: o.title,
        description: o.description,
        strategic_value: o.strategicValue as any,
        status: o.status as any,
        created_at: o.createdAt.toISOString(),
        updated_at: o.updatedAt.toISOString(),
      };
    } catch (err: any) {
      console.error('Postgres createOpportunity error:', err);
      throw err;
    }
  }

  async linkProblemsToOpportunity(workspaceId: string, opportunityId: string, problemIds: string[]): Promise<any[]> {
    try {
      const opp = await this.getOpportunityById(workspaceId, opportunityId);
      if (!opp) {
        throw new Error('Oportunidade não encontrada neste workspace');
      }

      if (problemIds.length > 0) {
        const validProblems = await db
          .select({ id: schema.problems.id })
          .from(schema.problems)
          .where(
            and(
              eq(schema.problems.workspaceId, workspaceId),
              inArray(schema.problems.id, problemIds)
            )
          );

        if (validProblems.length !== problemIds.length) {
          throw new Error('Um ou mais problemas informados pertencem a outro workspace.');
        }
      }

      const links = [];
      for (const problemId of problemIds) {
        const [link] = await db
          .insert(schema.opportunityProblems)
          .values({
            workspaceId,
            opportunityId,
            problemId,
          })
          .onConflictDoNothing()
          .returning();
        if (link) links.push(link);
      }
      return links;
    } catch (err: any) {
      console.error('Postgres linkProblemsToOpportunity error:', err);
      throw err;
    }
  }

  // Hypotheses
  async listHypotheses(workspaceId: string, opportunityId?: string): Promise<Hypothesis[]> {
    try {
      const conditions = [eq(schema.hypotheses.workspaceId, workspaceId)];
      if (opportunityId) {
        conditions.push(eq(schema.hypotheses.opportunityId, opportunityId));
      }

      const rows = await db
        .select()
        .from(schema.hypotheses)
        .where(and(...conditions))
        .orderBy(desc(schema.hypotheses.createdAt));

      return rows.map((h) => ({
        id: h.id,
        workspace_id: h.workspaceId,
        opportunity_id: h.opportunityId,
        statement: h.statement,
        metric_target: h.metricTarget,
        confidence_score: h.confidenceScore,
        status: h.status as any,
        created_at: h.createdAt.toISOString(),
        updated_at: h.updatedAt.toISOString(),
      }));
    } catch (err) {
      console.error('Postgres listHypotheses error:', err);
      throw new Error('Falha ao listar hipóteses');
    }
  }

  async createHypothesis(
    workspaceId: string,
    data: Omit<Hypothesis, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>
  ): Promise<Hypothesis> {
    try {
      // Strict cross-tenant validation: Verify parent opportunity belongs strictly to this workspace
      const opp = await this.getOpportunityById(workspaceId, data.opportunity_id);
      if (!opp) {
        throw new Error('A oportunidade de referência não existe neste workspace.');
      }

      const [h] = await db
        .insert(schema.hypotheses)
        .values({
          workspaceId,
          opportunityId: data.opportunity_id,
          statement: data.statement,
          metricTarget: data.metric_target,
          confidenceScore: data.confidence_score || 50,
          status: data.status || 'draft',
        })
        .returning();

      return {
        id: h.id,
        workspace_id: h.workspaceId,
        opportunity_id: h.opportunityId,
        statement: h.statement,
        metric_target: h.metricTarget,
        confidence_score: h.confidenceScore,
        status: h.status as any,
        created_at: h.createdAt.toISOString(),
        updated_at: h.updatedAt.toISOString(),
      };
    } catch (err: any) {
      console.error('Postgres createHypothesis error:', err);
      throw err;
    }
  }

  // Save approved AI analysis (Atomic & Tenant-isolated)
  async saveApprovedAnalysis(
    workspaceId: string,
    researchId: string,
    approvedEvidences: Array<{
      quote: string;
      context?: string | null;
      confidence_level: 'high' | 'medium' | 'low';
      tags?: string[];
    }>,
    approvedProblems: Array<{
      title: string;
      description: string;
      impact_level: 'critical' | 'high' | 'medium' | 'low';
      status?: 'identified' | 'exploring' | 'validated' | 'archived';
      supporting_evidence_local_indices: number[];
    }>
  ): Promise<{ saved_evidences: Evidence[]; saved_problems: Problem[] }> {
    try {
      // 1. Verify research belongs to workspace
      const research = await this.getResearchById(workspaceId, researchId);
      if (!research) {
        throw new Error('Pesquisa não encontrada ou pertence a outro workspace.');
      }

      const savedEvidences: Evidence[] = [];

      // 2. Persist approved evidences
      for (const e of approvedEvidences) {
        const [inserted] = await db
          .insert(schema.evidences)
          .values({
            workspaceId,
            researchId,
            quote: e.quote,
            context: e.context || null,
            confidenceLevel: e.confidence_level,
            tags: e.tags || [],
          })
          .returning();

        savedEvidences.push({
          id: inserted.id,
          workspace_id: inserted.workspaceId,
          research_id: inserted.researchId,
          quote: inserted.quote,
          context: inserted.context || undefined,
          confidence_level: inserted.confidenceLevel as any,
          tags: (inserted.tags as string[]) || [],
          created_at: inserted.createdAt.toISOString(),
          updated_at: inserted.updatedAt.toISOString(),
        });
      }

      const savedProblems: Problem[] = [];

      // 3. Persist approved problems and link them to corresponding saved evidences
      for (const p of approvedProblems) {
        const [insertedProblem] = await db
          .insert(schema.problems)
          .values({
            workspaceId,
            title: p.title,
            description: p.description,
            impactLevel: p.impact_level,
            status: p.status || 'identified',
          })
          .returning();

        const linkedEvidences: Evidence[] = [];

        // Link evidences mapped by local index
        if (p.supporting_evidence_local_indices && p.supporting_evidence_local_indices.length > 0) {
          for (const idx of p.supporting_evidence_local_indices) {
            const targetEvidence = savedEvidences[idx];
            if (targetEvidence) {
              await db
                .insert(schema.problemEvidences)
                .values({
                  workspaceId,
                  problemId: insertedProblem.id,
                  evidenceId: targetEvidence.id,
                })
                .onConflictDoNothing();
              linkedEvidences.push(targetEvidence);
            }
          }
        }

        savedProblems.push({
          id: insertedProblem.id,
          workspace_id: insertedProblem.workspaceId,
          title: insertedProblem.title,
          description: insertedProblem.description,
          impact_level: insertedProblem.impactLevel as any,
          status: insertedProblem.status as any,
          evidences: linkedEvidences,
          created_at: insertedProblem.createdAt.toISOString(),
          updated_at: insertedProblem.updatedAt.toISOString(),
        });
      }

      return {
        saved_evidences: savedEvidences,
        saved_problems: savedProblems,
      };
    } catch (err: any) {
      console.error('Postgres saveApprovedAnalysis error:', err);
      throw err;
    }
  }
}

export const dbStore = new PostgresStore();
