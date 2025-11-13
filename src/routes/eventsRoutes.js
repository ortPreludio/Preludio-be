import { Router } from "express";
import { searchEventsByRole, getEventByRole, createEvent, updateEvent } from "../controllers/eventController.js";
import { protegerRuta, roleGate, optionalAuth } from "../middlewares/auth.js";

export const eventsRouter = Router();

// Listado role-aware. Si no querés requerir login para ver publicados, usa optionalAuth.
eventsRouter.get("/", optionalAuth, searchEventsByRole);
eventsRouter.get("/:id", optionalAuth, getEventByRole);

// Crear/editar eventos => solo ADMIN
eventsRouter.post("/", protegerRuta, roleGate("ADMIN"), createEvent);
eventsRouter.put("/:id", protegerRuta, roleGate("ADMIN"), updateEvent);
// r.delete("/events/:id", protegerRuta, roleGate("ADMIN"), deleteEvent);
