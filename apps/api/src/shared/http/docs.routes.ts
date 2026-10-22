import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { openApiDocument } from '../../docs/openapi.js';

export const docsRouter = Router();

docsRouter.get('/openapi.json', (_req, res) => {
  res.status(200).json(openApiDocument);
});

// Register the HTML route before the static asset middleware so /docs resolves
// directly instead of being redirected to /docs/.
docsRouter.get(
  '/docs',
  swaggerUi.setup(openApiDocument, {
    customSiteTitle: 'Loqta API Docs',
    swaggerOptions: { displayRequestDuration: true },
  }),
);
docsRouter.use('/docs', swaggerUi.serve);
