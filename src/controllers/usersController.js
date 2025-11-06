import User from "../models/User.js";

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const esc = (s = "") => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const listUsers = async (req, res) => {
  try {
    const { q = "", page = 1, limit = 10, sort = "createdAt", order = "desc" } = req.query;

    const pageNum = clamp(parseInt(page, 10) || 1, 1, 10_000);
    const perPage = clamp(parseInt(limit, 10) || 10, 1, 100);
    const skip = (pageNum - 1) * perPage;
    const sortDir = order === "asc" ? 1 : -1;

    const filter = {};
    if (q) {
      const rx = new RegExp(esc(q), "i");
      filter.$or = [
        { nombre: rx }, { apellido: rx }, { email: rx },
        { dni: rx }, { telefono: rx }, { rol: rx },
      ];
    }

    const [items, total] = await Promise.all([
      User.find(filter)
        .sort({ [sort]: sortDir, _id: sort === "createdAt" ? sortDir : 1 })
        .skip(skip).limit(perPage).lean(),
      User.countDocuments(filter),
    ]);

    res.json({ items, total, page: pageNum, limit: perPage });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener usuarios", errorMsg: error?.message || error });
  }
};

export const createUser = async (req, res) => {
  try {
    const { nombre, apellido, dni, email, password, fechaNacimiento, telefono, rol } = req.body;
    if (!nombre || !apellido || !dni || !email || !password || !fechaNacimiento || !telefono) {
      return res.status(400).json({ error: "Faltan Datos" });
    }
    const newUser = await User.create({ nombre, apellido, dni, email, password, fechaNacimiento, telefono, rol });
    res.status(201).json(newUser);
  } catch (e) {
    if (e?.code === 11000) return res.status(409).json({ error: "Duplicado", fields: e.keyValue });
    res.status(500).json({ error: "Error al crear Usuario", errorMsg: e?.message || e });
  }
};

// El usuario autenticado ve/edita su propio perfil
export const getMe = async (req, res) => {
  const u = await User.findById(req.user.id).lean();
  if (!u) return res.status(404).json({ message: "No encontrado" });
  res.json(u);
};

export const updateMe = async (req, res) => {
  // limitar campos editables por el usuario final
  const allowed = (({ nombre, apellido, telefono, fechaNacimiento, password }) =>
    ({ nombre, apellido, telefono, fechaNacimiento, password }))(req.body);

  const u = await User.findByIdAndUpdate(req.user.id, allowed, { new: true, runValidators: true });
  if (!u) return res.status(404).json({ message: "No encontrado" });
  res.json(u);
};
