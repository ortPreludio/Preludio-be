// src/routes/userRoutes.js
import { Router } from "express";
import {
  listUsers,       // listado admin paginado
  getUsers,        // listado general simple
  getUsersSearch,
  getUserById,
  createUser,
  getMe,
  updateMe,
  updateProfile,
  changePassword,
  updateUser,
} from "../controllers/usersController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { ensureValidObjectId } from "../middlewares/validations.js";

const usersRouter = Router();

const ensureValidUserId = ensureValidObjectId("id", "Usuario");

// --- Rutas ADMIN ---
usersRouter.get("/", requireAuth, requireRole("ADMIN"), listUsers);
usersRouter.post("/", requireAuth, requireRole("ADMIN"), createUser);
usersRouter.put("/:id", requireAuth, requireRole("ADMIN"), ensureValidUserId, updateUser);

// --- Perfil propio ---
usersRouter.get("/me", requireAuth, getMe);
usersRouter.patch("/me", requireAuth, updateMe);
usersRouter.put("/me/profile", requireAuth, updateProfile);
usersRouter.put("/me/change-password", requireAuth, changePassword);

// --- Rutas públicas / generales ---
// usersRouter.get("/", getUsers); No se que tanto sentido tiene este endpoint
usersRouter.get("/search", getUsersSearch);
// Detalle de usuario 
usersRouter.get("/:id", requireAuth, ensureValidUserId, getUserById);

export { usersRouter };