import { Router, Request, Response } from 'express';
import { authenticate, requireWorkspace } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createResearchSchema, uuidParamSchema } from '../schemas/index.js';
import { dbStore } from '../db/store.js';
import { isSupabaseConfigured } from '../config/env.js';
import { getScopedSupabaseClient } from '../db/supabase.js';

export const researchRouter = Router();

// List researches for verified workspace
researchRouter.get(
  '/researches',
  authenticate,
  requireWorkspace,
  async (req: Request, res: Response) => {
    const workspaceId = req.workspaceId!;

    try {
      if (isSupabaseConfigured() && req.userToken) {
        const client = getScopedSupabaseClient(req.userToken);
        const { data, error } = await client
          .from('researches')
          .select('*, evidences(count)')
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false });

        if (error) {
          res.status(500).json({ error: 'Erro ao listar pesquisas', details: error.message });
          return;
        }

        res.json({ researches: data || [] });
      } else {
        const researches = await dbStore.listResearches(workspaceId);
        res.json({ researches });
      }
    } catch (error: any) {
      res.status(500).json({ error: 'Erro interno ao listar pesquisas', details: error.message });
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
      if (isSupabaseConfigured() && req.userToken) {
        const client = getScopedSupabaseClient(req.userToken);
        const { data: research, error } = await client
          .from('researches')
          .select('*, evidences(*)')
          .eq('id', researchId)
          .eq('workspace_id', workspaceId)
          .single();

        if (error || !research) {
          res.status(404).json({ error: 'Pesquisa não encontrada neste workspace' });
          return;
        }

        res.json({ research });
      } else {
        const research = await dbStore.getResearchById(workspaceId, researchId);
        if (!research) {
          res.status(404).json({ error: 'Pesquisa não encontrada neste workspace' });
          return;
        }
        const evidences = await dbStore.listEvidences(workspaceId, researchId);
        res.json({ research: { ...research, evidences } });
      }
    } catch (error: any) {
      res.status(500).json({ error: 'Erro ao buscar pesquisa', details: error.message });
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
      if (isSupabaseConfigured() && req.userToken) {
        const client = getScopedSupabaseClient(req.userToken);
        const { data, error } = await client
          .from('researches')
          .insert({
            workspace_id: workspaceId,
            title,
            source_type,
            source_url,
            participant_info,
            raw_content,
            created_by: user.id,
          })
          .select()
          .single();

        if (error) {
          res.status(400).json({ error: 'Falha ao salvar pesquisa', details: error.message });
          return;
        }

        res.status(201).json({ research: data });
      } else {
        const research = await dbStore.createResearch(workspaceId, {
          title,
          source_type,
          source_url,
          participant_info,
          raw_content,
          created_by: user.id,
        });
        res.status(201).json({ research });
      }
    } catch (error: any) {
      res.status(500).json({ error: 'Erro ao criar pesquisa', details: error.message });
    }
  }
);
