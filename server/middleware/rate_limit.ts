import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const memoryStore: RateLimitStore = {};

// Clean up expired keys every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const key in memoryStore) {
    if (memoryStore[key].resetTime <= now) {
      delete memoryStore[key];
    }
  }
}, 300000);

export function aiRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const windowMs = Number(process.env.AI_RATE_LIMIT_WINDOW_MS) || 60000;
  const maxRequests = Number(process.env.AI_RATE_LIMIT_MAX_REQUESTS) || 5;

  // Rate limit key uses authenticated Firebase UID if present, or IP fallback
  const identifier = req.user?.id || req.ip || 'anonymous';
  const key = `ai_limit:${identifier}`;
  const now = Date.now();

  const record = memoryStore[key];

  if (!record || record.resetTime <= now) {
    memoryStore[key] = {
      count: 1,
      resetTime: now + windowMs,
    };
    next();
    return;
  }

  if (record.count >= maxRequests) {
    const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
    res.setHeader('Retry-After', retryAfterSec);
    res.status(429).json({
      success: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: `Limite de requisições de IA atingido. Você pode realizar até ${maxRequests} chamadas a cada ${Math.round(
        windowMs / 1000
      )}s. Tente novamente em ${retryAfterSec} segundos.`,
    });
    return;
  }

  record.count += 1;
  next();
}
