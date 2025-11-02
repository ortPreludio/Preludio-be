import { Router } from 'express';
import events from './eventsRoutes.js';

const r = Router();
r.use('/events', events);
export default r;
