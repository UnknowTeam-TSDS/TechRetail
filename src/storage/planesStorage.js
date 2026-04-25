const fs = require('fs');
const path = require('path');

const RUTA_ARCHIVO = path.join(__dirname, '../data/planes.json');

const leerPlanes = () => {
  try {
    return JSON.parse(fs.readFileSync(RUTA_ARCHIVO, 'utf-8'));
  } catch (error) {
    console.error('Error al leer planes.json:', error.message);
    return [];
  }
};

const guardarPlanes = (planes) => {
  try {
    fs.writeFileSync(RUTA_ARCHIVO, JSON.stringify(planes, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error al guardar planes.json:', error.message);
    return false;
  }
};

const buscarPorId = (id) => {
  return leerPlanes().find((p) => p.id === Number(id)) ?? null;
};

const agregar = (plan) => {
  const planes = leerPlanes();
  planes.push(plan);
  return guardarPlanes(planes);
};

const actualizar = (id, datos) => {
  const planes = leerPlanes();
  const i = planes.findIndex((p) => p.id === Number(id));
  if (i === -1) return false;
  planes[i] = { ...planes[i], ...datos, id: Number(id) };
  return guardarPlanes(planes);
};

const eliminar = (id) => {
  const planes = leerPlanes();
  const filtrados = planes.filter((p) => p.id !== Number(id));
  if (filtrados.length === planes.length) return false;
  return guardarPlanes(filtrados);
};

module.exports = { leerPlanes, buscarPorId, agregar, actualizar, eliminar };