/*
  Modelo Plan - Schema de Mongoose para planes de suscripción
  TechRetail Solutions S.R.L.
 */

const mongoose = require('mongoose');

// Define el esquema del plan
const planSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre del plan es obligatorio'],
    trim: true,
    minlength: [3, 'El nombre debe tener al menos 3 caracteres'],
  },
  descripcion: {
    type: String,
    required: [true, 'La descripción es obligatoria'],
    trim: true,
  },
  precio: {
    type: Number,
    required: [true, 'El precio es obligatorio'],
    min: [0, 'El precio no puede ser negativo'],
    validate: {
      validator(v) {
        return this.tipo === 'addon' ? v >= 0 : v > 0;
      },
      message: 'Los planes deben tener precio mayor a 0',
    },
  },
  tipo: {
    type: String,
    required: [true, 'El tipo es obligatorio'],
    enum: ['plan', 'addon'],
    message: 'El tipo debe ser "plan" o "addon"',
  },
  activo: {
    type: Boolean,
    default: true,
  },
  fechaCreacion: {
    type: Date,
    default: Date.now,
  },
  fechaActualizacion: {
    type: Date,
    default: Date.now,
  },
});

// Middleware: actualizar fecha de modificación antes de guardar
planSchema.pre('save', function() {
  this.fechaActualizacion = Date.now();
});

// Método personalizado: obtener resumen del plan
planSchema.methods.resumen = function() {
  return `[${this._id}] ${this.nombre} - $${this.precio}`;
};

// Método estático: buscar planes activos
planSchema.statics.planesActivos = function() {
  return this.find({ activo: true });
};

// Crear y exportar el modelo
const Plan = mongoose.model('Plan', planSchema);

module.exports = Plan;