import { Router, Request, Response } from 'express';
import { authenticate, requireWorkspace } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createOpportunitySchema,
  updateOpportunitySchema,
  linkOpportunityProblemsSchema,
  uuidParamSchema,
  uuidSchema,
} from '../schemas/index.js';
import { dbStore } from '../db/store.js';
import { z } from 'zod';

export const opportunityRouter = Router();

// List opportunities with connected problems
opportunityRouter.get(
  '/opportunities',
  authenticate,
  requireWorkspace,
  async (req: Request, res: Response) => {
    const workspaceId = req.workspaceId!;

    try {
      const opportunities = await dbStore.listOpportunities(workspaceId);
      res.json({ opportunities });
    } catch (error: any) {
      console.error('Error listing opportunities:', error);
      res.status(500).json({ error: 'Erro ao listar oportunidades' });
    }
  }
);

// Get single opportunity by ID (Strict IDOR guard)
opportunityRouter.get(
  '/opportunities/:id',
  authenticate,
  validate({ params: uuidParamSchema }),
  requireWorkspace,
  async (req: Request, res: Response) => {
    const workspaceId = req.workspaceId!;
    const opportunityId = req.params.id;

    try {
      const opportunity = await dbStore.getOpportunityById(workspaceId, opportunityId);
      if (!opportunity) {
        res.status(404).json({ error: 'Oportunidade não encontrada neste workspace' });
        return;
      }
      res.json({ opportunity });
    } catch (error: any) {
      console.error('Error fetching opportunity:', error);
      res.status(500).json({ error: 'Erro ao buscar oportunidade' });
    }
  }
);

// Create opportunity (Strict cross-tenant validation)
opportunityRouter.post(
  '/opportunities',
  authenticate,
  requireWorkspace,
  validate({ body: createOpportunitySchema }),
  async (req: Request, res: Response) => {
    const workspaceId = req.workspaceId!;
    const { title, description, status, problem_ids } = req.body;

    try {
      const opportunity = await dbStore.createOpportunity(
        workspaceId,
        { title, description, status },
        problem_ids
      );
      res.status(201).json({ opportunity });
    } catch (error: any) {
      console.error('Error creating opportunity:', error.message);
      res.status(400).json({ error: error.message || 'Erro ao criar oportunidade' });
    }
  }
);

// Update opportunity
opportunityRouter.patch(
  '/opportunities/:id',
  authenticate,
  validate({ params: uuidParamSchema, body: updateOpportunitySchema }),
  requireWorkspace,
  async (req: Request, res: Response) => {
    const workspaceId = req.workspaceId!;
    const opportunityId = req.params.id;
    const { title, description, status, problem_ids } = req.body;

    try {
      const updated = await dbStore.updateOpportunity(
        workspaceId,
        opportunityId,
        { title, description, status },
        problem_ids
      );
      res.json({ opportunity: updated });
    } catch (error: any) {
      console.error('Error updating opportunity:', error.message);
      res.status(400).json({ error: error.message || 'Erro ao atualizar oportunidade' });
    }
  }
);

// Delete opportunity
opportunityRouter.delete(
  '/opportunities/:id',
  authenticate,
  validate({ params: uuidParamSchema }),
  requireWorkspace,
  async (req: Request, res: Response) => {
    const workspaceId = req.workspaceId!;
    const opportunityId = req.params.id;

    try {
      await dbStore.deleteOpportunity(workspaceId, opportunityId);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting opportunity:', error.message);
      res.status(400).json({ error: error.message || 'Erro ao excluir oportunidade' });
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
      const links = await dbStore.linkProblemsToOpportunity(workspaceId, opportunityId, problem_ids);
      res.json({ success: true, links });
    } catch (error: any) {
      console.error('Error linking problems to opportunity:', error.message);
      res.status(400).json({ error: error.message || 'Erro ao vincular problemas' });
    }
  }
);

// Unlink a problem from an opportunity
const unlinkParamsSchema = z.object({
  id: uuidSchema,
  problemId: uuidSchema,
});

opportunityRouter.delete(
  '/opportunities/:id/problems/:problemId',
  authenticate,
  validate({ params: unlinkParamsSchema }),
  requireWorkspace,
  async (req: Request, res: Response) => {
    const workspaceId = req.workspaceId!;
    const { id: opportunityId, problemId } = req.params;

    try {
      await dbStore.unlinkProblemFromOpportunity(workspaceId, opportunityId, problemId);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error unlinking problem from opportunity:', error.message);
      res.status(400).json({ error: error.message || 'Erro ao desvincular problema' });
    }
  }
);
