/**
  Storage de Usuarios - Persistencia en MongoDB con Mongoose
  TechRetail Solutions S.R.L.
 */

const Usuario = require('../models/Usuario');
const Tienda = require('../../Tienda/models/Tienda');
const Producto = require('../../Productos/models/Producto');
const Pedido = require('../../Pedidos/models/Pedido');

// Lee todos los usuarios desde la base de datos
const leerUsuarios = async () => {
  try {
    return await Usuario.find({}).sort({ fechaRegistro: -1 });
  } catch (error) {
    console.error('Error al leer usuarios:', error.message);
    return [];
  }
};

// Busca un usuario por ID
const buscarPorId = async (id) => {
  try {
    return await Usuario.findById(id);
  } catch (error) {
    console.error('Error al buscar usuario:', error.message);
    return null;
  }
};

// Busca un usuario por email
const buscarPorEmail = async (email) => {
  try {
    return await Usuario.findOne({ email: email.toLowerCase() });
  } catch (error) {
    console.error('Error al buscar usuario por email:', error.message);
    return null;
  }
};

// Agrega un nuevo usuario a la base de datos
const agregar = async (datos) => {
  try {
    const nuevoUsuario = new Usuario(datos);
    return await nuevoUsuario.save();
  } catch (error) {
    console.error('Error al agregar usuario:', error.message);
    throw error;
  }
};

// Actualiza un usuario existente
const actualizar = async (id, datos) => {
  try {
    return await Usuario.findByIdAndUpdate(id, datos, {
      returnDocument: 'after',
      runValidators: true,
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error.message);
    throw error;
  }
};

// Elimina un usuario
const eliminar = async (id) => {
  try {
    const resultado = await Usuario.findByIdAndDelete(id);

    if (!resultado) return false;

    const tiendas = await Tienda.find({ usuarioId: id });
    const tiendaIds = tiendas.map(tienda => tienda._id);

    if (tiendaIds.length > 0) {
      await Promise.all([
        Producto.deleteMany({ tiendaId: { $in: tiendaIds } }),
        Pedido.deleteMany({ tiendaId: { $in: tiendaIds } }),
      ]);
      await Tienda.deleteMany({ _id: { $in: tiendaIds } });
    }

    return true;
  } catch (error) {
    console.error('Error al eliminar usuario:', error.message);
    throw error;
  }
};

module.exports = { leerUsuarios, buscarPorId, buscarPorEmail, agregar, actualizar, eliminar };
