import mongoose from 'mongoose'

const eventSchema = mongoose.Schema({
    titulo: {
        type: String,
        required: true
    },
    descripcion: {
        type: String,
        required: true
    },
    categoria: {
        type: String,
        required: true,
        //tentativos, no son los finales
        enum: ['Concierto', 'Teatro', 'Deporte', 'Festival', 'Otro']
    },
    fecha: {
        type: Date,
        required: true
    },
    hora: {
        type: String,
        required: true // p.ej. "21:00"
    },

    // Objeto anidado para la ubicación
    ubicacion: {
        lugar: { type: String, required: true },
        direccion: { type: String, required: true },
        ciudad: { type: String, required: true },
        provincia: { type: String, required: true }
    },

    // --- Campos de la imagen ---
    // la imagen tiene campos duplicados (precio/precioBase, capacidad/capacidadTotal, etc.)
    // los incluimos todos tal cual están en la imagen.

    precio: { // Duplicado de precioBase
        type: Number,
        required: true
    },
    capacidad: { // Duplicado de capacidadTotal
        type: Number,
        required: true
    },
    ticketsDisponibles: { // Duplicado de entradasDisponibles
        type: Number,
        required: true
    },
    capacidadTotal: {
        type: Number,
        required: true
    },
    entradasDisponibles: {
        type: Number,
        required: true
    },
    precioBase: {
        type: Number,
        required: true
    },
    // --- Fin de campos duplicados ---

    creador: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario', // Referencia al modelo 'Usuario'
        required: true
        // Aquí deberíamos validar en nuestra lógica que este usuario tenga rol 'ADMIN'
    },

    imagen: {
        type: String, // URL de la imagen
        required: false
    },

    estado: {
        type: String,
        enum: ['Activo', 'Finalizado', 'Cancelado'],
        default: 'Activo'
    },

    fechaPublicacion: {
        type: Date,
        default: Date.now // Se establece al momento de crear el evento
    }

}, {

    timestamps: true
});

// Antes de guardar un nuevo evento, seteamos los tickets disponibles igual a la capacidad.
eventSchema.pre('save', function (next) {
    if (this.isNew) {
        this.ticketsDisponibles = this.capacidad;
    }
    next();
});

export default mongoose.model('Event', eventSchema);