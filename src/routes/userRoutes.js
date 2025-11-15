import { Router } from "express";
import { listUsers, getMe, updateMe, getUsers, createUser, getUsersSearch, getUserById, updateUser } from "../controllers/usersController.js";
import { protegerRuta, roleGate } from "../middlewares/auth.js";
import { updateProfile } from '../controllers/usersController.js';

const usersRouter = Router();

// GET /api/users  -> lista paginada (solo ADMIN)
usersRouter.get("/", protegerRuta, roleGate("ADMIN"), listUsers);
// POST /api/users -> crear (ADMIN)
usersRouter.post("/", protegerRuta, roleGate("ADMIN"), createUser);

// Perfil propio
usersRouter.get("/me", protegerRuta, getMe);
usersRouter.patch("/me", protegerRuta, updateMe);

// Rutas públicas
usersRouter.get("/", getUsers); //comparar con listUsers
usersRouter.get("/search", getUsersSearch);
usersRouter.get("/:id", protegerRuta, getUserById); // Nueva ruta - debe ir después de /search
usersRouter.get("/", protegerRuta, getUsers); //comparar con listUsers
usersRouter.get("/search", protegerRuta, getUsersSearch)
usersRouter.put('/profile', protegerRuta, updateProfile);
//nueva ruta para actualizar usuario por id (solo ADMIN)
usersRouter.put("/:id", protegerRuta, roleGate("ADMIN"), updateUser);

export { usersRouter };