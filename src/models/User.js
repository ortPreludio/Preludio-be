import { Schema, model } from 'mongoose';

const UserSchema = new Schema(
    {
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    apellido: {
        type: String,
        required: true,
        trim: true
    },
    dni: {
        type: String,
        required: true,
        unique: true,
        trim: true 
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true // Supuestamente mongoose debería convertirlo en minus incluso al hacer un update
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
        required: true,
        trim: true
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
        ref: 'Event' // Referencia al modelo 'Event'
    }]
}, { timestamps: true })

export default model("User", UserSchema)
