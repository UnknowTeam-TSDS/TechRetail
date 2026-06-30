const mongoose = require('mongoose');
const { PAGO_IDS, ENVIO_IDS } = require('../../Tienda/opcionesComerciales');

// Un pedido registra una compra simulada desde el checkout público.
// No mueve dinero real: deja constancia de la intención de compra para que
// el dueño la vea en "Mis pedidos" y el admin la cuente en sus métricas.
const pedidoSchema = new mongoose.Schema({
  tiendaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tienda',
    required: true,
  },
  // Copia de los datos del producto al momento de la compra (precio histórico).
  items: [{
    productoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto' },
    nombre: { type: String, required: true },
    precioUnitario: { type: Number, required: true, min: 0 },
    cantidad: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 0 },
  }],
  total: {
    type: Number,
    required: true,
    min: [0, 'El total no puede ser negativo'],
  },
  medioPago: {
    type: String,
    enum: PAGO_IDS,
    required: [true, 'El medio de pago es obligatorio'],
  },
  medioEnvio: {
    type: String,
    enum: ENVIO_IDS,
    default: null,
  },
  // Datos de contacto del comprador (obligatorios por Defensa del Consumidor).
  comprador: {
    nombre: { type: String, required: [true, 'El nombre del comprador es obligatorio'], trim: true },
    email: {
      type: String,
      required: [true, 'El email del comprador es obligatorio'],
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'El email del comprador no es válido'],
    },
    telefono: { type: String, trim: true, default: '' },
  },
  estado: {
    type: String,
    enum: ['pendiente', 'confirmado', 'cancelado'],
    default: 'pendiente',
  },
  // Marca que el pago fue simulado (sin pasarela real). Documenta el alcance del TP.
  esSimulado: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Pedido', pedidoSchema);
