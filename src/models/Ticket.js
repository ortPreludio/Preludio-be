import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const ticketSchema = new Schema({

    evento: {
        type: Schema.Types.ObjectId,
        ref: 'Event', // 'Evento' debe ser el nombre de tu modelo de Evento
        required: true
    },


    comprador: {
        type: Schema.Types.ObjectId,
        ref: 'User', // 'Usuario' debe ser el nombre de tu modelo de Usuario
        required: true
    },


    tipoEntrada: {
        type: String,
        required: true,
        enum: ['GENERAL', 'VIP', 'PREMIUM'] // Define los valores permitidos
    },


    precioPagado: {
        type: Number,
        required: true
    },


    fechaCompra: {
        type: Date,
        required: true
    },


    codigoQR: {
        type: String,
        required: false // El '?' en la imagen indica que es opcional
    },


    estado: {
        type: String,
        enum: ['VALIDO', 'USADO', 'CANCELADO'],
        default: 'VALIDO' // El estado por defecto al crearse
    }
}, {
    timestamps: true
});

export default model('Ticket', ticketSchema);
