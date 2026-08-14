import { Router, Request, Response } from 'express';
import { authenticate, requireWorkspace } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createHypothesisSchema } from '../schemas/index.js';
import { dbStore } from '../db/store.js';

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
      const hypotheses = await dbStore.listHypotheses(workspaceId, opportunityId);
      res.json({ hypotheses });
    } catch (error: any) {
      console.error('Error listing hypotheses:', error);
      res.status(500).json({ error: 'Erro ao listar hipóteses' });
    }
  }
);

// Create hypothesis (Strict cross-tenant validation)
hypothesisRouter.post(
  '/hypotheses',
  authenticate,
  requireWorkspace,
  validate({ body: createHypothesisSchema }),
  async (req: Request, res: Response) => {
    const workspaceId = req.workspaceId!;
    const { opportunity_id, statement, metric_target, confidence_score, status } = req.body;

    try {
      const hypothesis = await dbStore.createHypothesis(workspaceId, {
        opportunity_id,
        statement,
        metric_target,
        confidence_score,
        status,
      });
      res.status(201).json({ hypothesis });
    } catch (error: any) {
      console.error('Error creating hypothesis:', error.message);
      res.status(400).json({ error: error.message || 'Erro ao criar hipótese' });
    }
  }
);
