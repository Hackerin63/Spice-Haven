import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny } from 'zod';
import { AppError } from '../utils/AppError';

type Part = 'body' | 'query' | 'params';

export function validate(schema: ZodTypeAny, part: Part = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      return next(
        AppError.badRequest('Validation failed', 'VALIDATION_ERROR', result.error.flatten())
      );
    }
    (req as any)[part] = result.data;
    next();
  };
}
