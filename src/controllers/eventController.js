import Event from "../models/Event.js";

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const esc = (s = "") => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const searchEventsByRole = async (req, res) => {
  try {
    const {
      q = "", page = 1, limit = 10, sort = "fecha", order = "asc",
      estado, estadoPublicacion, categoria, from, to, ciudad, provincia, lugar,
    } = req.query;

    const pageNum = clamp(parseInt(page, 10) || 1, 1, 10_000);
    const perPage = clamp(parseInt(limit, 10) || 10, 1, 100);
    const skip = (pageNum - 1) * perPage;
    const sortDir = order === "desc" ? -1 : 1;

    const baseFilter = req.user?.rol === "ADMIN" ? {} : { estadoPublicacion: "PUBLISHED" };
    const filter = { ...baseFilter };

    if (q) {
      const rx = new RegExp(esc(q), "i");
      filter.$or = [
        { titulo: rx }, { descripcion: rx }, { categoria: rx },
        { "ubicacion.lugar": rx }, { "ubicacion.ciudad": rx }, { "ubicacion.provincia": rx },
      ];
    }
    if (estado) filter.estado = estado;
    if (estadoPublicacion) filter.estadoPublicacion = estadoPublicacion;
    if (categoria) filter.categoria = categoria;
    if (ciudad) filter["ubicacion.ciudad"] = new RegExp(esc(ciudad), "i");
    if (provincia) filter["ubicacion.provincia"] = new RegExp(esc(provincia), "i");
    if (lugar) filter["ubicacion.lugar"] = new RegExp(esc(lugar), "i");

    if (from || to) {
      filter.fecha = {};
      if (from) filter.fecha.$gte = new Date(from);
      if (to) filter.fecha.$lte = new Date(to);
    }

    const sortObj = { [sort]: sortDir };
    if (sort === "fecha") sortObj.hora = sortDir;

    const [items, total] = await Promise.all([
      Event.find(filter).sort(sortObj).skip(skip).limit(perPage).lean(),
      Event.countDocuments(filter),
    ]);

    res.json({ items, total, page: pageNum, limit: perPage });
  } catch (error) {
    res.status(500).json({ error: "Error al listar eventos", errorMsg: error?.message || error });
  }
};

export const getEventByRole = async (req, res) => {
  const ev = await Event.findById(req.params.id);
  if (!ev) return res.status(404).json({ message: "No encontrado" });
  if (req.user?.rol !== "ADMIN" && ev.estadoPublicacion !== "PUBLISHED") {
    return res.status(403).json({ message: "Prohibido" });
  }
  res.json(ev);
};

export const createEvent = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    const userId = req.user.id || req.user._id;
    const payload = { ...req.body, creador: userId };
    const ev = await Event.create(payload);
    res.status(201).json(ev);
  } catch (error) {
    res.status(400).json({ error: 'Error al crear evento', errorMsg: error?.message || error });
  }
};

export const updateEvent = async (req, res) => {
  try {
    // Prevent changing the creator via update
    if (req.body.creador) delete req.body.creador;

    // Accept either nested ubicacion or flat fields (lugar, direccion, ciudad, provincia)
    const body = { ...req.body };
    if (!body.ubicacion) {
      const { lugar, direccion, ciudad, provincia } = body;
      if (lugar || direccion || ciudad || provincia) {
        body.ubicacion = {
          lugar: lugar || undefined,
          direccion: direccion || undefined,
          ciudad: ciudad || undefined,
          provincia: provincia || undefined,
        };
        // remove flat fields to avoid accidental top-level writes
        delete body.lugar; delete body.direccion; delete body.ciudad; delete body.provincia;
      }
    }

    // Basic validation
    const timeRx = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (body.titulo !== undefined && String(body.titulo).trim() === '') {
      return res.status(400).json({ message: 'Título inválido' });
    }
    if (body.descripcion !== undefined && String(body.descripcion).trim() === '') {
      return res.status(400).json({ message: 'Descripción inválida' });
    }
    if (body.fecha !== undefined && Number.isNaN(new Date(body.fecha).getTime())) {
      return res.status(400).json({ message: 'Fecha inválida' });
    }
    if (body.hora !== undefined && !timeRx.test(body.hora)) {
      return res.status(400).json({ message: 'Hora inválida' });
    }
    if (body.ubicacion) {
      if (!body.ubicacion.lugar || !body.ubicacion.direccion) {
        return res.status(400).json({ message: 'Ubicación incompleta (lugar y dirección requeridos)' });
      }
    }
    if (body.capacidadTotal !== undefined && Number(body.capacidadTotal) <= 0) {
      return res.status(400).json({ message: 'Capacidad inválida' });
    }
    if (body.precioBase !== undefined && Number(body.precioBase) < 0) {
      return res.status(400).json({ message: 'Precio inválido' });
    }

    // actualizar entradasDisponibles automaticamete cuando capacidadTotal cambia
    // Solo si entradasDisponibles no se proporciona explícitamente en la solicitud
    if (body.capacidadTotal !== undefined && body.entradasDisponibles === undefined) {
      // Obtener el evento actual para obtener la antigua capacidadTotal
      const currentEvent = await Event.findById(req.params.id);
      if (!currentEvent) return res.status(404).json({ message: "No encontrado" });

      const oldCapacity = currentEvent.capacidadTotal || 0;
      const newCapacity = Number(body.capacidadTotal);
      const capacityDifference = newCapacity - oldCapacity;

      // Ajustar las entradas disponibles en base a la diferencia de capacidad
      const currentAvailable = currentEvent.entradasDisponibles || 0;
      const newAvailable = Math.max(0, currentAvailable + capacityDifference);

      body.entradasDisponibles = newAvailable;
    }

    // Si entradasDisponibles es proporcionada, validarla y utilizarla
    if (body.entradasDisponibles !== undefined) {
      const availableTickets = Number(body.entradasDisponibles);
      if (availableTickets < 0) {
        return res.status(400).json({ message: 'Entradas disponibles no puede ser negativo' });
      }
      // Validacion de que las entradas disponibles no excedan la capacidad total
      const finalCapacity = body.capacidadTotal !== undefined
        ? Number(body.capacidadTotal)
        : (await Event.findById(req.params.id))?.capacidadTotal || 0;

      if (availableTickets > finalCapacity) {
        return res.status(400).json({
          message: `Entradas disponibles (${availableTickets}) no puede exceder la capacidad total (${finalCapacity})`
        });
      }
    }

    const ev = await Event.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
    if (!ev) return res.status(404).json({ message: "No encontrado" });
    res.json(ev);
  } catch (error) {
    res.status(400).json({ error: 'Error al actualizar evento', errorMsg: error?.message || error });
  }
};
