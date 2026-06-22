const Tienda = require('../models/Tienda');

const buscarPorUsuario = async (usuarioId) => {
  return Tienda.findOne({ usuarioId });
};

const guardarTienda = async (usuarioId, datos) => {
  return Tienda.findOneAndUpdate(
    { usuarioId },
    { ...datos, usuarioId },
    { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true }
  );
};

const contarTiendas = async () => {
  return Tienda.countDocuments();
};

const listarTiendas = async () => {
  return Tienda.find().populate({ path: 'usuarioId', select: 'nombre email' });
};

module.exports = { buscarPorUsuario, guardarTienda, contarTiendas, listarTiendas };
