// Controlador de Pagos
// Contiene la lógica para manejar las operaciones sobre pagos
import Pago from '../models/Pago.js';
import Ticket from '../models/Ticket.js';
import { createTicketForUser } from './ticketsController.js';

import { getPaginationParams, buildSearchFilter } from '../utils/pagination.js';


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

export const listPagos = async (req, res) => {
  try {
    // Solo ADMIN puede usar este endpoint
    if (req.user?.rol !== "ADMIN") {
      return res.status(403).json({ message: "Prohibido" });
    }

    const { page, limit, skip, sort, sortDir, q: queryText } = getPaginationParams(req.query);

    const filter = buildSearchFilter(queryText, ['metodo', 'estado', 'referenciaExterna']);

    const [items, total] = await Promise.all([
      Pago.find(filter)
        .sort({ [sort]: sortDir, _id: sort === "createdAt" ? sortDir : 1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: "ticket",
          populate: { path: "comprador", select: "nombre apellido email" },
        })
        .lean(),
      Pago.countDocuments(filter),
    ]);

    res.json({ items, total, page, limit });
  } catch (error) {
    console.error("Error al listar pagos (admin):", error);
    res.status(500).json({
      error: "Error al obtener pagos",
      errorMsg: error?.message || error,
    });
  }
};

export const listMisPagos = async (req, res) => {
  try {
    const { page, limit, skip, sort, sortDir, q: queryText } = getPaginationParams(req.query);

    // 1) Buscar tickets del usuario logueado
    const ticketsUsuario = await Ticket.find({ comprador: req.user.id })
      .select("_id")
      .lean();

    const ticketIds = ticketsUsuario.map((t) => t._id);

    // Si no tiene tickets, no tiene pagos
    if (ticketIds.length === 0) {
      return res.json({
        items: [],
        total: 0,
        page,
        limit,
      });
    }

    // 2) Filtro base: solo pagos de esos tickets
    const searchFilter = buildSearchFilter(queryText, ['metodo', 'estado', 'referenciaExterna']);
    const filter = { ...searchFilter, ticket: { $in: ticketIds } };

    const [items, total] = await Promise.all([
      Pago.find(filter)
        .sort({ [sort]: sortDir, _id: sort === "createdAt" ? sortDir : 1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: "ticket",
          populate: { path: "comprador", select: "nombre apellido email" },
        })
        .lean(),
      Pago.countDocuments(filter),
    ]);

    res.json({ items, total, page, limit });
  } catch (error) {
    console.error("Error al listar pagos del usuario:", error);
    res.status(500).json({
      error: "Error al obtener pagos",
      errorMsg: error?.message || error,
    });
  }
};