// Rutas para Tickets
import { Router } from 'express';
import mongoose from "mongoose";
import {
    createTicket,
    getMyTickets,
    getTicketById,
    deleteTicket,
    updateTicket
} from '../controllers/ticketsController.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

const router = Router();
const ensureValidTicketId = (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    // Si no se encuentra el ID retornar 404 not found
    return res.status(404).json({ message: "Ticket no encontrado" });
  }
  next();
};

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
