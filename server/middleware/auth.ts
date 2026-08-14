import { Request, Response, NextFunction } from 'express';
import { getScopedSupabaseClient, getSupabaseAdmin } from '../db/supabase.js';
import { isSupabaseConfigured } from '../config/env.js';
import { AuthenticatedUser, WorkspaceRole } from '../types/index.js';
import { dbStore } from '../db/store.js';

// Extend Express Request interface to carry authenticated user and verified workspace
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      workspaceId?: string;
      workspaceRole?: WorkspaceRole;
      userToken?: string;
    }
  }
}

/**
 * Authentication Middleware
 * 1. Validates the JWT Bearer token using Supabase Auth (or test token in local test mode)
 * 2. Attaches the verified user information to `req.user`
 */
export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  // Fallback for Development/Testing sandbox when Supabase credentials are not yet supplied:
  // Allows testing multi-tenancy and permissions via test credentials (e.g. x-test-user-id)
  if (!token && req.headers['x-test-user-id']) {
    const testUserId = String(req.headers['x-test-user-id']);
    req.user = {
      id: testUserId,
      email: `${testUserId}@example.com`,
    };
    next();
    return;
  }

  if (!token) {
    res.status(401).json({
      error: 'Não autenticado',
      message: 'Cabeçalho Authorization: Bearer <token> ausente ou inválido.',
    });
    return;
  }

  req.userToken = token;

  // If Supabase is configured, verify token with Supabase Auth
  if (isSupabaseConfigured()) {
    try {
      const client = getScopedSupabaseClient(token);
      const { data: { user }, error } = await client.auth.getUser();

      if (error || !user) {
        res.status(401).json({
          error: 'Sessão inválida ou expirada',
          message: error?.message || 'Token de autenticação não autorizado.',
        });
        return;
      }

      req.user = {
        id: user.id,
        email: user.email || '',
      };
      next();
    } catch (err: any) {
      res.status(401).json({
        error: 'Erro na autenticação',
        message: err.message || 'Falha ao validar sessão.',
      });
    }
  } else {
    // Development sandbox mode: mock token validation
    req.user = {
      id: 'usr-dev-mock-1',
      email: 'dev@product-os.local',
    };
    next();
  }
}

/**
 * Tenant Authorization Middleware
 * 1. Reads the requested workspace from header `x-workspace-id` or query/param.
 * 2. CRITICAL: Strictly verifies in the database (`workspace_members`) if the authenticated user
 *    actually belongs to that workspace.
 * 3. Never trusts the frontend blindly! Rejects with 403 Forbidden if not a valid member.
 */
export async function requireWorkspace(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Usuário não autenticado' });
    return;
  }

  const requestedWorkspaceId =
    (req.headers['x-workspace-id'] as string) ||
    (req.params.workspaceId as string) ||
    (req.query.workspace_id as string);

  if (!requestedWorkspaceId) {
    res.status(400).json({
      error: 'Workspace não especificado',
      message: 'Envie o cabeçalho "x-workspace-id" com o identificador do workspace.',
    });
    return;
  }

  try {
    let memberRecord: { role: WorkspaceRole; workspace_id: string } | null = null;

    if (isSupabaseConfigured() && req.userToken) {
      const client = getScopedSupabaseClient(req.userToken);
      const { data, error } = await client
        .from('workspace_members')
        .select('role, workspace_id')
        .eq('workspace_id', requestedWorkspaceId)
        .eq('user_id', req.user.id)
        .maybeSingle();

      if (error) {
        res.status(500).json({ error: 'Falha ao validar permissões do workspace', details: error.message });
        return;
      }

      memberRecord = data as any;
    } else {
      // In-memory store validation
      memberRecord = await dbStore.getMembership(requestedWorkspaceId, req.user.id);
    }

    if (!memberRecord) {
      res.status(403).json({
        error: 'Acesso negado ao Workspace',
        message: 'O usuário não é membro deste workspace ou o workspace não existe. Validação de ownership falhou.',
      });
      return;
    }

    req.workspaceId = requestedWorkspaceId;
    req.workspaceRole = memberRecord.role;
    req.user.workspace = {
      id: requestedWorkspaceId,
      role: memberRecord.role,
      name: '',
    };

    next();
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro interno de autorização de workspace',
      details: error.message,
    });
  }
}
