import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { getPaginationParams, buildSearchFilter } from '../utils/pagination.js';

export const listUsers = async (req, res) => {
  try {
    // Only ADMINs may use the paginated listing endpoint
    if (req.user?.rol !== 'ADMIN') return res.status(403).json({ message: 'Prohibido' });

    const { page, limit, skip, sort, sortDir, q: queryText } = getPaginationParams(req.query);

    const filter = buildSearchFilter(queryText, [
      'nombre', 'apellido', 'email', 'dni', 'telefono', 'rol'
    ]);

    const [items, total] = await Promise.all([
      User.find(filter)
        .sort({ [sort]: sortDir, _id: sort === "createdAt" ? sortDir : 1 })
        .skip(skip).limit(limit).select('-password').lean(),
      User.countDocuments(filter),
    ]);

    res.json({ items, total, page, limit });
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

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id; // authenticated user

    // Fields allowed depending on role:
    // - ADMIN: may update any user-editable field
    // - Non-ADMIN: may only update email and telefono
    const isAdmin = req.user?.rol === 'ADMIN';
    const allowedFieldsAdmin = ['nombre', 'apellido', 'dni', 'email', 'telefono', 'fechaNacimiento', 'password', 'rol'];
    const allowedFieldsUser = ['email', 'telefono'];

    const pick = (obj, keys) => keys.reduce((acc, k) => {
      if (obj[k] !== undefined) acc[k] = obj[k];
      return acc;
    }, {});

    const allowed = isAdmin ? pick(req.body, allowedFieldsAdmin) : pick(req.body, allowedFieldsUser);

    // Basic validation: if fields were provided, do lightweight checks
    if (allowed.nombre !== undefined && String(allowed.nombre).trim() === '') {
      return res.status(400).json({ message: 'Nombre inválido' });
    }
    if (allowed.apellido !== undefined && String(allowed.apellido).trim() === '') {
      return res.status(400).json({ message: 'Apellido inválido' });
    }

    // Validate and normalize fields
    if (allowed.email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(String(allowed.email).trim())) return res.status(400).json({ message: 'Email inválido' });
      allowed.email = String(allowed.email).trim().toLowerCase();
    }
    if (allowed.telefono !== undefined) {
      if (!/^\d{6,15}$/.test(String(allowed.telefono).trim())) return res.status(400).json({ message: 'Teléfono inválido' });
      allowed.telefono = String(allowed.telefono).trim();
    }
    if (allowed.fechaNacimiento !== undefined) {
      const d = new Date(allowed.fechaNacimiento);
      if (Number.isNaN(d.getTime())) return res.status(400).json({ message: 'Fecha de nacimiento inválida' });
      allowed.fechaNacimiento = d;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, allowed, { new: true, runValidators: true }).select('-password');
    if (!updatedUser) return res.status(404).json({ message: 'Usuario no encontrado' });

    res.json({ message: 'Perfil actualizado correctamente', user: updatedUser });

  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    // Return validation error messages when possible to help frontend debugging
    const msg = error?.message || 'Error al actualizar el perfil';
    const status = error?.name === 'ValidationError' ? 400 : 500;
    res.status(status).json({ message: msg });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Allow full user object only to ADMINs or the user themself.
    const isAdmin = req.user?.rol === 'ADMIN';
    const isSelf = req.user && (String(req.user.id || req.user._id) === String(id));

    const selectFull = isAdmin || isSelf;
    const user = await User.findById(id).select(selectFull ? '-password' : 'nombre apellido');

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json(user);

  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: "Error al obtener usuario", errorMsg: error.message });
  }
};

// El usuario autenticado ve/edita su propio perfil
export const getMe = async (req, res) => {
  const u = await User.findById(req.user.id).select('-password').lean();
  if (!u) return res.status(404).json({ message: "No encontrado" });
  res.json(u);
};

export const updateMe = async (req, res) => {
  // For /me: allow different sets depending on requester role
  const isAdmin = req.user?.rol === 'ADMIN';
  const allowedFieldsAdmin = ['nombre', 'apellido', 'dni', 'email', 'telefono', 'fechaNacimiento', 'password', 'rol'];
  const allowedFieldsUser = ['email', 'telefono'];
  const pick = (obj, keys) => keys.reduce((acc, k) => { if (obj[k] !== undefined) acc[k] = obj[k]; return acc; }, {});
  const allowed = isAdmin ? pick(req.body, allowedFieldsAdmin) : pick(req.body, allowedFieldsUser);

  // Validate common fields
  if (allowed.email !== undefined) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(allowed.email).trim())) return res.status(400).json({ message: 'Email inválido' });
    allowed.email = String(allowed.email).trim().toLowerCase();
  }
  if (allowed.telefono !== undefined) {
    if (!/^\d{6,15}$/.test(String(allowed.telefono).trim())) return res.status(400).json({ message: 'Teléfono inválido' });
    allowed.telefono = String(allowed.telefono).trim();
  }
  if (allowed.fechaNacimiento !== undefined) {
    const d = new Date(allowed.fechaNacimiento);
    if (Number.isNaN(d.getTime())) return res.status(400).json({ message: 'Fecha de nacimiento inválida' });
    allowed.fechaNacimiento = d;
  }

  const u = await User.findByIdAndUpdate(req.user.id, allowed, { new: true, runValidators: true }).select('-password');
  if (!u) return res.status(404).json({ message: "No encontrado" });
  res.json(u);
};

export const getUsers = async (req, res) => {

  try {
    // If requester is ADMIN return full users (except password).
    if (req.user?.rol === 'ADMIN') {
      const users = await User.find().select('-password').lean();
      return res.json(users);
    }

    // Non-admin or unauthenticated callers get only public fields.
    const users = await User.find().select('nombre apellido').lean();
    res.json(users);

  } catch (error) {
    res.status(500).json({ error: "Error al obtener users", errorMsg: error })
  }
}

export const getUsersSearch = async (req, res) => {

  const { nombre } = req.query

  try {
    const projection = req.user?.rol === 'ADMIN' ? '-password' : 'nombre apellido';
    const user = await User.find({
      nombre: {
        $regex: `^${nombre}`,
        $options: 'i'
      }
    }).select(projection).lean()
    res.json(user)

  } catch (error) {
    res.status(500).json({ error: "Error al obtener users", errorMsg: error })
  }
}

// metodo para que el admin pueda actualizar cualquier usuario por id

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, dni, email, telefono, fechaNacimiento, rol } = req.body;

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

    // Actualizar usuario
    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        dni: dni.trim(),
        email: email.trim().toLowerCase(),
        telefono: telefono.trim(),
        fechaNacimiento,
        rol
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({
      message: 'Usuario actualizado correctamente',
      user: updatedUser
    });

  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    if (error.code === 11000) {
      return res.status(409).json({ error: "Email o DNI duplicado" });
    }
    res.status(500).json({ message: 'Error al actualizar el usuario' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: "Faltan datos" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) return res.status(400).json({ message: "La contraseña actual es incorrecta" });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;

    await user.save();

    res.json({ message: "Contraseña actualizada correctamente" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error interno" });
  }
};

/**
 * Añade un ticket a la lista de compras realizadas de un usuario.
 * Devuelve el usuario actualizado o null si no existe.
 * Esta función está pensada para ser usada por otros controladores (por ejemplo pagosController).
 */
export const addPurchase = async (userId, ticketId) => {
  if (!userId) return null;
  try {
    const updated = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { comprasRealizadas: ticketId } },
      { new: true }
    );
    return updated;
  } catch (err) {
    // No lanzamos error para que el llamador pueda decidir el comportamiento
    console.error('addPurchase error:', err);
    return null;
  }
};