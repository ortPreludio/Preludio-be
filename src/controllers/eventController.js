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
  const ev = await Event.create(req.body);
  res.status(201).json(ev);
};

export const updateEvent = async (req, res) => {
  const ev = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!ev) return res.status(404).json({ message: "No encontrado" });
  res.json(ev);
};
