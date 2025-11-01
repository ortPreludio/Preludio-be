import { Schema, model } from 'mongoose';

const UbicacionSchema = new Schema(
  {
    lugar: { type: String, required: true, trim: true },
    direccion: { type: String, required: true, trim: true },
    ciudad: { type: String, required: true, trim: true },
    provincia: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const EventSchema = new Schema(
    {
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
        enum: ['Concierto', 'Teatro', 'Deporte', 'Festival', 'Otro'],
        index: true
    },
    fecha: {
        type: Date,
        required: true
    },
    hora: {
        type: String,
        required: true, // p.ej. "21:00"
        match: /^([01]\d|2[0-3]):[0-5]\d$/
    },

    // Objeto anidado para la ubicación
    ubicacion: {
        type: UbicacionSchema,
        required: true
    },

    // --- Campos de la imagen ---
    // la imagen tiene campos duplicados (precio/precioBase, capacidad/capacidadTotal, etc.)
    // los incluimos todos tal cual están en la imagen.

    precioBase: { // Para no duplicar se usa alias
        type: Number,
        required: true,
        min: 0,
        alias: 'precio'
    },
    capacidadTotal: { // Para no duplicar se usa alias
        type: Number,
        required: true,
        min: 0,
        alias: 'capacidad'
    },
    entradasDisponibles: { // Para no duplicar se usa alias
        type: Number,
        required: true,
        min: 0,
        alias: 'ticketsDisponibles'
    },
    // --- Fin de campos duplicados ---

    creador: {
        type: Schema.Types.ObjectId,
        ref: 'User', // Referencia al modelo 'User'
        required: true,
        index: true,
        immutable: true
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
    estadoPublicacion: {
      type: String,
      enum: ['PENDING', 'PUBLISHED', 'PAST'],
      default: 'PENDING',
      index: true,
    },

    fechaPublicacion: {
        type: Date,
        default: Date.now // Se establece al momento de crear el evento
    }

}, 
{
    timestamps: true,
    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true },
}
);
EventSchema.virtual('inicio').get(function () {
  if (!this.fecha || !this.hora) return null;
  const [hh, mm] = (this.hora || '00:00').split(':').map(Number);
  const d = new Date(this.fecha);
  d.setHours(hh ?? 0, mm ?? 0, 0, 0);
  return d;
});

// Antes de guardar un nuevo evento, seteamos los tickets disponibles igual a la capacidad y validamos params required para PUBLISHED
EventSchema.pre('validate', function (next) {
  if (this.isNew && (this.entradasDisponibles == null)) {
    this.entradasDisponibles = this.capacidadTotal;
  }
  if (this.estadoPublicacion === 'PUBLISHED' && (!this.imagen || !this.buyUrl)) {
    return next(new Error('imagen y buyUrl son requeridos para estadoPublicacion=PUBLISHED'));
  }
  next();
});

export default model('Event', EventSchema);