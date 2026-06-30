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

const buscarPorId = async (id) => {
  return Tienda.findById(id);
};

const actualizarEstado = async (usuarioId, estado) => {
  return Tienda.findOneAndUpdate({ usuarioId }, { estado }, { returnDocument: 'after' });
};

// Guarda solo los medios de pago, sin tocar el resto de la configuración.
const actualizarMediosPago = async (usuarioId, mediosPago) => {
  return Tienda.findOneAndUpdate(
    { usuarioId },
    { mediosPago },
    { returnDocument: 'after', runValidators: true }
  );
};

// Guarda los medios de envío y, si corresponde, el monto de envío gratis.
const actualizarMediosEnvio = async (usuarioId, mediosEnvio, envioGratisMonto) => {
  return Tienda.findOneAndUpdate(
    { usuarioId },
    { mediosEnvio, envioGratisMonto },
    { returnDocument: 'after', runValidators: true }
  );
};

module.exports = {
  buscarPorUsuario,
  buscarPorId,
  guardarTienda,
  actualizarEstado,
  actualizarMediosPago,
  actualizarMediosEnvio,
  contarTiendas,
  listarTiendas,
};
