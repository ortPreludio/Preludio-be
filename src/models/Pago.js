import mongoose from 'mongoose'

const pagoSchema = mongoose.Schema({
    ticket: {
        type: Schema.Types.ObjectId,
        ref: 'Ticket', // 'Ticket' debe ser el nombre de tu modelo de Ticket
        required: true
    },

    /**
     * Método utilizado para el pago.
     */
    metodo: {
        type: String,
        required: true,
        enum: ['MercadoPago', 'Tarjeta', 'Efectivo']
    },

    /**
     * El monto exacto que se pagó.
     */
    monto: {
        type: Number,
        required: true
    },

    /**
     * Fecha en que se completó o registró el pago.
     */
    fechaPago: {
        type: Date,
        required: true
    },

    /**
     * Estado actual de la transacción de pago.
     */
    estado: {
        type: String,
        enum: ['Pendiente', 'Completado', 'Fallido'],
        default: 'Pendiente' // Estado inicial por defecto
    },

    /**
     * ID externo de la transacción (ej: ID de MercadoPago).
     * Es opcional, como indica el '?' en la imagen.
     */
    referenciaExterna: {
        type: String,
        required: false
    }

}, {
    /**
     * timestamps: true
     * Añade createdAt y updatedAt
     */
    timestamps: true
});

export default mongoose.model('Pago', pagoSchema);
