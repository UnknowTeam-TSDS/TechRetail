const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
  tiendaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tienda',
    required: true,
  },
  nombre: {
    type: String,
    required: [true, 'El nombre del producto es obligatorio'],
    minlength: [3, 'El nombre debe tener al menos 3 caracteres'],
    trim: true,
  },
  descripcion: {
    type: String,
    trim: true,
    default: '',
  },
  precio: {
    type: Number,
    required: [true, 'El precio es obligatorio'],
    min: [0, 'El precio no puede ser negativo'],
  },
  precioPromocional: {
    type: Number,
    min: [0, 'El precio promocional no puede ser negativo'],
    default: null,
  },
  tipo: {
    type: String,
    enum: ['fisico', 'digital', 'servicio'],
    default: 'fisico',
  },
  stock: {
    type: Number,
    default: 0,
    min: [0, 'El stock no puede ser negativo'],
  },
  categoria: {
    type: String,
    trim: true,
    default: '',
  },
  imagenes: [{
    type: String,
    trim: true,
  }],
  destacado: { type: Boolean, default: false },
  esNovedad: { type: Boolean, default: false },
  esOferta:  { type: Boolean, default: false },
  tags: [{ type: String, trim: true }],
  tituloSEO: {
    type: String,
    trim: true,
    default: '',
    maxlength: [70, 'El título SEO no puede superar los 70 caracteres'],
  },
  descripcionSEO: {
    type: String,
    trim: true,
    default: '',
    maxlength: [160, 'La descripción SEO no puede superar los 160 caracteres'],
  },
  activo: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Producto', productoSchema);
