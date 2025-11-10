import { Router } from 'express';
import { register, login } from '../controllers/authController.js';
import { updateProfile } from '../controllers/usersController.js';
import { protegerRuta } from '../middlewares/authMiddleware.js';

export const authRouter = Router();
authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.put('/profile', protegerRuta, updateProfile);

