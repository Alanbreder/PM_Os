import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { dbStore } from '../db/store.js';

export const authRouter = Router();

// Returns profile and accessible workspaces of the currently authenticated user
authRouter.get('/auth/me', authenticate, async (req: Request, res: Response) => {
  const user = req.user!;

  try {
    const workspaces = await dbStore.listWorkspacesForUser(user.id);
    const accessibleWorkspaces = await Promise.all(
      workspaces.map(async (ws) => {
        const membership = await dbStore.getMembership(ws.id, user.id);
        return {
          ...ws,
          role: membership?.role || 'member',
        };
      })
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
      },
      workspaces: accessibleWorkspaces,
    });
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Falha ao obter perfil do usuário' });
  }
});

authRouter.get('/auth/workspaces', authenticate, async (req: Request, res: Response) => {
  const user = req.user!;

  try {
    const workspaces = await dbStore.listWorkspacesForUser(user.id);
    res.json({ workspaces });
  } catch (error: any) {
    console.error('Error listing workspaces:', error);
    res.status(500).json({ error: 'Erro ao listar workspaces' });
  }
});
