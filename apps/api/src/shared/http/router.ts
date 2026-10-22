import { Router } from 'express';
import { healthRouter } from './health.routes.js';

// Module routers are mounted here as they are implemented (Phase 3+).
export const apiRouter = Router();
apiRouter.use(healthRouter);
