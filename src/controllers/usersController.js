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

export const getUsers = async (req, res) => {


    try {

        const user = await User.find()
        res.json(user)

    } catch (error) {
        res.status(500).json({ error: "Error al obtener users", errorMsg: error})
    }
}

export const getUsersSearch = async (req, res) => {

    const {nombre} = req.query

    try {

        const user = await User.find({
            nombre: { 
                $regex: `^${nombre}`,
                $options: 'i'}
        })
        res.json(user)

    } catch (error) {
        res.status(500).json({ error: "Error al obtener users", errorMsg: error})
    }
}

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

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Asumiendo que tenés middleware de autenticación
    const { nombre, apellido, dni, email, telefono, fechaNacimiento } = req.body;

    // Validaciones básicas
    if (!nombre || !apellido || !dni || !email || !telefono || !fechaNacimiento) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Email inválido' });
    }

    // Validar DNI (7-10 dígitos)
    if (!/^\d{7,10}$/.test(dni)) {
      return res.status(400).json({ message: 'DNI inválido' });
    }

    // Validar teléfono (6-15 dígitos)
    if (!/^\d{6,15}$/.test(telefono)) {
      return res.status(400).json({ message: 'Teléfono inválido' });
    }

    // Actualizar en la base de datos
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        dni: dni.trim(),
        email: email.trim().toLowerCase(),
        telefono: telefono.trim(),
        fechaNacimiento
      },
      { new: true, runValidators: true }
    ).select('-password'); // No devolver la contraseña

    if (!updatedUser) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({ 
      message: 'Perfil actualizado correctamente',
      user: updatedUser 
    });

  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ message: 'Error al actualizar el perfil' });
  }
};

export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const user = await User.findById(id).select('-password'); // No enviar la contraseña
        
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        
        res.json(user);
        
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({ error: "Error al obtener usuario", errorMsg: error.message });
    }
};

