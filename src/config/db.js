import dotenv from 'dotenv'
import mongoose from "mongoose"

dotenv.config()

const conectarDB = async () => {
    try {

        await mongoose.connect(process.env.MONGODB_URI)
        
    } catch (error) {
        console.error("Error al conectar con MONGODB: ", error.message)
    }
}

export default conectarDB