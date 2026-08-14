import { Router, Request, Response } from 'express';
import { authenticate, requireWorkspace } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createResearchSchema, uuidParamSchema, approveAnalysisSchema } from '../schemas/index.js';
import { dbStore } from '../db/store.js';
import { analyzeResearchContent } from '../services/gemini.service.js';

export const researchRouter = Router();

// List researches for verified workspace
researchRouter.get(
  '/researches',
  authenticate,
  requireWorkspace,
  async (req: Request, res: Response) => {
    const workspaceId = req.workspaceId!;

    try {
      const researches = await dbStore.listResearches(workspaceId);
      res.json({ researches });
    } catch (error: any) {
      console.error('Error listing researches:', error);
      res.status(500).json({ error: 'Erro interno ao listar pesquisas' });
    }
  }
);

// Get research by ID with associated evidences (Strict IDOR guard: filters by both research ID and validated workspace ID)
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
        res.status(404).json({ error: 'Pesquisa não encontrada neste workspace' });
        return;
      }
      const evidences = await dbStore.listEvidences(workspaceId, researchId);
      res.json({ research: { ...research, evidences } });
    } catch (error: any) {
      console.error('Error fetching research:', error);
      res.status(500).json({ error: 'Erro ao buscar pesquisa' });
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
      res.status(500).json({ error: 'Erro ao criar pesquisa' });
    }
  }
);

// Analyze Research with Gemini AI (Human-in-the-loop: returns suggestions, does NOT write directly to DB)
researchRouter.post(
  '/researches/:id/analyze',
  authenticate,
  validate({ params: uuidParamSchema }),
  requireWorkspace,
  async (req: Request, res: Response) => {
    const workspaceId = req.workspaceId!;
    const researchId = req.params.id;

    try {
      // 1. Fetch research ensuring strict workspace boundary
      const research = await dbStore.getResearchById(workspaceId, researchId);
      if (!research) {
        res.status(404).json({ error: 'Pesquisa não encontrada neste workspace' });
        return;
      }

      // 2. Call Gemini Flash with structured schema & system instructions
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
        error: error.message || 'Erro ao processar a pesquisa com a IA do Gemini',
      });
    }
  }
);

// Approve and persist AI suggestions into PostgreSQL Cloud SQL (Atomic & strictly validated)
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
        error: error.message || 'Erro ao salvar os registros aprovados no banco',
      });
    }
  }
);
