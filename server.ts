import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { healthRouter } from './server/routes/health.routes.js';
import { authRouter } from './server/routes/auth.routes.js';
import { workspaceRouter } from './server/routes/workspace.routes.js';
import { researchRouter } from './server/routes/research.routes.js';
import { evidenceRouter } from './server/routes/evidence.routes.js';
import { problemRouter } from './server/routes/problem.routes.js';
import { opportunityRouter } from './server/routes/opportunity.routes.js';
import { hypothesisRouter } from './server/routes/hypothesis.routes.js';
import { askProductRouter } from './server/routes/ask_product.routes.js';
import { testRouter } from './server/routes/test.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser with reasonable limits
  app.use(express.json({ limit: '5mb' }));

  // Security Headers Middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // Mount API Routers
  app.use('/api', healthRouter);
  app.use('/api', authRouter);
  app.use('/api', workspaceRouter);
  app.use('/api', researchRouter);
  app.use('/api', evidenceRouter);
  app.use('/api', problemRouter);
  app.use('/api', opportunityRouter);
  app.use('/api', hypothesisRouter);
  app.use('/api', askProductRouter);
  app.use('/api', testRouter);

  // Global Error Handler for API
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('[Product OS Server Error]:', err);
    res.status(err.status || 500).json({
      success: false,
      error: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'Ocorreu um erro interno ao processar a requisição.',
    });
  });

  // Vite Middleware Setup for Dev / Static Asset Server for Production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Product OS Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Product OS Startup Failure]:', err);
  process.exit(1);
});
