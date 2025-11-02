import { Router } from 'express';
import { authRouter } from './authRoutes.js';
import { eventsRouter } from './eventsRoutes.js';

export const apiRouter = Router();
apiRouter.use('/auth', authRouter);
apiRouter.use('/events', eventsRouter);

// health endpoint por si llegamos a levantar el proyecto en cloud :)
apiRouter.get('/health', (req, res) => res.json({ ok: true, service: 'preludio-api' }));