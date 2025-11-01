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
        trim: true 
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

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ dni: 1 }, { unique: true });

UserSchema.pre('save', function (next) {
  if (this.isModified('email') && this.email) {
    this.email = this.email.trim().toLowerCase();
  }
  next();
});

export default model("User", UserSchema)
