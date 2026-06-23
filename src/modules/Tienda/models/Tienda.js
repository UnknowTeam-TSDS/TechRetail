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
  emailContacto: {
    type: String,
    required: [true, 'El email de contacto es obligatorio (Res. 104/2005 Defensa del Consumidor)'],
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'El email de contacto no es válido'],
  },
  telefono: {
    type: String,
    required: [true, 'El teléfono es obligatorio (Res. 104/2005 Defensa del Consumidor)'],
    trim: true,
  },
  direccion: {
    type: String,
    required: [true, 'La dirección es obligatoria (Res. 104/2005 Defensa del Consumidor)'],
    trim: true,
  },
  whatsapp: {
    type: String,
    trim: true,
    default: '',
  },
  estado: {
    type: String,
    enum: ['en_construccion', 'activa', 'inactiva'],
    default: 'en_construccion',
  },
}, { timestamps: true });

module.exports = mongoose.model('Tienda', tiendaSchema);
