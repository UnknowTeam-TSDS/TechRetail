/*
  Modelo Usuario - Schema de Mongoose para usuarios registrados
  TechRetail Solutions S.R.L.
 */

const mongoose = require('mongoose');

// Define el esquema del usuario
const usuarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true,
    minlength: [3, 'El nombre debe tener al menos 3 caracteres'],
  },
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    unique: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Ingresa un email válido'],
  },
  empresa: {
    type: String,
    required: [true, 'El nombre de la empresa es obligatorio'],
    trim: true,
  },
  telefono: {
    type: String,
    required: [true, 'El teléfono es obligatorio'],
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: [true, 'El usuario debe tener un plan'],
  },
  estado: {
    type: String,
    enum: ['activo', 'inactivo', 'suspendido'],
    default: 'activo',
  },
  fechaRegistro: {
    type: Date,
    default: Date.now,
  },
  fechaActualizacion: {
    type: Date,
    default: Date.now,
  },
});

// Middleware: actualizar fecha de modificación antes de guardar
usuarioSchema.pre('save', function() {
  this.fechaActualizacion = Date.now();
});

// Middleware: poblar el plan al obtener un usuario
usuarioSchema.pre(/^find/, function() {
  this.populate({
    path: 'planId',
    select: 'nombre precio tipo',
  });
});

// Método personalizado: email formateado
usuarioSchema.methods.emailFormato = function() {
  return this.email.toLowerCase();
};

// Crear y exportar el modelo
const Usuario = mongoose.model('Usuario', usuarioSchema);

module.exports = Usuario;