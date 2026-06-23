const Producto = require('../models/Producto');

const listarPorTienda = async (tiendaId) => {
  return Producto.find({ tiendaId }).sort({ createdAt: -1 });
};

const agregar = async (datos) => {
  return Producto.create(datos);
};

const eliminar = async (id, tiendaId) => {
  return Producto.findOneAndDelete({ _id: id, tiendaId });
};

const cambiarEstado = async (id, tiendaId, activo) => {
  return Producto.findOneAndUpdate(
    { _id: id, tiendaId },
    { activo },
    { returnDocument: 'after' }
  );
};

const contarTodos = async () => {
  return Producto.countDocuments();
};

const categoriasPorTienda = async (tiendaId) => {
  const cats = await Producto.distinct('categoria', { tiendaId, categoria: { $ne: '' } });
  return cats.filter(Boolean).sort();
};

module.exports = { listarPorTienda, agregar, eliminar, cambiarEstado, contarTodos, categoriasPorTienda };
