/*
  Modelo Usuario - Schema de Mongoose para usuarios y admins
  TechRetail Solutions S.R.L.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
  contrasena: {
    type: String,
    required: [true, 'La contraseña es obligatoria'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    select: false, // No incluir contraseña en queries por defecto
  },
  empresa: {
    type: String,
    trim: true,
  },
  telefono: {
    type: String,
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
  },
  rol: {
    type: String,
    enum: ['admin', 'cliente'],
    default: 'cliente',
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

// Middleware: hashear contraseña antes de guardar
usuarioSchema.pre('save', async function() {
  // Si la contraseña no fue modificada, pasar al siguiente
  if (!this.isModified('contrasena')) {
    return;
  }

  try {
    // Generar salt y hashear
    const salt = await bcrypt.genSalt(10);
    this.contrasena = await bcrypt.hash(this.contrasena, salt);
  } catch (error) {
    throw error;
  }
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

// Método: comparar contraseña ingresada con la hasheada
usuarioSchema.methods.compararContrasena = async function(contrasenaBuscada) {
  return await bcrypt.compare(contrasenaBuscada, this.contrasena);
};

// Método personalizado: email formateado
usuarioSchema.methods.emailFormato = function() {
  return this.email.toLowerCase();
};

// Crear y exportar el modelo
const Usuario = mongoose.model('Usuario', usuarioSchema);

module.exports = Usuario;