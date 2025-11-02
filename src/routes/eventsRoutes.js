import { Router } from 'express';
import { requireAuth, roleGate } from '../middlewares/auth.js';
import {
  listPublishedEvents,
  listEventsByRole,
  getEventByRole,
  createEvent,
  updateEvent
} from '../controllers/eventController.js';

export const eventsRouter = Router();

// público (anónimo)
eventsRouter.get('/public', listPublishedEvents);

// autenticado
eventsRouter.get('/', requireAuth, listEventsByRole);
eventsRouter.get('/:id', requireAuth, getEventByRole);

// admin
eventsRouter.post('/', requireAuth, roleGate('ADMIN'), createEvent);
eventsRouter.patch('/:id', requireAuth, roleGate('ADMIN'), updateEvent);
