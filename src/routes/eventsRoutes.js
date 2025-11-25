import { Router } from "express";
import { searchEventsByRole, getEventByRole, createEvent, updateEvent, getEventCategories } from "../controllers/eventController.js";
import { protegerRuta, roleGate, optionalAuth } from "../middlewares/auth.js";
import { ensureValidObjectId } from "../middlewares/validations.js";

export const eventsRouter = Router();
const ensureValidEventId = ensureValidObjectId("id", "Evento");

// Listado role-aware. Si no querés requerir login para ver publicados, usa optionalAuth.
eventsRouter.get("/", optionalAuth, searchEventsByRole);
eventsRouter.get("/categories", getEventCategories);
eventsRouter.get("/:id", optionalAuth, ensureValidEventId, getEventByRole);

// Crear/editar eventos => solo ADMIN
eventsRouter.post("/", protegerRuta, roleGate("ADMIN"), createEvent);
eventsRouter.put("/:id", protegerRuta, roleGate("ADMIN"), ensureValidEventId, updateEvent);
// r.delete("/events/:id", protegerRuta, roleGate("ADMIN"), deleteEvent);
