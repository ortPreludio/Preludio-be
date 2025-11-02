import express from "express"
import dotenv from "dotenv"

import { users } from "./src/data/users.js"
import usersRoutes from './src/routes/userRoutes.js' 
import eventsRoutes from './src/routes/eventsRoutes.js' 
import conectarDB from "./src/config/db.js"

dotenv.config()

const app = express()

const PORT = process.env.PORT || 3000

conectarDB()


app.use(express.json())

app.use("/api/users", usersRoutes)
app.use("/api/events", eventsRoutes)

app.listen(PORT, () => {
    console.log("Servidor corriendo en http://localhost:",PORT);
})

