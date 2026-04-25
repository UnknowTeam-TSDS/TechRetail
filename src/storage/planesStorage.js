/**
 * Storage de Planes - Persistencia en archivo JSON
 * TechRetail Solutions S.R.L.
 */

const fs = require('fs');
const path = require('path');

// Ruta absoluta al archivo de datos
const RUTA_ARCHIVO = path.join(__dirname, '../data/planes.json');

// Lee todos los planes desde el archivo JSON
const leerPlanes = () => {
  try {
    return JSON.parse(fs.readFileSync(RUTA_ARCHIVO, 'utf-8'));
  } catch (error) {
    console.error('Error al leer planes.json:', error.message);
    return []; // Retorna array vacío si el archivo no existe o está dañado
  }
};

// Guarda el array completo de planes en el archivo JSON
const guardarPlanes = (planes) => {
  try {
    fs.writeFileSync(RUTA_ARCHIVO, JSON.stringify(planes, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error al guardar planes.json:', error.message);
    return false;
  }
};

// Busca un plan por ID y retorna el objeto o null si no existe
const buscarPorId = (id) => {
  return leerPlanes().find((p) => p.id === Number(id)) ?? null;
};

// Agrega un nuevo plan al archivo JSON
const agregar = (plan) => {
  const planes = leerPlanes();
  planes.push(plan);
  return guardarPlanes(planes);
};

// Actualiza un plan existente fusionando los datos nuevos con los actuales
const actualizar = (id, datos) => {
  const planes = leerPlanes();
  const i = planes.findIndex((p) => p.id === Number(id));
  if (i === -1) return false; // Retorna false si el plan no existe
  planes[i] = { ...planes[i], ...datos, id: Number(id) }; // Spread operator preserva campos no enviados
  return guardarPlanes(planes);
};

// Elimina un plan por ID y retorna false si no existía
const eliminar = (id) => {
  const planes = leerPlanes();
  const filtrados = planes.filter((p) => p.id !== Number(id));
  if (filtrados.length === planes.length) return false; // No se eliminó ninguno
  return guardarPlanes(filtrados);
};

module.exports = { leerPlanes, buscarPorId, agregar, actualizar, eliminar };
