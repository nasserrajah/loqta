import { randomUUID } from 'node:crypto';
import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import type { Container } from './infrastructure/container.js';
import { createApiRouter } from './shared/http/router.worker.js';
import { notFoundHandler } from './middleware/not-found.js';
import { errorHandler } from './middleware/error-handler.js';

/**
 * Workers-compatible Express app factory. Same middleware stack as app.ts,
 * but wired to the fs-free router and docs variants.
 */
export function createApp(container: Container): Express {
  const app = express();

  if (container.env.TRUST_PROXY) {
    app.set('trust proxy', 1);
  }

  app.disable('x-powered-by');
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'"],
          imgSrc: ["'self'", 'data:'],
          objectSrc: ["'none'"],
          frameAncestors: ["'self'"],
        },
      },
    }),
  );
   app.use((req, res, next) => {
    const requestId = randomUUID();
    res.setHeader('x-request-id', requestId);
    const startedAt = Date.now();
    res.on('finish', () => {
      container.logger.info(
        {
          req: { id: requestId, method: req.method, url: req.originalUrl },
          res: { statusCode: res.statusCode },
          responseTime: Date.now() - startedAt,
        },
        'request completed',
      );
    });
    next();
  });
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.use('/api/v1', createApiRouter(container));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}