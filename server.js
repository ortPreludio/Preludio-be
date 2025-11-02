import express from "express"
import dotenv from "dotenv"

import { users } from "./src/data/users.js"
import { apiRouter } from './src/routes/index.js';
import conectarDB from "./src/config/db.js"

dotenv.config()

const app = express()

const PORT = process.env.PORT || 3000

conectarDB()


app.use(express.json())

app.use('/api', apiRouter);

app.listen(PORT, () => {
    console.log("Servidor corriendo en http://localhost:",PORT);
})

