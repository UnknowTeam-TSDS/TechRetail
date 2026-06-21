/*
  Controlador de Usuarios - Con async/await y MongoDB
  TechRetail Solutions S.R.L.
 */

const Usuario = require('../models/Usuario');
const storage = require('../storage/usuariosStorage');
const Plan = require('../../Planes/models/Plan');

// GET /api/usuarios — Lista todos los usuarios
const listarUsuarios = async (req, res) => {
  try {
    const usuarios = await storage.leerUsuarios();
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ 
      ok: false, 
      mensaje: 'Error al obtener usuarios',
      error: error.message 
    });
  }
};

// GET /api/usuarios/:id — Obtiene un usuario por ID
const obtenerUsuario = async (req, res) => {
  try {
    const usuario = await storage.buscarPorId(req.params.id);
    
    if (!usuario) {
      return res.status(404).json({ 
        ok: false, 
        mensaje: `Usuario con id ${req.params.id} no encontrado.` 
      });
    }
    
    res.json({ ok: true, datos: usuario });
  } catch (error) {
    res.status(500).json({ 
      ok: false, 
      mensaje: 'Error al obtener el usuario',
      error: error.message 
    });
  }
};

// POST /api/usuarios — Crea un nuevo usuario
const crearUsuario = async (req, res) => {
  try {
    // Validar que no exista otro usuario con el mismo email
    const usuarioExistente = await storage.buscarPorEmail(req.body.email);
    if (usuarioExistente) {
      return res.status(400).json({ 
        ok: false, 
        mensaje: 'Ya existe un usuario con ese email.' 
      });
    }
    
    // Crear el usuario
    const usuarioGuardado = await storage.agregar(req.body);

    // Notificar a todos los admins conectados via WebSocket
    req.app.get('io').emit('nuevo-usuario', { nombre: usuarioGuardado.nombre, email: usuarioGuardado.email });

    res.status(201).json(usuarioGuardado);
  } catch (error) {
    if (error.errors) {
      const mensajesError = Object.keys(error.errors)
        .map(campo => error.errors[campo].message)
        .join(', ');
      return res.status(400).json({ 
        ok: false, 
        mensaje: `Error de validación: ${mensajesError}` 
      });
    }
    
    // Manejo de error de duplicado (email único)
    if (error.code === 11000) {
      return res.status(400).json({ 
        ok: false, 
        mensaje: 'Ya existe un usuario con ese email.' 
      });
    }
    
    res.status(500).json({ 
      ok: false, 
      mensaje: 'Error al crear el usuario',
      error: error.message 
    });
  }
};

// PUT /api/usuarios/:id — Actualiza un usuario existente
const actualizarUsuario = async (req, res) => {
  try {
    // Verificar que el usuario exista
    const usuarioExistente = await storage.buscarPorId(req.params.id);
    
    if (!usuarioExistente) {
      return res.status(404).json({ 
        ok: false, 
        mensaje: `Usuario con id ${req.params.id} no encontrado.` 
      });
    }
    
    // Si intenta cambiar el email, verificar que no exista
    if (req.body.email && req.body.email !== usuarioExistente.email) {
      const otroUsuario = await storage.buscarPorEmail(req.body.email);
      if (otroUsuario) {
        return res.status(400).json({ 
          ok: false, 
          mensaje: 'Ya existe otro usuario con ese email.' 
        });
      }
    }
    
    // Actualizar el usuario
    const usuarioActualizado = await storage.actualizar(req.params.id, req.body);
    
    res.json(usuarioActualizado);
  } catch (error) {
    if (error.errors) {
      const mensajesError = Object.keys(error.errors)
        .map(campo => error.errors[campo].message)
        .join(', ');
      return res.status(400).json({ 
        ok: false, 
        mensaje: `Error de validación: ${mensajesError}` 
      });
    }
    
    res.status(500).json({ 
      ok: false, 
      mensaje: 'Error al actualizar el usuario',
      error: error.message 
    });
  }
};

// DELETE /api/usuarios/:id — Elimina un usuario
const eliminarUsuario = async (req, res) => {
  try {
    const resultado = await storage.eliminar(req.params.id);
    
    if (!resultado) {
      return res.status(404).json({ 
        ok: false, 
        mensaje: `Usuario ${req.params.id} no encontrado.` 
      });
    }
    
    res.json({ 
      ok: true, 
      mensaje: `Usuario ${req.params.id} eliminado correctamente.` 
    });
  } catch (error) {
    res.status(500).json({ 
      ok: false, 
      mensaje: 'Error al eliminar el usuario',
      error: error.message 
    });
  }
};

// GET /usuarios/vista — Renderiza la vista Pug con usuarios (solo clientes)
const vistaUsuarios = async (req, res) => {
  try {
    // Obtener solo usuarios con rol 'cliente'
    const usuarios = await Usuario.find({ rol: 'cliente' }).populate({
      path: 'planId',
      select: 'nombre precio tipo',
    });
    
    const planes = await Plan.find({});
    
    res.render('usuarios', { 
      titulo: 'Gestión de Usuarios', 
      usuarios: usuarios,
      planes: planes
    });
  } catch (error) {
    res.status(500).render('usuarios', {
      titulo: 'Gestión de Usuarios',
      usuarios: [],
      planes: [],
      error: 'Error al cargar los usuarios'
    });
  }
};

// POST /usuarios/form — Crea un usuario desde el formulario HTML con PRG
const crearUsuarioForm = async (req, res) => {
  try {
    // Obtener datos del formulario
    const { nombre, email, empresa, telefono, contrasena, plan } = req.body;

    // Buscar el plan por nombre para obtener su ID
    const planEncontrado = await Plan.findOne({ 
      nombre: plan 
    });

    // Si no existe el plan, enviar error
    if (!planEncontrado) {
      return res.status(400).json({
        ok: false,
        mensaje: `El plan "${plan}" no existe`,
      });
    }

    // Crear el usuario con todos los datos (incluyendo contraseña)
    const nuevoUsuario = await storage.agregar({
      nombre,
      email,
      empresa,
      telefono,
      contrasena,  // ← AGREGAR CONTRASEÑA
      planId: planEncontrado._id,
      rol: 'cliente', // ← Los usuarios registrados son clientes
    });

    // Notificar via WebSocket
    req.app.get('io').emit('nuevo-usuario', { nombre: nuevoUsuario.nombre, email: nuevoUsuario.email });

    // Redirigir a la vista de usuarios
    res.redirect('/usuarios/vista');
  } catch (error) {
    console.error('Error al agregar usuario:', error.message);
    res.status(400).json({
      ok: false,
      mensaje: 'Error al registrar usuario',
      error: error.message,
    });
  }
};


// POST /usuarios/estado/:id — Cambia el estado de un usuario desde la vista
const cambiarEstado = async (req, res) => {
  try {
    const { estado } = req.body;
    await storage.actualizar(req.params.id, { estado });
    res.redirect('/usuarios/vista');
  } catch (error) {
    res.redirect('/usuarios/vista');
  }
};

module.exports = {
  listarUsuarios,
  obtenerUsuario,
  crearUsuario,
  crearUsuarioForm,
  actualizarUsuario,
  eliminarUsuario,
  vistaUsuarios,
  cambiarEstado,
};