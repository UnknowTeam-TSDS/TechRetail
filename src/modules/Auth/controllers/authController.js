/*
  Controlador de Autenticación
  TechRetail Solutions S.R.L.
  
 */

const Usuario = require('../../usuarios/models/Usuario');

// GET /login — Renderiza la vista de login
const vistaLogin = (req, res) => {
  res.render('login', { 
    titulo: 'Iniciar Sesión' 
  });
};

// POST /login — Valida credenciales y crea sesión
const loginUsuario = async (req, res) => {
  try {
    const { email, contrasena } = req.body;

    // Validar que lleguen email y contraseña
    if (!email || !contrasena) {
      return res.status(400).render('login', {
        titulo: 'Iniciar Sesión',
        error: 'Email y contraseña son obligatorios'
      });
    }

    // Buscar usuario por email (select: false para incluir contraseña)
    const usuario = await Usuario.findOne({ email: email.toLowerCase() }).select('+contrasena');

    // Si no existe el usuario
    if (!usuario) {
      return res.status(401).render('login', {
        titulo: 'Iniciar Sesión',
        error: 'Email o contraseña incorrectos'
      });
    }

    // Comparar contraseña ingresada con la hasheada
    const contrasenaValida = await usuario.compararContrasena(contrasena);

    if (!contrasenaValida) {
      return res.status(401).render('login', {
        titulo: 'Iniciar Sesión',
        error: 'Email o contraseña incorrectos'
      });
    }

    // Validar que el usuario esté activo
    if (usuario.estado !== 'activo') {
      return res.status(403).render('login', {
        titulo: 'Iniciar Sesión',
        error: 'Tu cuenta está inactiva'
      });
    }

    // Crear sesión del usuario
    req.session.usuario = {
      id: usuario._id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,
    };

    console.log(`✓ Login exitoso: ${usuario.email} (${usuario.rol})`);

    // Redirigir según el rol
    if (usuario.rol === 'admin') {
      res.redirect('/planes/vista');
    } else {
      res.redirect('/');
    }

  } catch (error) {
    console.error('Error al hacer login:', error.message);
    res.status(500).render('login', {
      titulo: 'Iniciar Sesión',
      error: 'Error al iniciar sesión. Intenta nuevamente.'
    });
  }
};

// POST /logout — Destruye la sesión
const logout = (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error('Error al cerrar sesión:', error);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al cerrar sesión'
      });
    }

    console.log('✓ Logout exitoso');
    res.redirect('/');
  });
};

module.exports = { 
  vistaLogin, 
  loginUsuario, 
  logout 
};