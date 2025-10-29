import mongoose from 'mongoose'

const tipoEntradaSchema = mongoose.Schema({

    /**
     * Nombre del tipo de entrada (ej: "VIP", "General", "Campo").
     */
    nombre: {
        type: String,
        required: true
    },

    /**
     * Precio específico para este tipo de entrada.
     */
    precio: {
        type: Number,
        required: true
    },

    /**
     * Cantidad total de entradas disponibles para este tipo específico.
     */
    cupo: {
        type: Number,
        required: true
    },

    /**
     * Contador de cuántas entradas de este tipo ya se vendieron.
     */
    entradasVendidas: {
        type: Number,
        default: 0 // Valor por defecto 0, como indica la imagen
    }

}, {
    /**
     * timestamps: true
     * Añade createdAt y updatedAt
     */
    timestamps: true
});

// Exporta el modelo para poder usarlo en otras partes de tu aplicación
export default mongoose.model('TipoEntrada', tipoEntradaSchema);