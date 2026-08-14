import { Router, Request, Response } from 'express';
import { authenticate, requireWorkspace } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { aiRateLimiter } from '../middleware/rate_limit.js';
import { createResearchSchema, uuidParamSchema, approveAnalysisSchema } from '../schemas/index.js';
import { dbStore } from '../db/store.js';
import { analyzeResearchContent } from '../services/gemini.service.js';
import { applyPagination } from '../utils/pagination.js';

export const researchRouter = Router();

// List researches for verified workspace with pagination
researchRouter.get(
  '/researches',
  authenticate,
  requireWorkspace,
  async (req: Request, res: Response) => {
    const workspaceId = req.workspaceId!;

    try {
      const allResearches = await dbStore.listResearches(workspaceId);
      const { data, pagination } = applyPagination(allResearches, req.query.page, req.query.limit);

      res.json({
        researches: data,
        pagination,
      });
    } catch (error: any) {
      console.error('Error listing researches:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Erro interno ao listar pesquisas.',
      });
    }
  }
);

// Get research by ID with associated evidences
researchRouter.get(
  '/researches/:id',
  authenticate,
  validate({ params: uuidParamSchema }),
  requireWorkspace,
  async (req: Request, res: Response) => {
    const workspaceId = req.workspaceId!;
    const researchId = req.params.id;

    try {
      const research = await dbStore.getResearchById(workspaceId, researchId);
      if (!research) {
        res.status(404).json({
          success: false,
          error: 'NOT_FOUND',
          message: 'Pesquisa não encontrada neste workspace.',
        });
        return;
      }
      const evidences = await dbStore.listEvidences(workspaceId, researchId);
      res.json({ research: { ...research, evidences } });
    } catch (error: any) {
      console.error('Error fetching research:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao buscar pesquisa.',
      });
    }
  }
);

// Create new research in workspace
researchRouter.post(
  '/researches',
  authenticate,
  requireWorkspace,
  validate({ body: createResearchSchema }),
  async (req: Request, res: Response) => {
    const workspaceId = req.workspaceId!;
    const user = req.user!;
    const { title, source_type, source_url, participant_info, raw_content } = req.body;

    try {
      const research = await dbStore.createResearch(workspaceId, {
        title,
        source_type,
        source_url,
        participant_info,
        raw_content,
        created_by: user.id,
      });
      res.status(201).json({ research });
    } catch (error: any) {
      console.error('Error creating research:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao criar pesquisa.',
      });
    }
  }
);

// Analyze Research with Gemini AI (Human-in-the-loop + Rate limited + Input audited)
researchRouter.post(
  '/researches/:id/analyze',
  authenticate,
  validate({ params: uuidParamSchema }),
  requireWorkspace,
  aiRateLimiter,
  async (req: Request, res: Response) => {
    const workspaceId = req.workspaceId!;
    const researchId = req.params.id;

    try {
      const research = await dbStore.getResearchById(workspaceId, researchId);
      if (!research) {
        res.status(404).json({
          success: false,
          error: 'NOT_FOUND',
          message: 'Pesquisa não encontrada neste workspace.',
        });
        return;
      }

      const analysis = await analyzeResearchContent(research.raw_content, research.title);

      res.json({
        success: true,
        research_id: research.id,
        title: research.title,
        analysis,
      });
    } catch (error: any) {
      console.error('Error analyzing research with AI:', error);
      res.status(500).json({
        success: false,
        error: 'AI_ANALYSIS_ERROR',
        message: error.message || 'Erro ao processar a pesquisa com a IA do Gemini.',
      });
    }
  }
);

// Approve and persist AI suggestions into PostgreSQL Cloud SQL
researchRouter.post(
  '/researches/:id/approve-analysis',
  authenticate,
  validate({ params: uuidParamSchema, body: approveAnalysisSchema }),
  requireWorkspace,
  async (req: Request, res: Response) => {
    const workspaceId = req.workspaceId!;
    const researchId = req.params.id;
    const { approved_evidences, approved_problems } = req.body;

    try {
      const result = await dbStore.saveApprovedAnalysis(
        workspaceId,
        researchId,
        approved_evidences,
        approved_problems
      );

      res.status(201).json({
        success: true,
        saved_evidences_count: result.saved_evidences.length,
        saved_problems_count: result.saved_problems.length,
        saved_evidences: result.saved_evidences,
        saved_problems: result.saved_problems,
      });
    } catch (error: any) {
      console.error('Error approving analysis:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Erro ao salvar os registros aprovados no banco.',
      });
    }
  }
);
