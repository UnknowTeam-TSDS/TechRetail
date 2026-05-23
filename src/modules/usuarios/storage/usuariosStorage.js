/**
  Storage de Usuarios - Persistencia en MongoDB con Mongoose
  TechRetail Solutions S.R.L.
 */

const Usuario = require('../models/Usuario');

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
      new: true,
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
    return resultado !== null;
  } catch (error) {
    console.error('Error al eliminar usuario:', error.message);
    throw error;
  }
};

module.exports = { leerUsuarios, buscarPorId, buscarPorEmail, agregar, actualizar, eliminar };