import { Router } from 'express';
import { register, login, logout } from '../controllers/authController.js';
import { requireAuth } from "../middlewares/auth.js";

export const authRouter = Router();
authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/logout', logout)

authRouter.get('/me', requireAuth, async (req, res) => {
  const User = (await import("../models/User.js")).default;
  const u = await User.findById(req.user.id).select('-password').lean();
  if (!u) return res.status(404).json({ message: "No encontrado" });
  // Devolvemos user completo (sin pass) para que el front pueda tener toda la info
  res.json({ user: u });
});