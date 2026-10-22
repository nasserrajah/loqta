import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';
import { ValidationError } from '../shared/errors/index.js';

type RequestSource = 'body' | 'query' | 'params';

export function validate(schema: ZodTypeAny, source: RequestSource = 'body'): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }));
      next(new ValidationError('Request validation failed', details));
      return;
    }

    req.validated = { ...(req.validated ?? {}), [source]: result.data };
    if (source === 'body') {
      req.body = result.data;
    }
    next();
  };
}
