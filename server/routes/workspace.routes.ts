import { Router, Request, Response } from 'express';
import { authenticate, requireWorkspace } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createWorkspaceSchema, addWorkspaceMemberSchema, uuidParamSchema } from '../schemas/index.js';
import { dbStore } from '../db/store.js';
import { isSupabaseConfigured } from '../config/env.js';
import { getScopedSupabaseClient, getSupabaseAdmin } from '../db/supabase.js';

export const workspaceRouter = Router();

// Create new Workspace
workspaceRouter.post(
  '/workspaces',
  authenticate,
  validate({ body: createWorkspaceSchema }),
  async (req: Request, res: Response) => {
    const { name, slug } = req.body;
    const user = req.user!;

    try {
      if (isSupabaseConfigured() && req.userToken) {
        const client = getScopedSupabaseClient(req.userToken);
        const admin = getSupabaseAdmin();

        // 1. Create workspace
        const { data: ws, error: wsError } = await admin
          .from('workspaces')
          .insert({ name, slug })
          .select()
          .single();

        if (wsError) {
          res.status(400).json({ error: 'Falha ao criar workspace', details: wsError.message });
          return;
        }

        // 2. Add creator as owner in workspace_members
        const { error: memError } = await admin
          .from('workspace_members')
          .insert({
            workspace_id: ws.id,
            user_id: user.id,
            role: 'owner',
          });

        if (memError) {
          res.status(500).json({ error: 'Falha ao vincular usuário ao workspace', details: memError.message });
          return;
        }

        res.status(201).json({ workspace: ws });
      } else {
        const ws = await dbStore.createWorkspace(name, slug, user.id);
        res.status(201).json({ workspace: ws });
      }
    } catch (error: any) {
      res.status(500).json({ error: 'Erro interno ao criar workspace', details: error.message });
    }
  }
);

// Get specific Workspace (with strict membership validation)
workspaceRouter.get(
  '/workspaces/:id',
  authenticate,
  validate({ params: uuidParamSchema }),
  requireWorkspace,
  async (req: Request, res: Response) => {
    const workspaceId = req.params.id;

    try {
      if (isSupabaseConfigured() && req.userToken) {
        const client = getScopedSupabaseClient(req.userToken);
        const { data, error } = await client.from('workspaces').select('*').eq('id', workspaceId).single();
        if (error) {
          res.status(404).json({ error: 'Workspace não encontrado', details: error.message });
          return;
        }
        res.json({ workspace: data, userRole: req.workspaceRole });
      } else {
        const ws = await dbStore.getWorkspaceById(workspaceId);
        if (!ws) {
          res.status(404).json({ error: 'Workspace não encontrado' });
          return;
        }
        res.json({ workspace: ws, userRole: req.workspaceRole });
      }
    } catch (error: any) {
      res.status(500).json({ error: 'Erro ao buscar workspace', details: error.message });
    }
  }
);

// Add member to workspace (Owner/Admin only)
workspaceRouter.post(
  '/workspaces/:id/members',
  authenticate,
  validate({ params: uuidParamSchema, body: addWorkspaceMemberSchema }),
  requireWorkspace,
  async (req: Request, res: Response) => {
    if (req.workspaceRole !== 'owner' && req.workspaceRole !== 'admin') {
      res.status(403).json({ error: 'Apenas proprietários e administradores podem convidar membros' });
      return;
    }

    const workspaceId = req.params.id;
    const { user_id, role } = req.body;

    try {
      if (isSupabaseConfigured() && req.userToken) {
        const client = getScopedSupabaseClient(req.userToken);
        const { data, error } = await client
          .from('workspace_members')
          .insert({ workspace_id: workspaceId, user_id, role })
          .select()
          .single();

        if (error) {
          res.status(400).json({ error: 'Falha ao adicionar membro', details: error.message });
          return;
        }

        res.status(201).json({ member: data });
      } else {
        const member = await dbStore.addMember(workspaceId, user_id, role);
        res.status(201).json({ member });
      }
    } catch (error: any) {
      res.status(500).json({ error: 'Erro ao adicionar membro', details: error.message });
    }
  }
);
