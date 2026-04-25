/**
 * Storage de Usuarios - Persistencia en archivo JSON
 * TechRetail Solutions S.R.L.
 */

const fs = require('fs');
const path = require('path');

const RUTA_ARCHIVO = path.join(__dirname, '../data/usuarios.json');

// Lee todos los usuarios desde el archivo JSON
const leerUsuarios = () => {
  try {
    const datos = fs.readFileSync(RUTA_ARCHIVO, 'utf-8');
    return JSON.parse(datos);
  } catch (error) {
    console.error('Error al leer usuarios.json:', error.message);
    return [];
  }
};

// Guarda el array de usuarios en el archivo JSON
const guardarUsuarios = (usuarios) => {
  try {
    fs.writeFileSync(RUTA_ARCHIVO, JSON.stringify(usuarios, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error al guardar usuarios.json:', error.message);
    return false;
  }
};

// Busca un usuario por ID
const buscarPorId = (id) => {
  const usuarios = leerUsuarios();
  return usuarios.find((u) => u.id === Number(id)) ?? null;
};

// Agrega un nuevo usuario
const agregar = (usuario) => {
  const usuarios = leerUsuarios();
  usuarios.push(usuario);
  return guardarUsuarios(usuarios);
};

// Actualiza un usuario existente por ID
const actualizar = (id, datosActualizados) => {
  const usuarios = leerUsuarios();
  const indice = usuarios.findIndex((u) => u.id === Number(id));
  if (indice === -1) return false;

  usuarios[indice] = { ...usuarios[indice], ...datosActualizados, id: Number(id) };
  return guardarUsuarios(usuarios);
};

// Elimina un usuario por ID
const eliminar = (id) => {
  const usuarios = leerUsuarios();
  const filtrados = usuarios.filter((u) => u.id !== Number(id));
  if (filtrados.length === usuarios.length) return false;
  return guardarUsuarios(filtrados);
};

module.exports = { leerUsuarios, buscarPorId, agregar, actualizar, eliminar };
