import { randomUUID } from 'node:crypto';
import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { pinoHttp } from 'pino-http';
import type { Container } from './infrastructure/container.js';
import { createApiRouter } from './shared/http/router.js';
import { notFoundHandler } from './middleware/not-found.js';
import { errorHandler } from './middleware/error-handler.js';

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
  // Swagger UI uses inline bootstrap code and style attributes. Keep the strict
  // policy everywhere else and relax it only for the documentation page.
  app.use('/api/v1/docs', (_req, res, next) => {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; object-src 'none'; frame-ancestors 'self'",
    );
    next();
  });
  app.use(cors({ origin: container.env.CORS_ORIGINS, credentials: true }));
  app.use(
    pinoHttp({
      logger: container.logger,
      genReqId: (req, res) => {
        const requestId = randomUUID();
        res.setHeader('x-request-id', requestId);
        return requestId;
      },
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.use('/api/v1', createApiRouter(container));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
