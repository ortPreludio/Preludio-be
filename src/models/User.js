import mongoose from 'mongoose'

const userSchema = mongoose.Schema({
    nombre: {
        type: String,
        required: true
    },
    apellido: {
        type: String,
        required: true
    },
    dni: {
        type: String,
        required: true,
        unique: true // Recomendado para que no se repita
    },
    email: {
        type: String,
        required: true,
        unique: true // Recomendado para que no se repita
    },
    password: {
        type: String,
        required: true
    },
    fechaNacimiento: {
        type: Date,
        required: true
    },
    telefono: {
        type: String,
        required: true
    },
    rol: {
        type: String,
        enum: ['ADMIN', 'USUARIO'], // Solo permite estos dos valores
        default: 'USUARIO' // Valor por defecto si no se especifica
    },
    comprasRealizadas: [{
        type: Schema.Types.ObjectId,
        ref: 'Ticket' // Referencia al modelo 'Ticket'
    }],
    eventosCreados: [{
        type: Schema.Types.ObjectId,
        ref: 'Evento' // Referencia al modelo 'Evento'
    }]
}, { timestamps: true })


export default mongoose.model("User", userSchema)
