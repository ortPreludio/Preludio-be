import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { apiRouter } from "./routes/index.js";
import { errorHandler } from "./middlewares/errorHandler.js";

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

// Middleware de error global
app.use(errorHandler);

export default app;
