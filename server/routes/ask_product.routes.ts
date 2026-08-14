import { Router, Request, Response } from 'express';
import { authenticate, requireWorkspace } from '../middleware/auth.js';
import { aiRateLimiter } from '../middleware/rate_limit.js';
import { dbStore } from '../db/store.js';
import { askProductAssistant } from '../services/gemini.service.js';

export const askProductRouter = Router();

askProductRouter.post(
  '/ask-product',
  authenticate,
  requireWorkspace,
  aiRateLimiter,
  async (req: Request, res: Response) => {
    const workspaceId = req.workspaceId!;
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
      res.status(400).json({
        success: false,
        error: 'INVALID_INPUT',
        message: 'A pergunta deve ser um texto válido com no mínimo 3 caracteres.',
      });
      return;
    }

    try {
      const ws = await dbStore.getWorkspaceById(workspaceId);
      const problems = await dbStore.listProblems(workspaceId);
      const opportunities = await dbStore.listOpportunities(workspaceId);
      const evidences = await dbStore.listEvidences(workspaceId);

      const topProblems = problems.slice(0, 5).map((p) => p.title);

      const answer = await askProductAssistant(prompt, ws?.name || 'SIP Workspace', {
        problemsCount: problems.length,
        opportunitiesCount: opportunities.length,
        evidencesCount: evidences.length,
        topProblems,
      });

      res.json({
        success: true,
        answer,
      });
    } catch (error: any) {
      console.error('Ask Product error:', error);
      res.status(500).json({
        success: false,
        error: 'AI_SERVICE_ERROR',
        message: error.message || 'Erro ao processar consulta no assistente de produto.',
      });
    }
  }
);
