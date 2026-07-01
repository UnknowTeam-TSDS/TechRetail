const Pedido = require('../models/Pedido');

const crear = async (datos) => {
  return Pedido.create(datos);
};

// Pedidos de una tienda, del más nuevo al más viejo (para el panel del dueño).
const listarPorTienda = async (tiendaId) => {
  return Pedido.find({ tiendaId }).sort({ createdAt: -1 });
};

// Filtra por tiendaId además del id para que un dueño no pueda ver pedidos ajenos.
const buscarPorId = async (id, tiendaId) => {
  return Pedido.findOne({ _id: id, tiendaId });
};

// Cambia el estado del pedido (el filtro por tiendaId evita tocar pedidos ajenos).
const actualizarEstado = async (id, tiendaId, estado) => {
  return Pedido.findOneAndUpdate({ _id: id, tiendaId }, { estado }, { returnDocument: 'after' });
};

const contarTodos = async () => {
  return Pedido.countDocuments();
};

const contarPorTienda = async (tiendaId) => {
  return Pedido.countDocuments({ tiendaId });
};

// Agrupa los pedidos por estado con su cantidad y monto total (para Finanzas).
const resumenPorEstado = async () => {
  return Pedido.aggregate([
    { $group: { _id: '$estado', cantidad: { $sum: 1 }, total: { $sum: '$total' } } },
  ]);
};

module.exports = {
  crear,
  listarPorTienda,
  buscarPorId,
  actualizarEstado,
  contarTodos,
  contarPorTienda,
  resumenPorEstado,
};
