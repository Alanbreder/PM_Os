import { Router, Request, Response } from 'express';
import { authenticate, requireWorkspace } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createHypothesisSchema } from '../schemas/index.js';
import { dbStore } from '../db/store.js';
import { applyPagination } from '../utils/pagination.js';

export const hypothesisRouter = Router();

// List hypotheses in workspace with pagination
hypothesisRouter.get(
  '/hypotheses',
  authenticate,
  requireWorkspace,
  async (req: Request, res: Response) => {
    const workspaceId = req.workspaceId!;
    const opportunityId = req.query.opportunity_id as string | undefined;

    try {
      const allHypotheses = await dbStore.listHypotheses(workspaceId, opportunityId);
      const { data, pagination } = applyPagination(allHypotheses, req.query.page, req.query.limit);

      res.json({
        hypotheses: data,
        pagination,
      });
    } catch (error: any) {
      console.error('Error listing hypotheses:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao listar hipóteses.',
      });
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
      res.status(400).json({
        success: false,
        error: 'BAD_REQUEST',
        message: error.message || 'Erro ao criar hipótese.',
      });
    }
  }
);
