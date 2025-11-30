import mongoose from "mongoose";

const { Types } = mongoose;

export function ensureValidObjectId(paramName = "id", resourceName = "Recurso") {
  return function ensureValidObjectIdMiddleware(req, res, next) {
    const value = req.params[paramName];

    if (!Types.ObjectId.isValid(value)) {
      return res.status(404).json({ message: `${resourceName} no encontrado` });
    }

    next();
  };
}

/**
 * Middleware to validate request body against a schema or validation function.
 * @param {Function|Object} schema - Validation function or object.
 */
export const validateRequest = (schema) => (req, res, next) => {
  if (typeof schema === 'function') {
    const error = schema(req.body);
    if (error) {
      return res.status(400).json({ error: true, message: error });
    }
  }
  next();
};

// --- Validation Schemas (Functions) ---

export const createEventSchema = (body) => {
  if (!body.titulo) return "El título es requerido";
  if (!body.descripcion) return "La descripción es requerida";
  if (!body.fecha) return "La fecha es requerida";
  if (!body.hora) return "La hora es requerida";
  if (!body.ubicacion || !body.ubicacion.lugar || !body.ubicacion.direccion) return "Ubicación incompleta";
  if (body.capacidadTotal <= 0) return "La capacidad debe ser mayor a 0";
  if (body.precioBase < 0) return "El precio no puede ser negativo";
  return null;
};

export const updateEventSchema = (body) => {
  // For updates, we only validate fields if they are present
  if (body.capacidadTotal !== undefined && Number(body.capacidadTotal) <= 0) return "La capacidad debe ser mayor a 0";
  if (body.precioBase !== undefined && Number(body.precioBase) < 0) return "El precio no puede ser negativo";
  return null;
};

export const createReviewSchema = (body) => {
  if (!body.rating) return "El rating es requerido";
  if (!body.comment) return "El comentario es requerido";
  if (body.rating < 1 || body.rating > 5) return "El rating debe estar entre 1 y 5";
  if (body.comment.length < 10 || body.comment.length > 500) return "El comentario debe tener entre 10 y 500 caracteres";
  return null;
};

export const updateReviewSchema = (body) => {
  if (body.rating !== undefined && (body.rating < 1 || body.rating > 5)) return "El rating debe estar entre 1 y 5";
  if (body.comment !== undefined && (body.comment.length < 10 || body.comment.length > 500)) return "El comentario debe tener entre 10 y 500 caracteres";
  return null;
};