import express from "express"
import dotenv from "dotenv"

import { users } from "./src/data/users.js"
import { apiRouter } from './src/routes/index.js';
import ticketsRoutes from './src/routes/ticketsRoutes.js';
import pagosRoutes from './src/routes/pagosRoutes.js';
import conectarDB from "./src/config/db.js"
import cors from "cors";
import cookieParser from "cookie-parser";

dotenv.config()

const app = express()

const PORT = process.env.PORT || 3001

conectarDB()


app.use(cors({ origin: process.env.FRONT, credentials: true }));
app.use(cookieParser());
app.use(express.json())

app.use('/api/tickets', ticketsRoutes);
app.use('/api/pagos', pagosRoutes);

app.use('/api', apiRouter);

app.listen(PORT, () => {
    console.log("Servidor corriendo en http://localhost:",PORT);
})

