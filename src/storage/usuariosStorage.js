/*
 Storage de Usuarios - Persistencia en archivo JSON
 TechRetail Solutions S.R.L.
 */

const fs = require('fs');
const path = require('path');

// Ruta absoluta al archivo de datos
const RUTA_ARCHIVO = path.join(__dirname, '../data/usuarios.json');

// Lee todos los usuarios desde el archivo JSON
const leerUsuarios = () => {
  try {
    const datos = fs.readFileSync(RUTA_ARCHIVO, 'utf-8');
    return JSON.parse(datos);
  } catch (error) {
    console.error('Error al leer usuarios.json:', error.message);
    return []; // Retorna array vacío si el archivo no existe o está dañado
  }
};

// Guarda el array completo de usuarios en el archivo JSON
const guardarUsuarios = (usuarios) => {
  try {
    fs.writeFileSync(RUTA_ARCHIVO, JSON.stringify(usuarios, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error al guardar usuarios.json:', error.message);
    return false;
  }
};

// Busca un usuario por ID y retorna el objeto o null si no existe
const buscarPorId = (id) => {
  const usuarios = leerUsuarios();
  return usuarios.find((u) => u.id === Number(id)) ?? null;
};

// Agrega un nuevo usuario al archivo JSON
const agregar = (usuario) => {
  const usuarios = leerUsuarios();
  usuarios.push(usuario);
  return guardarUsuarios(usuarios);
};

// Actualiza un usuario existente fusionando los datos nuevos con los actuales
const actualizar = (id, datosActualizados) => {
  const usuarios = leerUsuarios();
  const indice = usuarios.findIndex((u) => u.id === Number(id));
  if (indice === -1) return false; // Retorna false si el usuario no existe

  usuarios[indice] = { ...usuarios[indice], ...datosActualizados, id: Number(id) }; // Spread operator preserva campos no enviados
  return guardarUsuarios(usuarios);
};

// Elimina un usuario por ID y retorna false si no existía
const eliminar = (id) => {
  const usuarios = leerUsuarios();
  const filtrados = usuarios.filter((u) => u.id !== Number(id));
  if (filtrados.length === usuarios.length) return false; // No se eliminó ninguno
  return guardarUsuarios(filtrados);
};

module.exports = { leerUsuarios, buscarPorId, agregar, actualizar, eliminar };
