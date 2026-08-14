import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { dbStore } from '../db/store.js';
import { isSupabaseConfigured } from '../config/env.js';
import { getScopedSupabaseClient } from '../db/supabase.js';

export const authRouter = Router();

// Returns profile and accessible workspaces of the currently authenticated user
authRouter.get('/auth/me', authenticate, async (req: Request, res: Response) => {
  const user = req.user!;

  try {
    let accessibleWorkspaces = [];

    if (isSupabaseConfigured() && req.userToken) {
      const client = getScopedSupabaseClient(req.userToken);
      const { data, error } = await client
        .from('workspace_members')
        .select('role, workspaces(id, name, slug, created_at)')
        .eq('user_id', user.id);

      if (error) {
        res.status(500).json({ error: 'Erro ao listar workspaces', details: error.message });
        return;
      }

      accessibleWorkspaces = (data || []).map((row: any) => ({
        ...row.workspaces,
        role: row.role,
      }));
    } else {
      const workspaces = await dbStore.listWorkspacesForUser(user.id);
      accessibleWorkspaces = await Promise.all(
        workspaces.map(async (ws) => {
          const membership = await dbStore.getMembership(ws.id, user.id);
          return {
            ...ws,
            role: membership?.role || 'member',
          };
        })
      );
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
      },
      workspaces: accessibleWorkspaces,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Falha ao obter perfil do usuário', details: error.message });
  }
});

authRouter.get('/auth/workspaces', authenticate, async (req: Request, res: Response) => {
  const user = req.user!;

  try {
    let workspaces = [];
    if (isSupabaseConfigured() && req.userToken) {
      const client = getScopedSupabaseClient(req.userToken);
      const { data, error } = await client.from('workspaces').select('*');
      if (error) {
        res.status(500).json({ error: 'Erro ao listar workspaces', details: error.message });
        return;
      }
      workspaces = data || [];
    } else {
      workspaces = await dbStore.listWorkspacesForUser(user.id);
    }

    res.json({ workspaces });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao listar workspaces', details: error.message });
  }
});
