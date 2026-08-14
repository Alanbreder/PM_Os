import { Router, Request, Response } from 'express';
import { authenticate, requireWorkspace } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createProblemSchema, linkProblemEvidencesSchema, uuidParamSchema } from '../schemas/index.js';
import { dbStore } from '../db/store.js';

export const problemRouter = Router();

// List problems with attached evidences
problemRouter.get(
  '/problems',
  authenticate,
  requireWorkspace,
  async (req: Request, res: Response) => {
    const workspaceId = req.workspaceId!;

    try {
      const problems = await dbStore.listProblems(workspaceId);
      res.json({ problems });
    } catch (error: any) {
      console.error('Error listing problems:', error);
      res.status(500).json({ error: 'Erro interno ao listar problemas' });
    }
  }
);

// Get single problem by ID (Strict IDOR guard: validated workspace and problem ID)
problemRouter.get(
  '/problems/:id',
  authenticate,
  validate({ params: uuidParamSchema }),
  requireWorkspace,
  async (req: Request, res: Response) => {
    const workspaceId = req.workspaceId!;
    const problemId = req.params.id;

    try {
      const problem = await dbStore.getProblemById(workspaceId, problemId);
      if (!problem) {
        res.status(404).json({ error: 'Problema não encontrado neste workspace' });
        return;
      }
      res.json({ problem });
    } catch (error: any) {
      console.error('Error fetching problem:', error);
      res.status(500).json({ error: 'Erro ao buscar problema' });
    }
  }
);

// Create problem with optional evidence links (Strict cross-tenant validation)
problemRouter.post(
  '/problems',
  authenticate,
  requireWorkspace,
  validate({ body: createProblemSchema }),
  async (req: Request, res: Response) => {
    const workspaceId = req.workspaceId!;
    const { title, description, impact_level, status, evidence_ids } = req.body;

    try {
      const problem = await dbStore.createProblem(
        workspaceId,
        { title, description, impact_level, status },
        evidence_ids
      );
      res.status(201).json({ problem });
    } catch (error: any) {
      console.error('Error creating problem:', error.message);
      res.status(400).json({ error: error.message || 'Erro ao criar problema' });
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
      const links = await dbStore.linkEvidencesToProblem(workspaceId, problemId, evidence_ids);
      res.json({ success: true, links });
    } catch (error: any) {
      console.error('Error linking evidences:', error.message);
      res.status(400).json({ error: error.message || 'Erro ao vincular evidências' });
    }
  }
);
