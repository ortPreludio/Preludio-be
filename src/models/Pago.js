import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const pagoSchema = new Schema({
    ticket: {
        type: Schema.Types.ObjectId,
        ref: 'Ticket', 
        required: true
    },

    /**
     * Método utilizado para el pago.
     */
    metodo: {
        type: String,
        required: true,
        enum: ['MERCADO_PAGO', 'TARJETA', 'EFECTIVO']
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
        default: Date.now,
        immutable: true,
    },

    /**
     * Estado actual de la transacción de pago.
     */
    estado: {
        type: String,
        enum: ['PENDIENTE', 'COMPLETADO', 'FALLIDO'],
        default: 'PENDIENTE' // Estado inicial por defecto
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

export default model('Pago', pagoSchema);
