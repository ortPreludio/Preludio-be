import mongoose from 'mongoose'

const categoriaSchema = mongoose.Schema({
    /**
   * Nombre de la categoría (ej: 'Concierto', 'Teatro').
   */
  nombre: {
    type: String,
    required: true,
    unique: true // Recomendado para que no haya categorías duplicadas
  },
  
  /**
   * Descripción opcional de la categoría.
   * El '?' en la imagen indica que es opcional.
   */
  descripcion: {
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

export default mongoose.model('Categoria', categoriaSchema);