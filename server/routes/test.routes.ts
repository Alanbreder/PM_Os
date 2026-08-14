import { Router, Request, Response } from 'express';
import { runSecurityIsolationTests } from '../tests/security.test.js';

export const testRouter = Router();

// Internal security test execution endpoint (returns execution report)
testRouter.get('/test/security-suite', async (req: Request, res: Response) => {
  try {
    const report = await runSecurityIsolationTests();
    const allPassed = report.every((r) => r.passed);
    res.json({
      success: allPassed,
      timestamp: new Date().toISOString(),
      tests: report,
    });
  } catch (error: any) {
    console.error('Error running security test suite:', error);
    res.status(500).json({ error: error.message });
  }
});
