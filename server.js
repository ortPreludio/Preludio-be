import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { apiRouter } from "./src/routes/index.js";
import conectarDB from "./src/config/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares base
app.use(cors({ origin: process.env.FRONT, credentials: true }));
app.use(cookieParser());
app.use(express.json());

// Rutas API
app.use("/api", apiRouter);

// 404 genérico para todo lo que no matchee ninguna ruta
app.use((req, res, next) => {
  res.status(404).json({ message: "Recurso no encontrado" });
});

// Middleware de error simple
app.use((err, req, res, next) => {
  console.error("[ERROR]", err);
  const status = err.statusCode || 500;
  const message = err.message || "Error interno del servidor";
  res.status(status).json({ message });
});

// Arranque del servidor + conexión a DB
try {
  await conectarDB();
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
} catch (err) {
  console.error("No se pudo conectar a la base de datos:", err);
  process.exit(1);
}
