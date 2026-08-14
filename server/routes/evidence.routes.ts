import { Router, Request, Response } from 'express';
import { authenticate, requireWorkspace } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createEvidenceSchema, batchCreateEvidenceSchema } from '../schemas/index.js';
import { dbStore } from '../db/store.js';
import { isSupabaseConfigured } from '../config/env.js';
import { getScopedSupabaseClient } from '../db/supabase.js';

export const evidenceRouter = Router();

// List evidences in workspace
evidenceRouter.get(
  '/evidences',
  authenticate,
  requireWorkspace,
  async (req: Request, res: Response) => {
    const workspaceId = req.workspaceId!;
    const researchId = req.query.research_id as string | undefined;

    try {
      if (isSupabaseConfigured() && req.userToken) {
        const client = getScopedSupabaseClient(req.userToken);
        let query = client.from('evidences').select('*').eq('workspace_id', workspaceId);
        if (researchId) {
          query = query.eq('research_id', researchId);
        }
        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
          res.status(500).json({ error: 'Erro ao listar evidências', details: error.message });
          return;
        }

        res.json({ evidences: data || [] });
      } else {
        const evidences = await dbStore.listEvidences(workspaceId, researchId);
        res.json({ evidences });
      }
    } catch (error: any) {
      res.status(500).json({ error: 'Erro ao listar evidências', details: error.message });
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
      // 1. Verify parent research belongs to this workspace (prevent cross-tenant hijacking)
      if (isSupabaseConfigured() && req.userToken) {
        const client = getScopedSupabaseClient(req.userToken);

        const { data: research, error: rError } = await client
          .from('researches')
          .select('id')
          .eq('id', research_id)
          .eq('workspace_id', workspaceId)
          .single();

        if (rError || !research) {
          res.status(404).json({ error: 'A pesquisa informada não existe ou pertence a outro workspace.' });
          return;
        }

        const { data, error } = await client
          .from('evidences')
          .insert({
            workspace_id: workspaceId,
            research_id,
            quote,
            context,
            confidence_level,
            tags,
          })
          .select()
          .single();

        if (error) {
          res.status(400).json({ error: 'Falha ao criar evidência', details: error.message });
          return;
        }

        res.status(201).json({ evidence: data });
      } else {
        const research = await dbStore.getResearchById(workspaceId, research_id);
        if (!research) {
          res.status(404).json({ error: 'A pesquisa informada não existe ou pertence a outro workspace.' });
          return;
        }

        const evidence = await dbStore.createEvidence(workspaceId, {
          research_id,
          quote,
          context,
          confidence_level,
          tags,
        });
        res.status(201).json({ evidence });
      }
    } catch (error: any) {
      res.status(500).json({ error: 'Erro ao salvar evidência', details: error.message });
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
      if (isSupabaseConfigured() && req.userToken) {
        const client = getScopedSupabaseClient(req.userToken);

        // Verify research ownership
        const { data: research } = await client
          .from('researches')
          .select('id')
          .eq('id', research_id)
          .eq('workspace_id', workspaceId)
          .single();

        if (!research) {
          res.status(404).json({ error: 'Pesquisa inválida para este workspace' });
          return;
        }

        const payload = evidences.map((e: any) => ({
          workspace_id: workspaceId,
          research_id,
          quote: e.quote,
          context: e.context || null,
          confidence_level: e.confidence_level || 'medium',
          tags: e.tags || [],
        }));

        const { data, error } = await client.from('evidences').insert(payload).select();
        if (error) {
          res.status(400).json({ error: 'Falha ao inserir lote de evidências', details: error.message });
          return;
        }

        res.status(201).json({ evidences: data });
      } else {
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
      }
    } catch (error: any) {
      res.status(500).json({ error: 'Erro ao criar lote de evidências', details: error.message });
    }
  }
);
