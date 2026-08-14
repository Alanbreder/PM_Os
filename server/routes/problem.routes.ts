import { Router, Request, Response } from 'express';
import { authenticate, requireWorkspace } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createProblemSchema,
  updateProblemSchema,
  linkProblemEvidencesSchema,
  uuidParamSchema,
  uuidSchema,
} from '../schemas/index.js';
import { dbStore } from '../db/store.js';
import { z } from 'zod';
import { applyPagination } from '../utils/pagination.js';

export const problemRouter = Router();

// List problems with attached evidences and pagination
problemRouter.get(
  '/problems',
  authenticate,
  requireWorkspace,
  async (req: Request, res: Response) => {
    const workspaceId = req.workspaceId!;

    try {
      const allProblems = await dbStore.listProblems(workspaceId);
      const { data, pagination } = applyPagination(allProblems, req.query.page, req.query.limit);

      res.json({
        problems: data,
        pagination,
      });
    } catch (error: any) {
      console.error('Error listing problems:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Erro interno ao listar problemas.',
      });
    }
  }
);

// Get single problem by ID
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
        res.status(404).json({
          success: false,
          error: 'NOT_FOUND',
          message: 'Problema não encontrado neste workspace.',
        });
        return;
      }
      res.json({ problem });
    } catch (error: any) {
      console.error('Error fetching problem:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao buscar problema.',
      });
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
      const problem = await dbStore.createProblem(
        workspaceId,
        { title, description, impact_level, status },
        evidence_ids
      );
      res.status(201).json({ problem });
    } catch (error: any) {
      console.error('Error creating problem:', error.message);
      res.status(400).json({
        success: false,
        error: 'BAD_REQUEST',
        message: error.message || 'Erro ao criar problema.',
      });
    }
  }
);

// Update problem details
problemRouter.patch(
  '/problems/:id',
  authenticate,
  validate({ params: uuidParamSchema, body: updateProblemSchema }),
  requireWorkspace,
  async (req: Request, res: Response) => {
    const workspaceId = req.workspaceId!;
    const problemId = req.params.id;
    const { title, description, impact_level, status, evidence_ids } = req.body;

    try {
      const updated = await dbStore.updateProblem(
        workspaceId,
        problemId,
        { title, description, impact_level, status },
        evidence_ids
      );
      res.json({ problem: updated });
    } catch (error: any) {
      console.error('Error updating problem:', error.message);
      res.status(400).json({
        success: false,
        error: 'BAD_REQUEST',
        message: error.message || 'Erro ao atualizar problema.',
      });
    }
  }
);

// Delete problem
problemRouter.delete(
  '/problems/:id',
  authenticate,
  validate({ params: uuidParamSchema }),
  requireWorkspace,
  async (req: Request, res: Response) => {
    const workspaceId = req.workspaceId!;
    const problemId = req.params.id;

    try {
      await dbStore.deleteProblem(workspaceId, problemId);
      res.json({ success: true, message: 'Problema removido com sucesso.' });
    } catch (error: any) {
      console.error('Error deleting problem:', error.message);
      res.status(400).json({
        success: false,
        error: 'BAD_REQUEST',
        message: error.message || 'Erro ao excluir problema.',
      });
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
      res.status(400).json({
        success: false,
        error: 'BAD_REQUEST',
        message: error.message || 'Erro ao vincular evidências.',
      });
    }
  }
);

// Unlink specific evidence from problem
problemRouter.delete(
  '/problems/:id/evidences/:evidenceId',
  authenticate,
  validate({
    params: z.object({
      id: uuidSchema,
      evidenceId: uuidSchema,
    }),
  }),
  requireWorkspace,
  async (req: Request, res: Response) => {
    const workspaceId = req.workspaceId!;
    const { id: problemId, evidenceId } = req.params;

    try {
      await dbStore.unlinkEvidenceFromProblem(workspaceId, problemId, evidenceId);
      res.json({ success: true, message: 'Evidência desvinculada do problema com sucesso.' });
    } catch (error: any) {
      console.error('Error unlinking evidence:', error.message);
      res.status(400).json({
        success: false,
        error: 'BAD_REQUEST',
        message: error.message || 'Erro ao desvincular evidência.',
      });
    }
  }
);
