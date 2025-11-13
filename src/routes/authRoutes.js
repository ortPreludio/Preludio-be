import { Router } from 'express';
import { register, login, logout } from '../controllers/authController.js';
import { requireAuth } from "../middlewares/auth.js";
import { updateProfile } from '../controllers/usersController.js';


export const authRouter = Router();
authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/logout', logout)
authRouter.put('/profile', requireAuth, updateProfile);
authRouter.get('/me', requireAuth, async (req, res) => {
  const User = (await import("../models/User.js")).default;
  const u = await User.findById(req.user.id).lean();
  if (!u) return res.status(404).json({ message: "No encontrado" });
  res.json({ user: { id: u._id, nombre: u.nombre, apellido: u.apellido, email: u.email, rol: u.rol } });
});