import serverless from "serverless-http";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { apiRouter } from "../../src/routes/index.js";
import conectarDB from "../../src/config/db.js";

// Conectar a la base de datos
conectarDB();

const app = express();

// Middlewares base
app.use(cors({ origin: process.env.FRONT, credentials: true }));
app.use(cookieParser());
app.use(express.json());

// Rutas API
app.use("/api", apiRouter);

// 404 genérico
app.use((req, res, next) => {
    res.status(404).json({ message: "Recurso no encontrado" });
});

// Middleware de error
app.use((err, req, res, next) => {
    console.error("[ERROR]", err);
    const status = err.statusCode || 500;
    const message = err.message || "Error interno del servidor";
    res.status(status).json({ message });
});

// Configurar serverless-http
export const handler = serverless(app, {
    request(request, event, context) {
        if (event.body && typeof event.body === 'string') {
            try {
                request.body = JSON.parse(event.body);
            } catch (e) {
                console.error('Error parsing body:', e);
            }
        }
    }
});
