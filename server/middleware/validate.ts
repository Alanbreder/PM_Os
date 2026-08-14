import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

interface ValidationTargets {
  body?: ZodSchema<any>;
  query?: ZodSchema<any>;
  params?: ZodSchema<any>;
}

export function validate(schemas: ValidationTargets) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issuesMsg = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
        res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: `Dados inválidos: ${issuesMsg}`,
        });
        return;
      }
      res.status(400).json({
        success: false,
        error: 'INVALID_PAYLOAD',
        message: 'Payload de requisição inválido ou malformatado.',
      });
    }
  };
}
