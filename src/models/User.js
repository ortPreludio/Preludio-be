import mongoose from 'mongoose'

const userSchema = mongoose.Schema({
    nombre: { type: String, required: true},
    edad: { type: Number, required: true},
    email: { type: String, required: true},
    password: { type: String, required: true},
}, { timestamps: true}) // timestamp: no pertenece a los datos del usuario, sino que muestra
                        // cuando se creo o modifico el mismo


export default mongoose.model("User", userSchema)


