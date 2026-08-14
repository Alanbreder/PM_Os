import { Router, Request, Response } from 'express';
import { authenticate, requireWorkspace } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createOpportunitySchema, linkOpportunityProblemsSchema, uuidParamSchema } from '../schemas/index.js';
import { dbStore } from '../db/store.js';
import { isSupabaseConfigured } from '../config/env.js';
import { getScopedSupabaseClient } from '../db/supabase.js';

export const opportunityRouter = Router();

// List opportunities with connected problems and hypotheses
opportunityRouter.get(
  '/opportunities',
  authenticate,
  requireWorkspace,
  async (req: Request, res: Response) => {
    const workspaceId = req.workspaceId!;

    try {
      if (isSupabaseConfigured() && req.userToken) {
        const client = getScopedSupabaseClient(req.userToken);
        const { data: opps, error } = await client
          .from('opportunities')
          .select(`
            *,
            opportunity_problems (
              problem_id,
              problems (*)
            ),
            hypotheses (*)
          `)
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false });

        if (error) {
          res.status(500).json({ error: 'Erro ao listar oportunidades', details: error.message });
          return;
        }

        const formatted = (opps || []).map((o: any) => ({
          ...o,
          problems: o.opportunity_problems?.map((op: any) => op.problems).filter(Boolean) || [],
          hypotheses: o.hypotheses || [],
          opportunity_problems: undefined,
        }));

        res.json({ opportunities: formatted });
      } else {
        const opportunities = await dbStore.listOpportunities(workspaceId);
        res.json({ opportunities });
      }
    } catch (error: any) {
      res.status(500).json({ error: 'Erro ao listar oportunidades', details: error.message });
    }
  }
);

// Create opportunity
opportunityRouter.post(
  '/opportunities',
  authenticate,
  requireWorkspace,
  validate({ body: createOpportunitySchema }),
  async (req: Request, res: Response) => {
    const workspaceId = req.workspaceId!;
    const { title, description, strategic_value, status, problem_ids } = req.body;

    try {
      if (isSupabaseConfigured() && req.userToken) {
        const client = getScopedSupabaseClient(req.userToken);

        const { data: opp, error: oError } = await client
          .from('opportunities')
          .insert({
            workspace_id: workspaceId,
            title,
            description,
            strategic_value,
            status,
          })
          .select()
          .single();

        if (oError) {
          res.status(400).json({ error: 'Falha ao criar oportunidade', details: oError.message });
          return;
        }

        if (problem_ids && problem_ids.length > 0) {
          const links = problem_ids.map((pid: string) => ({
            workspace_id: workspaceId,
            opportunity_id: opp.id,
            problem_id: pid,
          }));

          await client.from('opportunity_problems').insert(links);
        }

        res.status(201).json({ opportunity: opp });
      } else {
        const opportunity = await dbStore.createOpportunity(
          workspaceId,
          { title, description, strategic_value, status },
          problem_ids
        );
        res.status(201).json({ opportunity });
      }
    } catch (error: any) {
      res.status(500).json({ error: 'Erro ao criar oportunidade', details: error.message });
    }
  }
);

// Link problems to opportunity
opportunityRouter.post(
  '/opportunities/:id/link-problems',
  authenticate,
  validate({ params: uuidParamSchema, body: linkOpportunityProblemsSchema }),
  requireWorkspace,
  async (req: Request, res: Response) => {
    const workspaceId = req.workspaceId!;
    const opportunityId = req.params.id;
    const { problem_ids } = req.body;

    try {
      if (isSupabaseConfigured() && req.userToken) {
        const client = getScopedSupabaseClient(req.userToken);

        const { data: opp } = await client
          .from('opportunities')
          .select('id')
          .eq('id', opportunityId)
          .eq('workspace_id', workspaceId)
          .single();

        if (!opp) {
          res.status(404).json({ error: 'Oportunidade não encontrada neste workspace' });
          return;
        }

        const links = problem_ids.map((pid: string) => ({
          workspace_id: workspaceId,
          opportunity_id: opportunityId,
          problem_id: pid,
        }));

        const { data, error } = await client
          .from('opportunity_problems')
          .upsert(links, { onConflict: 'opportunity_id,problem_id' })
          .select();

        if (error) {
          res.status(400).json({ error: 'Falha ao vincular problemas', details: error.message });
          return;
        }

        res.json({ success: true, links: data });
      } else {
        const links = await dbStore.linkProblemsToOpportunity(workspaceId, opportunityId, problem_ids);
        res.json({ success: true, links });
      }
    } catch (error: any) {
      res.status(500).json({ error: 'Erro ao vincular problemas', details: error.message });
    }
  }
);
