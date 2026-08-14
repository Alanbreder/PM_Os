import { Router, Request, Response } from 'express';
import { authenticate, requireWorkspace } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createEvidenceSchema, batchCreateEvidenceSchema } from '../schemas/index.js';
import { dbStore } from '../db/store.js';
import { applyPagination } from '../utils/pagination.js';

export const evidenceRouter = Router();

// List evidences in workspace with pagination
evidenceRouter.get(
  '/evidences',
  authenticate,
  requireWorkspace,
  async (req: Request, res: Response) => {
    const workspaceId = req.workspaceId!;
    const researchId = req.query.research_id as string | undefined;

    try {
      const allEvidences = await dbStore.listEvidences(workspaceId, researchId);
      const { data, pagination } = applyPagination(allEvidences, req.query.page, req.query.limit);

      res.json({
        evidences: data,
        pagination,
      });
    } catch (error: any) {
      console.error('Error listing evidences:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao listar evidências.',
      });
    }
  }
);

// Create single evidence
evidenceRouter.post(
  '/evidences',
  authenticate,
  requireWorkspace,
  validate({ body: createEvidenceSchema }),
  async (req: Request, res: Response) => {
    const workspaceId = req.workspaceId!;
    const { research_id, quote, context, confidence_level, tags } = req.body;

    try {
      const evidence = await dbStore.createEvidence(workspaceId, {
        research_id,
        quote,
        context,
        confidence_level,
        tags,
      });
      res.status(201).json({ evidence });
    } catch (error: any) {
      console.error('Error creating evidence:', error.message);
      res.status(400).json({
        success: false,
        error: 'BAD_REQUEST',
        message: error.message || 'Erro ao salvar evidência.',
      });
    }
  }
);

// Batch create evidences
evidenceRouter.post(
  '/evidences/batch',
  authenticate,
  requireWorkspace,
  validate({ body: batchCreateEvidenceSchema }),
  async (req: Request, res: Response) => {
    const workspaceId = req.workspaceId!;
    const { research_id, evidences } = req.body;

    try {
      const created = [];
      for (const e of evidences) {
        const resEvidence = await dbStore.createEvidence(workspaceId, {
          research_id,
          quote: e.quote,
          context: e.context || null,
          confidence_level: e.confidence_level || 'medium',
          tags: e.tags || [],
        });
        created.push(resEvidence);
      }
      res.status(201).json({ evidences: created });
    } catch (error: any) {
      console.error('Error in batch create evidences:', error.message);
      res.status(400).json({
        success: false,
        error: 'BAD_REQUEST',
        message: error.message || 'Erro ao criar lote de evidências.',
      });
    }
  }
);
