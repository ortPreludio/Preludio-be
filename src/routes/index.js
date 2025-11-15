import { Router } from 'express';
import { authRouter } from './authRoutes.js';
import { eventsRouter } from './eventsRoutes.js';
import { usersRouter } from './userRoutes.js';
import reviewRouter from './reviewRoutes.js';


export const apiRouter = Router();
apiRouter.use('/users', usersRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/events', eventsRouter);
apiRouter.use('/reviews', reviewRouter);

// health endpoint por si llegamos a levantar el proyecto en cloud :)
apiRouter.get('/health', (req, res) => res.json({ ok: true, service: 'preludio-api' }));