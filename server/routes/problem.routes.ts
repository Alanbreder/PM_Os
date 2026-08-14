import { Router, Request, Response } from 'express';
import { authenticate, requireWorkspace } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createProblemSchema, linkProblemEvidencesSchema, uuidParamSchema } from '../schemas/index.js';
import { dbStore } from '../db/store.js';
import { isSupabaseConfigured } from '../config/env.js';
import { getScopedSupabaseClient } from '../db/supabase.js';

export const problemRouter = Router();

// List problems with attached evidences
problemRouter.get(
  '/problems',
  authenticate,
  requireWorkspace,
  async (req: Request, res: Response) => {
    const workspaceId = req.workspaceId!;

    try {
      if (isSupabaseConfigured() && req.userToken) {
        const client = getScopedSupabaseClient(req.userToken);
        const { data: problems, error } = await client
          .from('problems')
          .select(`
            *,
            problem_evidences (
              evidence_id,
              evidences (*)
            )
          `)
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false });

        if (error) {
          res.status(500).json({ error: 'Erro ao listar problemas', details: error.message });
          return;
        }

        const formatted = (problems || []).map((p: any) => ({
          ...p,
          evidences: p.problem_evidences?.map((pe: any) => pe.evidences).filter(Boolean) || [],
          problem_evidences: undefined,
        }));

        res.json({ problems: formatted });
      } else {
        const problems = await dbStore.listProblems(workspaceId);
        res.json({ problems });
      }
    } catch (error: any) {
      res.status(500).json({ error: 'Erro interno ao listar problemas', details: error.message });
    }
  }
);

// Create problem with optional evidence links
problemRouter.post(
  '/problems',
  authenticate,
  requireWorkspace,
  validate({ body: createProblemSchema }),
  async (req: Request, res: Response) => {
    const workspaceId = req.workspaceId!;
    const { title, description, impact_level, status, evidence_ids } = req.body;

    try {
      if (isSupabaseConfigured() && req.userToken) {
        const client = getScopedSupabaseClient(req.userToken);

        // 1. Create Problem
        const { data: problem, error: pError } = await client
          .from('problems')
          .insert({
            workspace_id: workspaceId,
            title,
            description,
            impact_level,
            status,
          })
          .select()
          .single();

        if (pError) {
          res.status(400).json({ error: 'Falha ao criar problema', details: pError.message });
          return;
        }

        // 2. Link Evidences (only if evidence_ids exist in this workspace)
        if (evidence_ids && evidence_ids.length > 0) {
          const links = evidence_ids.map((eid: string) => ({
            workspace_id: workspaceId,
            problem_id: problem.id,
            evidence_id: eid,
          }));

          const { error: lError } = await client.from('problem_evidences').insert(links);
          if (lError) {
            console.warn('Falha ao vincular evidências ao problema:', lError.message);
          }
        }

        res.status(201).json({ problem });
      } else {
        const problem = await dbStore.createProblem(
          workspaceId,
          { title, description, impact_level, status },
          evidence_ids
        );
        res.status(201).json({ problem });
      }
    } catch (error: any) {
      res.status(500).json({ error: 'Erro ao criar problema', details: error.message });
    }
  }
);

// Link additional evidences to existing problem
problemRouter.post(
  '/problems/:id/link-evidences',
  authenticate,
  validate({ params: uuidParamSchema, body: linkProblemEvidencesSchema }),
  requireWorkspace,
  async (req: Request, res: Response) => {
    const workspaceId = req.workspaceId!;
    const problemId = req.params.id;
    const { evidence_ids } = req.body;

    try {
      if (isSupabaseConfigured() && req.userToken) {
        const client = getScopedSupabaseClient(req.userToken);

        // Verify problem belongs to workspace
        const { data: problem } = await client
          .from('problems')
          .select('id')
          .eq('id', problemId)
          .eq('workspace_id', workspaceId)
          .single();

        if (!problem) {
          res.status(404).json({ error: 'Problema não encontrado neste workspace' });
          return;
        }

        const links = evidence_ids.map((eid: string) => ({
          workspace_id: workspaceId,
          problem_id: problemId,
          evidence_id: eid,
        }));

        const { data, error } = await client
          .from('problem_evidences')
          .upsert(links, { onConflict: 'problem_id,evidence_id' })
          .select();

        if (error) {
          res.status(400).json({ error: 'Falha ao vincular evidências', details: error.message });
          return;
        }

        res.json({ success: true, links: data });
      } else {
        const links = await dbStore.linkEvidencesToProblem(workspaceId, problemId, evidence_ids);
        res.json({ success: true, links });
      }
    } catch (error: any) {
      res.status(500).json({ error: 'Erro ao vincular evidências', details: error.message });
    }
  }
);
