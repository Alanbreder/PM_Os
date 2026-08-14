import { Router, Request, Response } from 'express';

export const healthRouter = Router();

healthRouter.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Product OS Backend',
    stage: 'Stage 1 - Foundation & Security',
    database: {
      provider: 'Google Cloud SQL (PostgreSQL)',
      orm: 'Drizzle ORM',
      configured: Boolean(process.env.SQL_HOST && process.env.SQL_USER),
      isolationMode: 'Strict Tenant Membership Authorization + Foreign Keys',
    },
  });
});
