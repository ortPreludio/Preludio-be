// Rutas para Tickets
import { Router } from 'express';
import {
    createTicket,
    getMyTickets,
    getTicketById,
    deleteTicket,
    updateTicket
} from '../controllers/ticketsController.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { ensureValidObjectId } from "../middlewares/validations.js";

const router = Router();
const ensureValidTicketId = ensureValidObjectId("id", "Ticket");

// Crear ticket (usuario compra o admin crea)
router.post('/', requireAuth, createTicket);
// Ver mis tickets (o todos si es admin con ?todos=true)
router.get('/', requireAuth, getMyTickets);
// Ver un ticket específico
router.get('/:id', requireAuth, ensureValidTicketId, getTicketById);
// Cancelar/Eliminar ticket
router.delete('/:id', requireAuth, requireRole('ADMIN'), ensureValidTicketId, deleteTicket);
// Editar ticket (solo admin)
router.put('/:id', requireAuth, requireRole('ADMIN'), ensureValidTicketId, updateTicket);

export default router;
