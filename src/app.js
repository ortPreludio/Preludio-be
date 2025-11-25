import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { apiRouter } from "./routes/index.js";

const app = express();

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

export default app;
