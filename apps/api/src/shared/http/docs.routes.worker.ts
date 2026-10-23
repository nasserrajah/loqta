import { Router } from 'express';
import { openApiDocument } from '../../docs/openapi.js';

/**
 * Workers-compatible replacement for docs.routes.ts.
 *
 * Swagger UI (swagger-ui-express) requires fs and express.static, neither of
 * which is available on Cloudflare Workers. We keep the OpenAPI JSON endpoint
 * (pure data, no filesystem) and drop the interactive UI. Clients can render
 * the spec themselves (e.g. via https://editor.swagger.io).
 */
export const docsRouter = Router();

docsRouter.get('/openapi.json', (_req, res) => {
  res.status(200).json(openApiDocument);
});