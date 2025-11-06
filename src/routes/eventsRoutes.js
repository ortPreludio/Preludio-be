import { Router } from "express";
import { searchEventsByRole, getEventByRole, createEvent, updateEvent } from "../controllers/eventController.js";
import { protegerRuta, roleGate, optionalAuth } from "../middlewares/auth.js";

export const eventsRouter = Router();

// Listado role-aware. Si no querés requerir login para ver publicados, usa optionalAuth.
eventsRouter.get("/events", optionalAuth, searchEventsByRole);
eventsRouter.get("/events/:id", optionalAuth, getEventByRole);

// Crear/editar eventos => solo ADMIN
eventsRouter.post("/events", protegerRuta, roleGate("ADMIN"), createEvent);
eventsRouter.put("/events/:id", protegerRuta, roleGate("ADMIN"), updateEvent);
// r.delete("/events/:id", protegerRuta, roleGate("ADMIN"), deleteEvent);
