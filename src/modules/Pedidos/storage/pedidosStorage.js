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

const contarTodos = async () => {
  return Pedido.countDocuments();
};

const contarPorTienda = async (tiendaId) => {
  return Pedido.countDocuments({ tiendaId });
};

module.exports = { crear, listarPorTienda, buscarPorId, contarTodos, contarPorTienda };
