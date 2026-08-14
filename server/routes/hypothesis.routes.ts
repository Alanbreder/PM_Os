import { Router, Request, Response } from 'express';
import { authenticate, requireWorkspace } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createHypothesisSchema } from '../schemas/index.js';
import { dbStore } from '../db/store.js';
import { isSupabaseConfigured } from '../config/env.js';
import { getScopedSupabaseClient } from '../db/supabase.js';

export const hypothesisRouter = Router();

// List hypotheses in workspace
hypothesisRouter.get(
  '/hypotheses',
  authenticate,
  requireWorkspace,
  async (req: Request, res: Response) => {
    const workspaceId = req.workspaceId!;
    const opportunityId = req.query.opportunity_id as string | undefined;

    try {
      if (isSupabaseConfigured() && req.userToken) {
        const client = getScopedSupabaseClient(req.userToken);
        let query = client.from('hypotheses').select('*').eq('workspace_id', workspaceId);
        if (opportunityId) {
          query = query.eq('opportunity_id', opportunityId);
        }
        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
          res.status(500).json({ error: 'Erro ao listar hipóteses', details: error.message });
          return;
        }

        res.json({ hypotheses: data || [] });
      } else {
        const hypotheses = await dbStore.listHypotheses(workspaceId, opportunityId);
        res.json({ hypotheses });
      }
    } catch (error: any) {
      res.status(500).json({ error: 'Erro ao listar hipóteses', details: error.message });
    }
  }
);

// Create hypothesis
hypothesisRouter.post(
  '/hypotheses',
  authenticate,
  requireWorkspace,
  validate({ body: createHypothesisSchema }),
  async (req: Request, res: Response) => {
    const workspaceId = req.workspaceId!;
    const { opportunity_id, statement, metric_target, confidence_score, status } = req.body;

    try {
      if (isSupabaseConfigured() && req.userToken) {
        const client = getScopedSupabaseClient(req.userToken);

        // Verify parent opportunity belongs to workspace
        const { data: opp } = await client
          .from('opportunities')
          .select('id')
          .eq('id', opportunity_id)
          .eq('workspace_id', workspaceId)
          .single();

        if (!opp) {
          res.status(404).json({ error: 'A oportunidade informada não existe neste workspace' });
          return;
        }

        const { data, error } = await client
          .from('hypotheses')
          .insert({
            workspace_id: workspaceId,
            opportunity_id,
            statement,
            metric_target,
            confidence_score,
            status,
          })
          .select()
          .single();

        if (error) {
          res.status(400).json({ error: 'Falha ao criar hipótese', details: error.message });
          return;
        }

        res.status(201).json({ hypothesis: data });
      } else {
        const opps = await dbStore.listOpportunities(workspaceId);
        const exists = opps.some((o) => o.id === opportunity_id);
        if (!exists) {
          res.status(404).json({ error: 'A oportunidade informada não existe neste workspace' });
          return;
        }

        const hypothesis = await dbStore.createHypothesis(workspaceId, {
          opportunity_id,
          statement,
          metric_target,
          confidence_score,
          status,
        });
        res.status(201).json({ hypothesis });
      }
    } catch (error: any) {
      res.status(500).json({ error: 'Erro ao criar hipótese', details: error.message });
    }
  }
);
