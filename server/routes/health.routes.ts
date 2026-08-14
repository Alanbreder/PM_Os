import { Router, Request, Response } from 'express';
import { isSupabaseConfigured } from '../config/env.js';

export const healthRouter = Router();

healthRouter.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Product OS Backend',
    stage: 'Stage 1 - Foundation & Security',
    database: {
      provider: 'PostgreSQL / Supabase',
      configured: isSupabaseConfigured(),
      rlsEnabled: true,
      isolationMode: 'Strict Tenant Membership Validation',
    },
  });
});
