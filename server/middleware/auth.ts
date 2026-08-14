import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../../src/lib/firebase-admin.js';
import { AuthenticatedUser, WorkspaceRole } from '../types/index.js';
import { dbStore } from '../db/store.js';
import { config } from '../config/env.js';

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
 * 1. Validates the JWT Bearer token using Firebase Admin SDK.
 * 2. Extracts the verified UID strictly from the validated token (never trusts frontend user_id).
 * 3. Ensures user record exists in PostgreSQL users table.
 * 4. Strictly prevents mock auth in production or without explicit environment variable.
 */
export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  // Development explicit mock authentication (ONLY if explicitly enabled via ALLOW_DEV_MOCK_AUTH=true and NOT in production)
  if (!token && config.ALLOW_DEV_MOCK_AUTH && config.NODE_ENV !== 'production') {
    const testUid = (req.headers['x-test-user-id'] as string) || 'usr-dev-mock-1';
    req.user = {
      id: testUid,
      email: `${testUid}@product-os.local`,
    };
    await dbStore.syncUser(testUid, req.user.email);
    next();
    return;
  }

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Token de autenticação ausente ou inválido. Forneça o cabeçalho Authorization: Bearer <Firebase_ID_Token>.',
    });
    return;
  }

  try {
    // Validate ID Token using Firebase Admin SDK
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;
    const email = decodedToken.email || `${uid}@firebase.user`;

    // Ensure user is synced to PostgreSQL database
    await dbStore.syncUser(uid, email, decodedToken.name);

    req.user = {
      id: uid,
      email,
    };
    req.userToken = token;
    next();
  } catch (err: any) {
    console.error('Firebase token verification failure:', err.message);
    res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Token Firebase inválido ou expirado.',
    });
  }
}

/**
 * Tenant Authorization Middleware
 * 1. Reads requested workspace from header `x-workspace-id`, query, or route params.
 * 2. Queries PostgreSQL Cloud SQL (workspace_members) to verify membership for the token's authenticated UID.
 * 3. Injects validated workspaceId and role or returns 403 Forbidden.
 */
export async function requireWorkspace(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Usuário não autenticado.',
    });
    return;
  }

  const requestedWorkspaceId =
    (req.headers['x-workspace-id'] as string) ||
    (req.params.workspaceId as string) ||
    (req.query.workspace_id as string);

  if (!requestedWorkspaceId) {
    res.status(400).json({
      success: false,
      error: 'BAD_REQUEST',
      message: 'Envie o cabeçalho "x-workspace-id" com o identificador do workspace.',
    });
    return;
  }

  try {
    let memberRecord = await dbStore.getMembership(requestedWorkspaceId, req.user.id);

    // In dev mock auth mode for the default preview user, grant owner role if workspace exists
    if (!memberRecord && config.ALLOW_DEV_MOCK_AUTH && config.NODE_ENV !== 'production' && req.user.id === 'usr-dev-mock-1') {
      const ws = await dbStore.getWorkspaceById(requestedWorkspaceId);
      if (ws) {
        memberRecord = { role: 'owner', workspace_id: requestedWorkspaceId };
      }
    }

    if (!memberRecord) {
      res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'O usuário autenticado não possui acesso a este workspace ou o workspace não existe.',
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
    console.error('requireWorkspace error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Erro interno de autorização de workspace.',
    });
  }
}
