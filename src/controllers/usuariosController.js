/**
 * Controlador de Usuarios
 * TechRetail Solutions S.R.L.
 */

const Usuario = require('../models/Usuario');
const storage = require('../storage/usuariosStorage');

// GET /api/usuarios — Lista todos los usuarios
const listarUsuarios = (req, res) => {
  const usuarios = storage.leerUsuarios();
  res.json({ ok: true, cantidad: usuarios.length, datos: usuarios });
};

// GET /api/usuarios/:id — Obtiene un usuario por ID (ruta dinámica)
const obtenerUsuario = (req, res) => {
  const { id } = req.params;
  const usuario = storage.buscarPorId(id);

  if (!usuario) {
    return res.status(404).json({ ok: false, mensaje: `Usuario con id ${id} no encontrado.` });
  }
  res.json({ ok: true, datos: usuario });
};

// POST /api/usuarios — Registra un nuevo usuario/tienda
const crearUsuario = (req, res) => {
  const { nombre, email, plan, empresa } = req.body;

  const nuevoUsuario = new Usuario({ nombre, email, plan, empresa });

  if (!nuevoUsuario.esValido()) {
    return res.status(400).json({
      ok: false,
      mensaje: 'Datos inválidos. Se requiere: nombre, email válido y plan (Starter, Growth o Pro).',
    });
  }

  const exito = storage.agregar(nuevoUsuario);
  if (!exito) {
    return res.status(500).json({ ok: false, mensaje: 'Error al guardar el usuario.' });
  }

  res.redirect('/usuarios/vista');
};

// PUT /api/usuarios/:id — Actualiza datos de un usuario
const actualizarUsuario = (req, res) => {
  const { id } = req.params;
  const usuarioExistente = storage.buscarPorId(id);

  if (!usuarioExistente) {
    return res.status(404).json({ ok: false, mensaje: `Usuario con id ${id} no encontrado.` });
  }

  const exito = storage.actualizar(id, req.body);
  if (!exito) {
    return res.status(500).json({ ok: false, mensaje: 'Error al actualizar el usuario.' });
  }

  const actualizado = storage.buscarPorId(id);
  res.json({ ok: true, mensaje: 'Usuario actualizado.', datos: actualizado });
};

// DELETE /api/usuarios/:id — Elimina un usuario
const eliminarUsuario = (req, res) => {
  if (!storage.eliminar(req.params.id)) {
    return res.status(404).json({ ok: false, mensaje: `Usuario ${req.params.id} no encontrado.` });
  }
  res.redirect('/usuarios/vista');
};

// GET /usuarios — Vista Pug con listado de usuarios
const vistaUsuarios = (req, res) => {
  const usuarios = storage.leerUsuarios();
  res.render('usuarios', { titulo: 'Clientes Registrados', usuarios });
};

module.exports = {
  listarUsuarios,
  obtenerUsuario,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
  vistaUsuarios,
};
