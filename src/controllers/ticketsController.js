// Controlador de Tickets
// Contiene la lógica para manejar las operaciones sobre tickets
import Ticket from '../models/Ticket.js';
import User from '../models/User.js';
import Event from '../models/Event.js';
import { addPurchase } from './usersController.js';

/**
 * Crea un ticket para un usuario programáticamente.
 * - verifica disponibilidad del evento
 * - decrementa entradasDisponibles
 * - crea el ticket y añade la compra al usuario
 * Devuelve el ticket creado.
 */
export const createTicketForUser = async ({ eventoId, compradorId, tipoEntrada, precioPagado }) => {
    if (!eventoId || !tipoEntrada || (precioPagado == null)) throw new Error('Faltan datos para crear ticket');

    const ev = await Event.findById(eventoId);
    if (!ev) throw new Error('Evento no encontrado');
    if (typeof ev.entradasDisponibles === 'number' && ev.entradasDisponibles <= 0) throw new Error('No hay entradas disponibles para este evento');

    if (typeof ev.entradasDisponibles === 'number') {
        ev.entradasDisponibles = Math.max(0, ev.entradasDisponibles - 1);
        await ev.save();
    }

    // obtener datos del comprador para el codigo QR
    let compradorDoc = null;
    if (compradorId) compradorDoc = await User.findById(compradorId).select('dni nombre apellido');

    const codigoQR = `${ev.id ?? ev._id}-${compradorDoc?.dni ?? compradorId}-${tipoEntrada}`;

    const nuevoTicket = new Ticket({
        evento: eventoId,
        comprador: compradorId,
        tipoEntrada,
        precioPagado,
        fechaCompra: new Date(),
        codigoQR,
        estado: 'VALIDO'
    });

    const ticketGuardado = await nuevoTicket.save();

    if (compradorId) await addPurchase(compradorId, ticketGuardado._id);

    return ticketGuardado;
};

// Crear ticket (usuario compra o admin crea manual)
export const createTicket = async (req, res) => {
    try {
        const { evento, tipoEntrada } = req.body;
        if (!evento || !tipoEntrada) {
            return res.status(400).json({ message: 'Faltan datos obligatorios' });
        }

        const userId = req.user.id;
        const esAdmin = req.user.rol === 'ADMIN';
        const compradorId = esAdmin && req.body.comprador ? req.body.comprador : userId;

        // precioPagado puede venir en el body o tomar el precio base del evento
        const precioPagado = req.body.precioPagado ?? req.body.precio ?? null;
        try {
            const ticketGuardado = await createTicketForUser({ eventoId: evento, compradorId, tipoEntrada, precioPagado });
            res.status(201).json(ticketGuardado);
        } catch (err) {
            return res.status(400).json({ message: err.message });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Obtener los tickets del usuario (o todos si es admin)
export const getMyTickets = async (req, res) => {
    try {
        const userId = req.user.id;
        const esAdmin = req.user.rol === 'ADMIN';
        let query = { comprador: userId };
        if (esAdmin && req.query.todos === 'true') {
            query = {};
        }
        const tickets = await Ticket.find(query)
            .populate('evento', 'nombre fecha lugar')
            .populate('comprador', 'nombre apellido email')
            .sort({ fechaCompra: -1 });
            if (tickets.length === 0) {
                return res.status(404).json({ message: 'No se encontraron tickets' });
            }
        res.status(200).json(tickets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Obtener un ticket específico
export const getTicketById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const esAdmin = req.user.rol === 'ADMIN';
        const ticket = await Ticket.findById(id)
            .populate('evento')
            .populate('comprador', 'nombre apellido email');
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket no encontrado' });
        }
        if (!esAdmin && ticket.comprador._id.toString() !== userId) {
            return res.status(403).json({ message: 'No autorizado' });
        }
        res.status(200).json(ticket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Cancelar ticket (usuario) o eliminar (admin)
export const deleteTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const esAdmin = req.user.rol === 'ADMIN';
        const ticket = await Ticket.findById(id);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket no encontrado' });
        }
        if (!esAdmin && ticket.comprador.toString() !== userId) {
            return res.status(403).json({ message: 'No autorizado' });
        }
        if (esAdmin) {
            await Ticket.findByIdAndDelete(id);
            await User.findByIdAndUpdate(ticket.comprador, {
                $pull: { comprasRealizadas: id }
            });
            res.status(200).json({ message: 'Ticket eliminado permanentemente' });
        } else {
            ticket.estado = 'Cancelado';
            await ticket.save();
            res.status(200).json({ message: 'Ticket cancelado', ticket });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Editar ticket (solo admin)
export const updateTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const esAdmin = req.user.rol === 'ADMIN';
        if (!esAdmin) {
            return res.status(403).json({ message: 'Solo los administradores pueden editar tickets' });
        }
        const ticketActualizado = await Ticket.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true }
        ).populate('evento').populate('comprador', 'nombre apellido email');
        if (!ticketActualizado) {
            return res.status(404).json({ message: 'Ticket no encontrado' });
        }
        res.status(200).json(ticketActualizado);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
