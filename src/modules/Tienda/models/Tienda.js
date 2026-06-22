const mongoose = require('mongoose');

const tiendaSchema = new mongoose.Schema({
  usuarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
    unique: true,
  },
  nombre: {
    type: String,
    required: [true, 'El nombre de la tienda es obligatorio'],
    minlength: [3, 'El nombre debe tener al menos 3 caracteres'],
    trim: true,
  },
  descripcion: {
    type: String,
    trim: true,
    default: '',
  },
  rubro: {
    type: String,
    enum: ['moda', 'electronica', 'hogar', 'alimentos', 'servicios', 'otro'],
    required: [true, 'El rubro es obligatorio'],
  },
  colorPrimario: {
    type: String,
    default: '#1D4ED8',
    match: [/^#[0-9A-Fa-f]{6}$/, 'El color debe ser un valor hexadecimal válido'],
  },
  estado: {
    type: String,
    enum: ['en_construccion', 'activa', 'inactiva'],
    default: 'en_construccion',
  },
}, { timestamps: true });

module.exports = mongoose.model('Tienda', tiendaSchema);
