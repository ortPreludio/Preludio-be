import mongoose from 'mongoose'

const ticketSchema = mongoose.Schema({

    evento: {
        type: Schema.Types.ObjectId,
        ref: 'Evento', // 'Evento' debe ser el nombre de tu modelo de Evento
        required: true
    },


    comprador: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario', // 'Usuario' debe ser el nombre de tu modelo de Usuario
        required: true
    },


    tipoEntrada: {
        type: String,
        required: true,
        enum: ['General', 'VIP', 'Premium'] // Define los valores permitidos
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
        enum: ['Válido', 'Usado', 'Cancelado'],
        default: 'Válido' // El estado por defecto al crearse
    }
}, {

    timestamps: true
});

export default mongoose.model('Ticket', ticketSchema);
