import type { ErrorRequestHandler } from 'express';
import { AppError } from '../shared/errors/index.js';
import { logger } from '../config/logger.js';

function isDatabaseConstraintError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('code' in error)) return false;
  return String((error as { code: unknown }).code).startsWith('SQLITE_CONSTRAINT');
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const requestId = (req as { id?: string }).id;

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details === undefined ? {} : { details: err.details }),
        ...(requestId ? { requestId } : {}),
      },
    });
    return;
  }

  // Malformed JSON bodies from express.json()
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      error: {
        code: 'INVALID_JSON',
        message: 'Malformed JSON body',
        ...(requestId ? { requestId } : {}),
      },
    });
    return;
  }

  if (isDatabaseConstraintError(err)) {
    res.status(409).json({
      error: {
        code: 'CONFLICT',
        message: 'The request conflicts with existing data',
        ...(requestId ? { requestId } : {}),
      },
    });
    return;
  }

  // Never leak internals to clients.
  logger.error({ err, requestId }, 'Unhandled error');
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      ...(requestId ? { requestId } : {}),
    },
  });
};
