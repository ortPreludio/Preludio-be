import { Router } from 'express';
import { requireAuth, roleGate } from '../middlewares/auth.js';
import {
  listPublishedEvents,
  listEventsByRole,
  getEventByRole,
  createEvent,
  updateEvent,
} from '../controllers/eventController.js';

const r = Router();

// pública (home)
r.get('/public', listPublishedEvents);

// autenticada
r.get('/', requireAuth, listEventsByRole);
r.get('/:id', requireAuth, getEventByRole);

// gestión (admin)
r.post('/', requireAuth, roleGate('ADMIN'), createEvent);
r.patch('/:id', requireAuth, roleGate('ADMIN'), updateEvent);

export default r;
