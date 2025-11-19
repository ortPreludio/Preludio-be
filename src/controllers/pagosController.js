// Controlador de Pagos
// Contiene la lógica para manejar las operaciones sobre pagos
import Pago from '../models/Pago.js';
import Ticket from '../models/Ticket.js';
import { createTicketForUser } from './ticketsController.js';

// Crear pago (checkout)
export const checkout = async (req, res) => {
    try {
        const {
            ticketId,
            metodo,
            monto,
            referenciaExterna,
            evento,
            tipoEntrada,
            precioPagado
        } = req.body;

        const compradorId = req.user?.id;

        let ticket = null;

        // Si se envía ticketId, usamos el ticket existente
        if (ticketId) {
            ticket = await Ticket.findById(ticketId);
            if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado' });
        } else {
            // Si no viene ticketId, delegamos la creación del ticket al controlador de tickets
            try {
                ticket = await createTicketForUser({ eventoId: evento, compradorId, tipoEntrada, precioPagado });
            } catch (err) {
                return res.status(400).json({ message: err.message });
            }
        }

        // Crea el pago asociado al ticket (si el pago se considera completo)
        const nuevoPago = new Pago({
            ticket: ticket._id,
            metodo,
            monto,
            referenciaExterna,
            fechaPago: new Date(),
            estado: 'COMPLETADO'
        });
        const pagoGuardado = await nuevoPago.save();

        // Devolver el pago con el ticket poblado
        const pagoConPopulate = await Pago.findById(pagoGuardado._id).populate({ path: 'ticket', populate: { path: 'comprador', select: 'nombre apellido email' } });

        res.status(201).json(pagoConPopulate);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Obtener pago por ID
export const getPagoById = async (req, res) => {
    try {
        const { id } = req.params;
        const pago = await Pago.findById(id).populate('ticket');
        if (!pago) {
            return res.status(404).json({ message: 'Pago no encontrado' });
        }
        res.status(200).json(pago);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
