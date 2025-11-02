import { Router } from 'express';
import events from './events.routes.js';

const r = Router();
r.use('/events', events);
export default r;
