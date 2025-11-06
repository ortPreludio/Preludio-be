import { Router } from "express";
import { listUsers, createUser, getMe, updateMe } from "../controllers/usersController.js";
import { protegerRuta, roleGate } from "../middlewares/auth.js";

const usersRouter = Router();

// GET /api/users  -> lista paginada (solo ADMIN)
usersRouter.get("/", protegerRuta, roleGate("ADMIN"), listUsers);
// POST /api/users -> crear (ADMIN)
usersRouter.post("/", protegerRuta, roleGate("ADMIN"), createUser);

// Perfil propio
usersRouter.get("/me", protegerRuta, getMe);
usersRouter.patch("/me", protegerRuta, updateMe);

export { usersRouter };
