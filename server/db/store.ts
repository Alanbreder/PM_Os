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
  private isSqlAvailable(): boolean {
    return Boolean(process.env.SQL_HOST && process.env.SQL_USER);
  }

  // Workspaces
  async listWorkspacesForUser(userId: string): Promise<Workspace[]> {
    if (this.isSqlAvailable()) {
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
      }
    }
    return [];
  }

  async getWorkspaceById(workspaceId: string): Promise<Workspace | null> {
    if (this.isSqlAvailable()) {
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
      }
    }
    return null;
  }

  async createWorkspace(name: string, slug: string, ownerUserId: string): Promise<Workspace> {
    if (this.isSqlAvailable()) {
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
        throw new Error('Falha ao criar workspace no banco de dados relacional');
      }
    }
    throw new Error('Banco de dados relacional não disponível');
  }

  // Memberships
  async getMembership(workspaceId: string, userId: string): Promise<{ role: WorkspaceRole; workspace_id: string } | null> {
    if (this.isSqlAvailable()) {
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
      }
    }
    return null;
  }

  async addMember(workspaceId: string, userId: string, role: WorkspaceRole): Promise<WorkspaceMember> {
    if (this.isSqlAvailable()) {
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
    throw new Error('Banco de dados relacional não disponível');
  }

  // Researches
  async listResearches(workspaceId: string): Promise<Research[]> {
    if (this.isSqlAvailable()) {
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
      }
    }
    return [];
  }

  async getResearchById(workspaceId: string, id: string): Promise<Research | null> {
    if (this.isSqlAvailable()) {
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
      }
    }
    return null;
  }

  async createResearch(
    workspaceId: string,
    data: Omit<Research, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>
  ): Promise<Research> {
    if (this.isSqlAvailable()) {
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
        throw new Error('Falha ao registrar pesquisa no banco relacional');
      }
    }
    throw new Error('Banco de dados relacional não disponível');
  }

  // Evidences
  async listEvidences(workspaceId: string, researchId?: string): Promise<Evidence[]> {
    if (this.isSqlAvailable()) {
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
      }
    }
    return [];
  }

  async createEvidence(
    workspaceId: string,
    data: Omit<Evidence, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>
  ): Promise<Evidence> {
    if (this.isSqlAvailable()) {
      try {
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
      } catch (err) {
        console.error('Postgres createEvidence error:', err);
        throw new Error('Falha ao salvar evidência');
      }
    }
    throw new Error('Banco de dados relacional não disponível');
  }

  // Problems
  async listProblems(workspaceId: string): Promise<Problem[]> {
    if (this.isSqlAvailable()) {
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
      }
    }
    return [];
  }

  async createProblem(
    workspaceId: string,
    data: Omit<Problem, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>,
    evidenceIds: string[] = []
  ): Promise<Problem> {
    if (this.isSqlAvailable()) {
      try {
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
      } catch (err) {
        console.error('Postgres createProblem error:', err);
        throw new Error('Falha ao registrar problema');
      }
    }
    throw new Error('Banco de dados relacional não disponível');
  }

  // Opportunities
  async listOpportunities(workspaceId: string): Promise<Opportunity[]> {
    if (this.isSqlAvailable()) {
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
      }
    }
    return [];
  }

  async createOpportunity(
    workspaceId: string,
    data: Omit<Opportunity, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>,
    problemIds: string[] = []
  ): Promise<Opportunity> {
    if (this.isSqlAvailable()) {
      try {
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
      } catch (err) {
        console.error('Postgres createOpportunity error:', err);
        throw new Error('Falha ao registrar oportunidade');
      }
    }
    throw new Error('Banco de dados relacional não disponível');
  }

  // Hypotheses
  async listHypotheses(workspaceId: string, opportunityId?: string): Promise<Hypothesis[]> {
    if (this.isSqlAvailable()) {
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
      }
    }
    return [];
  }

  async createHypothesis(
    workspaceId: string,
    data: Omit<Hypothesis, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>
  ): Promise<Hypothesis> {
    if (this.isSqlAvailable()) {
      try {
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
      } catch (err) {
        console.error('Postgres createHypothesis error:', err);
        throw new Error('Falha ao registrar hipótese');
      }
    }
    throw new Error('Banco de dados relacional não disponível');
  }
  async linkEvidencesToProblem(workspaceId: string, problemId: string, evidenceIds: string[]): Promise<any[]> {
    if (this.isSqlAvailable()) {
      try {
        const links = [];
        for (const evidenceId of evidenceIds) {
          const [link] = await db
            .insert(schema.problemEvidences)
            .values({
              workspaceId,
              problemId,
              evidenceId,
            })
            .returning();
          links.push(link);
        }
        return links;
      } catch (err) {
        console.error('Postgres linkEvidencesToProblem error:', err);
        throw new Error('Falha ao vincular evidências ao problema');
      }
    }
    return [];
  }

  async linkProblemsToOpportunity(workspaceId: string, opportunityId: string, problemIds: string[]): Promise<any[]> {
    if (this.isSqlAvailable()) {
      try {
        const links = [];
        for (const problemId of problemIds) {
          const [link] = await db
            .insert(schema.opportunityProblems)
            .values({
              workspaceId,
              opportunityId,
              problemId,
            })
            .returning();
          links.push(link);
        }
        return links;
      } catch (err) {
        console.error('Postgres linkProblemsToOpportunity error:', err);
        throw new Error('Falha ao vincular problemas à oportunidade');
      }
    }
    return [];
  }
}

export const dbStore = new PostgresStore();
