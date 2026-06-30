const Producto = require('../models/Producto');

const listarPorTienda = async (tiendaId) => {
  return Producto.find({ tiendaId }).sort({ createdAt: -1 });
};

const agregar = async (datos) => {
  return Producto.create(datos);
};

const buscarPorId = async (id, tiendaId) => {
  return Producto.findOne({ _id: id, tiendaId });
};

const actualizar = async (id, tiendaId, datos) => {
  return Producto.findOneAndUpdate(
    { _id: id, tiendaId },
    datos,
    { returnDocument: 'after', runValidators: true }
  );
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

const contarPorTienda = async (tiendaId) => {
  return Producto.countDocuments({ tiendaId });
};

const listarActivosPorTienda = async (tiendaId) => {
  return Producto.find({ tiendaId, activo: true }).sort({ createdAt: -1 });
};

const buscarPublicoPorId = async (id, tiendaId) => {
  return Producto.findOne({ _id: id, tiendaId, activo: true });
};

const buscarActivosPorIds = async (tiendaId, ids) => {
  return Producto.find({ _id: { $in: ids }, tiendaId, activo: true });
};

const categoriasPorTienda = async (tiendaId) => {
  const cats = await Producto.distinct('categoria', { tiendaId, categoria: { $ne: '' } });
  return cats.filter(Boolean).sort();
};

module.exports = {
  listarPorTienda,
  listarActivosPorTienda,
  buscarPublicoPorId,
  buscarActivosPorIds,
  agregar,
  buscarPorId,
  actualizar,
  eliminar,
  cambiarEstado,
  contarTodos,
  contarPorTienda,
  categoriasPorTienda,
};
