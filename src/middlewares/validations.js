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