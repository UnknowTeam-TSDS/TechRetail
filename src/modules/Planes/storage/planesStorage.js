/*
  Storage de Planes - Persistencia en MongoDB con Mongoose
  TechRetail Solutions S.R.L.
 */

const Plan = require('../models/Plan');
const Usuario = require('../../usuarios/models/Usuario');

// Lee todos los planes desde la base de datos
const leerPlanes = async () => {
  try {
    return await Plan.find({}).sort({ fechaCreacion: -1 });
  } catch (error) {
    console.error('Error al leer planes:', error.message);
    return [];
  }
};

// Busca un plan por ID
const buscarPorId = async (id) => {
  try {
    return await Plan.findById(id);
  } catch (error) {
    console.error('Error al buscar plan:', error.message);
    return null;
  }
};

// Agrega un nuevo plan a la base de datos
const agregar = async (datos) => {
  try {
    const nuevoPlan = new Plan(datos);
    return await nuevoPlan.save();
  } catch (error) {
    console.error('Error al agregar plan:', error.message);
    throw error;
  }
};

// Actualiza un plan existente
const actualizar = async (id, datos) => {
  try {
    return await Plan.findByIdAndUpdate(id, datos, {
      returnDocument: 'after',
      runValidators: true,
    });
  } catch (error) {
    console.error('Error al actualizar plan:', error.message);
    throw error;
  }
};

// Elimina un plan
const eliminar = async (id) => {
  try {
    const resultado = await Plan.findByIdAndDelete(id);
    return resultado !== null;
  } catch (error) {
    console.error('Error al eliminar plan:', error.message);
    throw error;
  }
};

const estaEnUso = async (id) => {
  return !!(await Usuario.exists({
    $or: [
      { planId: id },
      { addons: id },
    ],
  }));
};

module.exports = { leerPlanes, buscarPorId, agregar, actualizar, eliminar, estaEnUso };