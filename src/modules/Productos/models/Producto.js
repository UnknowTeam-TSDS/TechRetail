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
  pesoKg: {
    type: Number,
    min: [0.01, 'El peso debe ser mayor a 0'],
    required: [
      function() { return this.tipo === 'fisico'; },
      'El peso es obligatorio para productos fisicos',
    ],
  },
  dimensiones: {
    altoCm: {
      type: Number,
      min: [0.01, 'El alto debe ser mayor a 0'],
      required: [
        function() { return this.tipo === 'fisico'; },
        'El alto es obligatorio para productos fisicos',
      ],
    },
    anchoCm: {
      type: Number,
      min: [0.01, 'El ancho debe ser mayor a 0'],
      required: [
        function() { return this.tipo === 'fisico'; },
        'El ancho es obligatorio para productos fisicos',
      ],
    },
    largoCm: {
      type: Number,
      min: [0.01, 'El largo debe ser mayor a 0'],
      required: [
        function() { return this.tipo === 'fisico'; },
        'El largo es obligatorio para productos fisicos',
      ],
    },
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
